import { expect, mock, spyOn, test } from "bun:test"
import type { OpenCodeEvent, PermissionAsked, PermissionReplied } from "@opencode/client"
import type { Info, ToolEditor } from "@opencode/plugin/promise/tool"
import plugin, { setupPermissionLog } from "./index"

type Context = Parameters<typeof setupPermissionLog>[0]
type Value = Parameters<Context["storage"]["set"]>[1]
const asked = (id = "evt_a", sessionID = "ordinary"): PermissionAsked => ({
  id, type: "permission.asked", created: 123,
  location: { directory: "/project" },
  metadata: { secret: "envelope-secret" },
  data: {
    id: `req_${id}`, sessionID, action: "shell",
    resources: ["secret-command"], save: ["secret-pattern"],
    metadata: { secret: "request-secret" }, message: "secret-feedback",
    source: { type: "tool", messageID: "msg_tool", id: "call_tool" },
  },
})
const replied = (id = "evt_b"): PermissionReplied => ({
  id, type: "permission.replied", created: 124,
  data: { sessionID: "ordinary", requestID: "req_evt_a", reply: "once" },
})
async function settle() {
  for (let i = 0; i < 50; i++) await Promise.resolve()
}
async function fixture(entries = new Map<string, Value>(), directory = "/project") {
  let deliver: (result: IteratorResult<OpenCodeEvent>) => void = () => {}
  let reject: (error: Error) => void = () => {}
  let signal: AbortSignal | undefined
  let failWrite = false
  const tools = new Map<string, Info>()
  const scan = mock(async ({ prefix, after, limit = 100 }: Parameters<Context["storage"]["scan"]>[0]) => {
    const rows = [...entries].filter(([key]) => key.startsWith(prefix) && (after === undefined || key > after))
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    return {
      entries: rows.slice(0, limit).map(([key, value]) => ({ key, value })),
      ...(rows.length > limit ? { next: rows[limit - 1]![0] } : {}),
    }
  })
  const set = mock(async (key: string, value: Value) => {
    if (failWrite) throw new Error("secret storage details")
    entries.set(key, structuredClone(value))
  })
  const ctx = {
    location: { directory },
    storage: {
      get: async (key: string) => entries.get(key), set,
      remove: async (key: string) => { entries.delete(key) }, scan,
    },
    tool: {
      transform: async (callback: (editor: ToolEditor) => void) =>
        callback({ add: (tool: Info) => tools.set(tool.name, tool) } as unknown as ToolEditor),
    },
    event: {
      subscribe: (options: { signal: AbortSignal }) => {
        signal = options.signal
        return {
          [Symbol.asyncIterator]() { return this },
          next: () => new Promise<IteratorResult<OpenCodeEvent>>((resolve, fail) => {
            deliver = resolve
            reject = fail
            signal!.addEventListener("abort", () => resolve({ done: true, value: undefined }), { once: true })
          }),
        }
      },
    },
  } as unknown as Context
  const cleanup = await setupPermissionLog(ctx)
  return {
    entries, set, scan, tools, cleanup,
    emit: async (event: OpenCodeEvent) => { deliver({ done: false, value: event }); await settle() },
    end: async () => { deliver({ done: true, value: undefined }); await settle() },
    fail: async () => { reject(new Error("secret stream details")); await settle() },
    failWrites: (value: boolean) => { failWrite = value },
    signal: () => signal!,
    list: async (input: unknown = {}) => {
      const result = await tools.get("permission_log_list")!.execute(input, {} as Parameters<Info["execute"]>[1])
      return JSON.parse(result.content as string)
    },
  }
}

test("captures all session roles without ancestry access and allowlists native evidence", async () => {
  const f = await fixture()
  expect(plugin.id).toBe("rfhold.permission-log")
  expect([...f.tools.keys()]).toEqual(["permission_log_list"])
  for (const session of ["ordinary", "supervisor", "worker", "unrelated"]) {
    await f.emit(asked(`evt_${session}`, session))
  }
  const record = f.entries.get("events/evt_ordinary")
  expect(record).toEqual({
    version: 1, eventID: "evt_ordinary", type: "permission.asked", created: 123,
    sessionID: "ordinary", requestID: "req_evt_ordinary", action: "shell",
    location: { directory: "/project" },
    source: { type: "tool", messageID: "msg_tool", id: "call_tool" },
  })
  expect(f.entries.size).toBe(4)
  expect(JSON.stringify([...f.entries.values()])).not.toContain("secret")
  expect(record).not.toHaveProperty("actor")
  expect(record).not.toHaveProperty("observedAt")
  f.cleanup()
})

