import { afterEach, describe, expect, mock, test } from "bun:test"
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Plugin } from "@opencode/plugin"
import type { Info, ToolContext, ToolEditor } from "@opencode/plugin/promise/tool"
import type { CommandDefinition, CommandEditor } from "@opencode/plugin/promise/command"
import plugin, { setupFeedback } from "./index"
import { maxEncodedRecord, maxMessageText, maxMessages, maxText, prefix, readRecord, snapshot } from "./record"
import type { Message, Record as FeedbackRecord } from "./record"

type Storage = Plugin.Context["storage"]
const temporary: string[] = []
afterEach(async () => { await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true }))) })

async function diskStorage(directory?: string): Promise<{ directory: string; storage: Storage }> {
  directory ??= await mkdtemp(join(tmpdir(), "opencode-feedback-"))
  if (!temporary.includes(directory)) temporary.push(directory)
  const root = directory
  const file = (key: string) => join(root, Buffer.from(key).toString("hex") + ".json")
  const storage: Storage = {
    get: async (key) => {
      try { return JSON.parse(await readFile(file(key), "utf8")) }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error }
    },
    set: async (key, value) => { await writeFile(file(key), JSON.stringify(value)) },
    remove: async (key) => { await rm(file(key), { force: true }) },
    scan: async ({ prefix, after, limit = 10 }) => {
      const keys = (await readdir(root)).map((name) => Buffer.from(name.slice(0, -5), "hex").toString())
        .filter((key) => key.startsWith(prefix) && (!after || key > after)).sort()
      const entries = await Promise.all(keys.slice(0, limit).map(async (key) => ({ key, value: (await storage.get(key))! })))
      return { entries, ...(keys.length > limit ? { next: entries.at(-1)!.key } : {}) }
    },
  }
  return { directory, storage }
}

async function fixture(storage?: Storage, directory = "/actual-session") {
  storage ??= (await diskStorage()).storage
  const tools = new Map<string, Info>()
  let command: CommandDefinition | undefined
  let messages: Message[] = [{ id: "message-a", type: "user", text: "A bug happens here." }]
  let contextRead: (() => Promise<Message[]>) | undefined
  const disposed: string[] = []
  const context = mock(async (_input: unknown) => structuredClone(contextRead ? await contextRead() : messages))
  const get = mock(async (_input: unknown) => ({ location: { directory } }))
  const synthetic = mock(async (input: { sessionID: string; text: string; resume: boolean }) => {
    messages.push({ id: "ack-" + messages.length, type: "synthetic", text: input.text })
  })
  const forbidden = mock(async () => { throw new Error("Unexpected agent activity") })
  const ctx = {
    command: { transform: async (callback: (editor: CommandEditor) => void) => {
      callback({ add: (value: CommandDefinition) => { command = value } } as CommandEditor)
      return { dispose: async () => { disposed.push("command") } }
    } },
    tool: { transform: async (callback: (editor: ToolEditor) => void) => {
      callback({ add: (value: Info) => { tools.set(value.name, value) } } as ToolEditor)
      return { dispose: async () => { disposed.push("tool") } }
    } },
    session: { context, get, synthetic, prompt: forbidden, generate: forbidden, create: forbidden },
    storage,
  } as unknown as Parameters<typeof setupFeedback>[0]
  const cleanup = await setupFeedback(ctx)
  const save = async (note = "", attachments = {}) => {
    await command!.execute({ sessionID: "session-a", prompt: { text: note, ...attachments }, delivery: "steer" } as Parameters<CommandDefinition["execute"]>[0])
    const text = synthetic.mock.calls.at(-1)?.[0].text ?? ""
    return text.match(/fb_[a-f0-9]{24}/)?.[0] ?? ""
  }
  const call = async (name: string, input: unknown = {}) => {
    const output = await tools.get(name)!.execute(input, {} as ToolContext)
    return JSON.parse(output.content as string)
  }
  return { save, call, tools, context, get, synthetic, forbidden, cleanup, disposed, storage, ctx,
    messages: (value: Message[]) => { messages = value },
    read: (value: () => Promise<Message[]>) => { contextRead = value },
  }
}