test("reply without Asked remains independent evidence; no success or actor inference", async () => {
  const f = await fixture()
  for (const reply of ["once", "always", "reject"] as const) {
    await f.emit({ ...replied(`evt_${reply}`), data: { ...replied().data, reply } })
  }
  expect(f.entries.get("events/evt_always")).toEqual({
    version: 1, eventID: "evt_always", type: "permission.replied", created: 124,
    sessionID: "ordinary", requestID: "req_evt_a", reply: "always",
  })
  expect(f.entries.size).toBe(3)
  f.cleanup()
})

test("location ownership filters mismatches; no-location duplicates converge across instances", async () => {
  const entries = new Map<string, Value>()
  const a = await fixture(entries)
  const b = await fixture(entries, "/other")
  await a.emit({ ...asked(), location: { directory: "/elsewhere" } })
  await a.emit({ ...asked(), location: { directory: "/project", workspaceID: "ws_other" } })
  expect(entries.size).toBe(0)
  const event = replied()
  await a.emit(event)
  const before = structuredClone(entries.get("events/evt_b"))
  await b.emit(event)
  expect(entries.size).toBe(1)
  expect(entries.get("events/evt_b")).toEqual(before)
  expect((await b.list()).records).toEqual([before])
  a.cleanup()
  b.cleanup()
})

test("list scans one page, filters within page and preserves cursors on empty results", async () => {
  const f = await fixture()
  await f.emit(asked("evt_a", "a"))
  await f.emit(asked("evt_b", "b"))
  await f.emit(replied("evt_c"))
  const first = await f.list({ limit: 1, sessionID: "b" })
  expect(first).toEqual({ records: [], scanned: 1, next: "events/evt_a" })
  expect(f.scan).toHaveBeenCalledTimes(1)
  const second = await f.list({ after: first.next, limit: 1, sessionID: "b", requestID: "req_evt_b" })
  expect(second.records.map((r: { eventID: string }) => r.eventID)).toEqual(["evt_b"])
  expect(second.next).toBe("events/evt_b")
  expect(f.scan).toHaveBeenCalledTimes(2)
  const last = await f.list({ after: second.next, limit: 1 })
  expect(last.scanned).toBe(1)
  expect(last).not.toHaveProperty("next")
  await f.list()
  expect(f.scan.mock.calls.at(-1)![0]).toEqual({ prefix: "events/", after: undefined, limit: 50 })
  f.cleanup()
})

test("list returns only sanitized new-schema evidence and matching event keys", async () => {
  const f = await fixture()
  await f.emit(asked())
  const value = f.entries.get("events/evt_a")!
  expect(typeof value).toBe("object")
  f.entries.set("events/evt_a", { ...value as object, secret: "secret", metadata: { raw: "secret" } })
  f.entries.set("events/evt_bad", { version: 0, secret: "secret" })
  f.entries.set("events/evt_wrong_key", value)
  f.entries.set("unrelated/secret", { secret: "secret" })
  const page = await f.list()
  expect(page.scanned).toBe(3)
  expect(page.records.length).toBe(1)
  expect(JSON.stringify(page)).not.toContain("secret")
  f.cleanup()
})

test("list validates bounds, cursors, filters and extra arguments before storage", async () => {
  const f = await fixture()
  for (const input of [
    null, [], "all", { extra: true }, { limit: null }, { limit: 0 }, { limit: 101 },
    { limit: 1.5 }, { limit: NaN }, { limit: "50" },
    { after: "" }, { after: "decisions/id" }, { after: "events/" }, { after: "events/ " },
    { after: `events/${"a".repeat(257)}` }, { after: 1 },
    { sessionID: "" }, { sessionID: " " }, { sessionID: "a".repeat(257) }, { requestID: 1 },
  ]) {
    await expect(f.list(input)).rejects.toThrow()
  }
  expect(f.scan).not.toHaveBeenCalled()
  await f.list({ limit: 100, after: `events/${"a".repeat(256)}` })
  expect(f.scan).toHaveBeenCalledTimes(1)
  f.cleanup()
})

test("write failures are isolated, warnings omit contents, and unload aborts capture", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {})
  const f = await fixture()
  try {
    f.failWrites(true)
    await f.emit(asked())
    expect(f.entries.size).toBe(0)
    expect(warn).toHaveBeenCalledWith("Permission evidence write failed.")
    f.failWrites(false)
    await f.emit(replied())
    expect(f.entries.size).toBe(1)
    f.cleanup()
    await settle()
    expect(f.signal().aborted).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
    await expect(f.list()).rejects.toThrow("unloaded")
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret")
  } finally { f.cleanup(); warn.mockRestore() }
})

test("stream completion and errors warn without recovery or sensitive details", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {})
  try {
    for (const mode of ["end", "fail"] as const) {
      const f = await fixture()
      await f[mode]()
      expect(warn).toHaveBeenLastCalledWith(`Permission evidence event stream ${mode === "end" ? "stopped" : "failed"}.`)
      f.cleanup()
    }
    expect(warn).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret")
  } finally { warn.mockRestore() }
})