describe("feedback anchors", () => {
  test("registers one command and two read-only tools without work on setup", async () => {
    const f = await fixture()
    expect(plugin.id).toBe("rfhold.feedback")
    expect([...f.tools.keys()]).toEqual(["feedback_list", "feedback_get"])
    expect(f.context).not.toHaveBeenCalled()
    expect(f.forbidden).not.toHaveBeenCalled()
    expect(f.synthetic).not.toHaveBeenCalled()
    expect(f.tools.get("feedback_get")!.input).toMatchObject({ required: ["id"], additionalProperties: false })
  })

  test("captures the exact prior message, never its acknowledgment or a later message", async () => {
    const f = await fixture()
    const id = await f.save("  status stop normal words  ")
    f.messages([{ id: "message-a", type: "user", text: "changed after save" }, { id: "later", type: "user", text: "POST-ANCHOR" }])
    const record = await f.call("feedback_get", { id })
    expect(record.anchor).toEqual({ kind: "message", messageID: "message-a" })
    expect(record.note).toBe("status stop normal words")
    expect(record.directory).toBe("/actual-session")
    expect(record.snapshot.messages).toEqual([{ id: "message-a", type: "user", text: "A bug happens here.", truncated: false }])
    expect(JSON.stringify(record)).not.toContain("POST-ANCHOR")
    expect(f.synthetic.mock.calls[0]![0]).toMatchObject({ sessionID: "session-a", resume: false })
    expect(f.forbidden).not.toHaveBeenCalled()
  })

  test("creates an explicit valid start anchor for an empty session", async () => {
    const f = await fixture()
    f.messages([])
    const record = await f.call("feedback_get", { id: await f.save() })
    expect(record.anchor).toEqual({ kind: "start", messageID: null })
    expect(record.snapshot.messages).toEqual([])
    expect(f.synthetic.mock.calls[0]![0].text).toContain("session start")
    f.get.mockImplementation(async () => { throw new Error("deleted") })
    expect((await f.call("feedback_get", { id: record.id })).availability).toContain("live session unavailable")
  })

  test("reopens persistence across instances and locations without a shared index", async () => {
    const disk = await diskStorage()
    const first = await fixture(disk.storage, "/project-one")
    const id = await first.save("durable note")
    await first.cleanup()
    const reopened = await diskStorage(disk.directory)
    const second = await fixture(reopened.storage, "/project-two")
    const record = await second.call("feedback_get", { id })
    expect(record.note).toBe("durable note")
    expect(record.directory).toBe("/project-one")
    expect((await second.call("feedback_list")).entries[0].id).toBe(id)
  })

  test("concurrent saves across instances survive and paginate without loss", async () => {
    const disk = await diskStorage()
    const first = await fixture(disk.storage)
    const second = await fixture((await diskStorage(disk.directory)).storage)
    await Promise.all(Array.from({ length: 45 }, (_, index) => (index % 2 ? first : second).save(`note ${index}`)))
    const ids = new Set<string>()
    let after: string | undefined
    do {
      const page = await first.call("feedback_list", { limit: 20, ...(after ? { after } : {}) })
      expect(page.entries.length).toBeLessThanOrEqual(20)
      for (const entry of page.entries) ids.add(entry.id)
      after = page.next ?? undefined
    } while (after)
    expect(ids.size).toBe(45)
    expect(await readdir(disk.directory)).toHaveLength(45)
  })

  test("snapshots bound text and messages, end at the anchor, and disclose truncation", async () => {
    const f = await fixture()
    f.messages(Array.from({ length: 50 }, (_, index) => ({ id: `message-${index}`, type: "user", text: "x".repeat(9000) + "END" })))
    const id = await f.save()
    const record = await f.call("feedback_get", { id })
    expect(record.snapshot.messages).toHaveLength(maxMessages)
    expect(record.snapshot.omittedMessages).toBe(18)
    expect(record.snapshot.messages.at(-1).id).toBe("message-49")
    expect(record.snapshot.messages.at(-1).text.endsWith("END")).toBe(true)
    expect(record.snapshot.messages.at(-1).text.length).toBe(maxMessageText)
    expect(record.snapshot.messages.reduce((sum: number, message: Message) => sum + message.text!.length, 0)).toBe(maxText)
    expect(f.synthetic.mock.calls[0]![0].text).toContain("truncated")
  })

  test("saves and retrieves the full text budget when JSON escapes expand control characters", async () => {
    const f = await fixture()
    const text = "\u001b".repeat(maxMessageText)
    f.messages(Array.from({ length: 3 }, (_, index) => ({ id: `escaped-${index}`, type: "user", text })))
    const id = await f.save("control characters")
    const persisted = await f.storage.get(prefix + id)
    expect(JSON.stringify(persisted).length).toBeGreaterThan(64000)
    const record = await f.call("feedback_get", { id })
    expect(record.snapshot.messages.map((message: Message) => message.text)).toEqual([text, text, text])
    expect(record.snapshot.messages.every((message: { truncated: boolean }) => !message.truncated)).toBe(true)
  })

  test("the encoded ceiling admits maximum escaped fields but still rejects oversize and corrupt records", () => {
    const id = "fb_" + "a".repeat(24)
    const messages = Array.from({ length: maxMessages }, (_, index) => ({
      id: "\u001b".repeat(253) + String(index).padStart(3, "0"), type: "\u001b".repeat(64),
      text: index < 3 ? "\u001b".repeat(maxMessageText) : "", truncated: false,
    }))
    const record: FeedbackRecord = {
      version: 1, id, sessionID: "\u001b".repeat(256), directory: "\u001b".repeat(4096),
      createdAt: Number.MAX_SAFE_INTEGER, note: "\u001b".repeat(1000),
      anchor: { kind: "message", messageID: messages.at(-1)!.id },
      snapshot: { source: "active-context", omittedMessages: Number.MAX_SAFE_INTEGER, messages },
    }
    expect(JSON.stringify(record).length).toBeGreaterThan(230000)
    expect(JSON.stringify(record).length).toBeLessThanOrEqual(maxEncodedRecord)
    expect(readRecord(record, id)).toEqual(record)
    expect(() => readRecord({ ...record, extra: "x".repeat(maxEncodedRecord) }, id)).toThrow("corrupt")
    expect(() => readRecord({ ...record, version: 2 }, id)).toThrow("corrupt")
    expect(() => readRecord({ ...record, snapshot: { ...record.snapshot, messages: messages.map((message, index) =>
      index === 3 ? { ...message, text: "x" } : message) } }, id)).toThrow("corrupt")
    expect(() => readRecord({ ...record, snapshot: { ...record.snapshot, messages: messages.map((message, index) =>
      index === 0 ? { ...message, text: message.text + "x" } : message) } }, id)).toThrow("corrupt")
  })

  test("excludes tools, reasoning, attachments, system text, and compaction bodies", () => {
    const result = snapshot([
      { id: "u", type: "user", text: "user" },
      { id: "a", type: "assistant", content: [{ type: "reasoning", text: "SECRET" }, { type: "text", text: "visible" }, { type: "tool", text: "SECRET" }] },
      ...["system", "synthetic", "shell", "compaction", "skill"].map((type) => ({ id: type, type, text: "SECRET" })),
    ])
    expect(JSON.stringify(result)).not.toContain("SECRET")
    expect(result.messages[1]!.text).toBe("visible")
  })

  test("compaction/deletion never shift an anchor and preserve its saved evidence", async () => {
    const f = await fixture()
    const id = await f.save()
    f.messages([{ id: "new-summary", type: "compaction", text: "POST-ANCHOR" }])
    let record = await f.call("feedback_get", { id })
    expect(record.availability).toContain("anchor unavailable")
    expect(record.anchor.messageID).toBe("message-a")
    expect(JSON.stringify(record)).not.toContain("POST-ANCHOR")
    f.read(async () => { throw new Error("session removed") })
    record = await f.call("feedback_get", { id })
    expect(record.availability).toContain("live evidence unavailable")
    expect(record.snapshot.messages[0].text).toBe("A bug happens here.")
  })

  test("tools enforce bounds, IDs, object schemas, and missing records", async () => {
    const f = await fixture()
    for (const input of [null, [], "x", { limit: 0 }, { limit: 21 }, { limit: NaN }, { limit: 1.1 }, { limit: "2" }, { after: "../other" }, { extra: 1 }]) {
      await expect(f.call("feedback_list", input)).rejects.toThrow()
    }
    for (const input of [null, [], {}, { id: "../other" }, { id: "fb_" + "A".repeat(24) }, { id: "fb_" + "a".repeat(24), extra: 1 }]) {
      await expect(f.call("feedback_get", input)).rejects.toThrow()
    }
    await expect(f.call("feedback_get", { id: "fb_" + "0".repeat(24) })).rejects.toThrow("not found")
    expect(f.synthetic).not.toHaveBeenCalled()
  })

  test("rejects long notes and attachments before any evidence read or save", async () => {
    const f = await fixture()
    await expect(f.save("x".repeat(1001))).rejects.toThrow("1000")
    for (const attachments of [{ files: [{}] }, { agents: [{}] }, { skills: [{}] }]) await expect(f.save("x", attachments)).rejects.toThrow("text note only")
    expect(f.context).not.toHaveBeenCalled()
    expect((await f.call("feedback_list")).entries).toHaveLength(0)
  })

  test("isolates corrupt records in lists and rejects unsupported schemas on get", async () => {
    const f = await fixture()
    const id = await f.save()
    const original = await f.storage.get(prefix + id)
    for (const corrupt of [null, { version: 99 }, { ...(original as object), version: 2 }, { ...(original as object), anchor: { kind: "message", messageID: "wrong" } }]) {
      await f.storage.set(prefix + id, corrupt as Parameters<Storage["set"]>[1])
      await expect(f.call("feedback_get", { id })).rejects.toThrow("corrupt")
      expect((await f.call("feedback_list")).entries[0].error).toContain("corrupt")
    }
  })

  test("does not expose unknown persisted fields and enforces record budgets", async () => {
    const f = await fixture()
    const id = await f.save()
    const record = await f.storage.get(prefix + id) as unknown as FeedbackRecord
    expect(readRecord({ ...record, secretExtra: "SECRET" }, id)).not.toHaveProperty("secretExtra")
    for (const mutate of [
      { note: "x".repeat(1001) }, { createdAt: -1 }, { directory: "x".repeat(4097) },
      { snapshot: { ...record.snapshot, messages: Array(33).fill(record.snapshot.messages[0]) } },
      { snapshot: { ...record.snapshot, omittedMessages: -1 } },
    ]) expect(() => readRecord({ ...record, ...mutate }, id)).toThrow("corrupt")
  })

  test("storage failures never produce a false saved acknowledgment", async () => {
    const disk = await diskStorage()
    const f = await fixture({ ...disk.storage, set: async () => { throw new Error("disk unavailable") } })
    await expect(f.save()).rejects.toThrow("disk unavailable")
    expect(f.synthetic).not.toHaveBeenCalled()
    expect(f.forbidden).not.toHaveBeenCalled()
  })

  test("acknowledgment failures preserve a durable reference in the command error", async () => {
    const f = await fixture()
    f.synthetic.mockImplementation(async () => { throw new Error("private transport details") })
    await expect(f.save()).rejects.toThrow(/Feedback fb_[a-f0-9]{24} was saved, but/)
    expect((await f.call("feedback_list")).entries).toHaveLength(1)
    expect(f.forbidden).not.toHaveBeenCalled()
  })

  test("unload disposes registrations and rejects captured executors", async () => {
    const f = await fixture()
    await f.cleanup()
    expect(f.disposed.sort()).toEqual(["command", "tool"])
    await expect(f.save()).rejects.toThrow("unloaded")
    await expect(f.call("feedback_list")).rejects.toThrow("unloaded")
    await expect(f.call("feedback_get", { id: "fb_" + "a".repeat(24) })).rejects.toThrow("unloaded")
  })

  test("late context reads after unload cannot persist or acknowledge", async () => {
    const f = await fixture()
    let resolve!: (messages: Message[]) => void
    f.read(() => new Promise((done) => { resolve = done }))
    const pending = f.save()
    await f.cleanup()
    resolve([{ id: "late", type: "user", text: "late" }])
    await expect(pending).rejects.toThrow("unloaded")
    expect(f.synthetic).not.toHaveBeenCalled()
    expect((await f.storage.scan({ prefix })).entries).toHaveLength(0)
  })

  test("an already-started durable write can finish after unload without a late acknowledgment", async () => {
    const disk = await diskStorage()
    let release!: () => void
    let started!: () => void
    const writing = new Promise<void>((resolve) => { started = resolve })
    const f = await fixture({ ...disk.storage, set: async (key, value) => {
      started()
      await new Promise<void>((resolve) => { release = resolve })
      await disk.storage.set(key, value)
    } })
    const pending = f.save()
    await writing
    await f.cleanup()
    release()
    await pending
    expect(f.synthetic).not.toHaveBeenCalled()
    expect((await disk.storage.scan({ prefix })).entries).toHaveLength(1)
  })
})
