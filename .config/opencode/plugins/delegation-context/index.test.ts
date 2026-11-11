import { describe, expect, test } from "bun:test"
import { Deferred, Effect, Exit, Fiber, Scope } from "effect"
import type { Duration } from "effect"
import type { Context } from "@opencode/plugin/effect/plugin"
import { setup } from "./index"
import { appendContext, checkPrompt, maxSupplement, metadataKey, parseCheck } from "./protocol"

function harness() {
  const hooks = new Map<string, (event: any) => Effect.Effect<void, any>>()
  const tools = new Map<string, any>()
  const commands = new Map<string, any>()
  const data = new Map<string, any>()
  const sessions = new Map<string, any>([["parent", { id: "parent", model: { providerID: "test", id: "parent-model" }, metadata: { unrelated: "keep" } }]])
  const acknowledgments: any[] = []
  let generationCount = 0
  let writeCount = 0
  let failWrite = 0
  let generate: (prompt: string) => Effect.Effect<{ text: string }, any> = () => Effect.succeed({ text: '{"kind":"supplement","text":"Exact approved text"}' })
  const ctx = {
    storage: {
      set: (key: string, value: unknown) => Effect.sync(() => { if (++writeCount === failWrite) throw new Error("secret unsafe storage error"); data.set(key, structuredClone(value)) }),
      get: (key: string) => Effect.sync(() => data.get(key)),
      scan: ({ prefix, after, limit }: any) => Effect.sync(() => {
        const keys = [...data.keys()].sort().filter(k => k.startsWith(prefix) && (!after || k > after))
        const selected = keys.slice(0, limit)
        return { entries: selected.map(key => ({ key, value: data.get(key) })), ...(keys.length > limit ? { next: selected.at(-1) } : {}) }
      }),
    },
    session: {
      get: ({ sessionID }: any) => Effect.sync(() => sessions.get(sessionID)),
      update: ({ sessionID, metadata }: any) => Effect.sync(() => { sessions.get(sessionID).metadata = metadata }),
      synthetic: (input: any) => Effect.sync(() => { acknowledgments.push(input) }),
      hook: (name: string, fn: any) => Effect.sync(() => { hooks.set(name, fn); return { dispose: Effect.void } }),
      generate: ({ sessionID, prompt }: any) => Effect.gen(function* () {
        generationCount++
        expect(sessionID).toBe("parent")
        expect(prompt).toContain(JSON.stringify("Original brief"))
        const event = { model: { providerID: "test", id: "parent-model" }, tools: { write: {} }, system: [{ text: "unchanged" }], messages: [{ text: "prefix" }], options: {} }
        yield* hooks.get("generate")!(event)
        expect(event.tools).toEqual({ write: {} })
        expect(event.system).toEqual([{ text: "unchanged" }])
        expect(event.messages).toEqual([{ text: "prefix" }])
        return yield* generate(prompt)
      }),
    },
    tool: {
      hook: (name: string, fn: any) => Effect.sync(() => { hooks.set(name, fn); return { dispose: Effect.void } }),
      transform: (fn: any) => Effect.sync(() => { fn({ add: (t: any) => tools.set(t.name, t) }); return { dispose: Effect.void } }),
    },
    command: { transform: (fn: any) => Effect.sync(() => { fn({ add: (c: any) => commands.set(c.name, c) }); return { dispose: Effect.void } }) },
  } as unknown as Context
  const before = (e: any) => hooks.get("execute.before")!(e)
  const after = (e: any) => hooks.get("execute.after")!(e)
  const event = (id = "call") => ({ tool: "subagent", sessionID: "parent", messageID: "message", id, agent: "build", input: { prompt: "Original brief", agent: "worker", sessionID: "existing", background: true } })
  const command = (text: string, extra = {}): Effect.Effect<void, unknown> => commands.get("delegation-context").execute({ sessionID: "parent", prompt: { text, ...extra } })
  return { ctx, data, hooks, sessions, tools, acknowledgments, before, after, event, command,
    generate: (fn: typeof generate) => { generate = fn }, failWrite: (n: number) => { failWrite = n },
    count: () => generationCount,
  }
}

const run = (fn: (h: ReturnType<typeof harness>) => Effect.Effect<unknown, any>, timeout?: Duration.Input) => Effect.runPromise(Effect.scoped(Effect.gen(function* () {
  const h = harness()
  yield* setup(h.ctx, timeout)
  yield* fn(h)
})))

describe("protocol", () => {
  test("explicit none or bounded nonempty supplement only", () => {
    expect(parseCheck('{"kind":"none"}')).toBeNull()
    expect(parseCheck('{"kind":"supplement","text":" exact "}')).toBe(" exact ")
    for (const value of ["", "ok", '[]', '{"kind":"none","text":"x"}', '{"kind":"supplement","text":" "}', JSON.stringify({ kind: "supplement", text: "x".repeat(maxSupplement + 1) })]) expect(() => parseCheck(value)).toThrow()
    expect(checkPrompt("line\nverbatim")).toContain(JSON.stringify("line\nverbatim"))
    expect(appendContext("brief", "context").startsWith("brief\n\n")).toBe(true)
  })
})

test("default off and unsupported tool do not generate or record", () => run(h => Effect.gen(function* () {
  const e = h.event()
  yield* h.before(e)
  yield* h.command("on")
  yield* h.before({ ...h.event(), tool: "task" })
  expect(h.count()).toBe(0)
  expect(h.data.size).toBe(0)
  expect(e.input.prompt).toBe("Original brief")
})))

test("on/off/status merge metadata without granting delegation; inheritance is creation snapshot", () => run(h => Effect.gen(function* () {
  yield* h.command("status")
  expect(h.acknowledgments.at(-1).text).toContain("off")
  yield* h.command("on")
  expect(h.sessions.get("parent").metadata).toEqual({ unrelated: "keep", [metadataKey]: true })
  const childMetadata = structuredClone(h.sessions.get("parent").metadata)
  yield* h.command("off")
  expect(childMetadata[metadataKey]).toBe(true)
  expect(h.sessions.get("parent").metadata[metadataKey]).toBe(false)
  yield* h.before(h.event())
  expect(h.count()).toBe(0)
})))

test("append only, resume arguments unchanged, no duplicate append, parent input object unchanged", () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  const e = h.event()
  const originalInput = e.input
  yield* h.before(e)
  expect(originalInput.prompt).toBe("Original brief")
  expect(e.input).toEqual({ ...originalInput, prompt: appendContext("Original brief", "Exact approved text") })
  yield* h.before(e)
  expect(e.input.prompt).toBe(appendContext("Original brief", "Exact approved text"))
  expect(h.count()).toBe(1)
  expect(h.acknowledgments).toHaveLength(1)
  const r = [...h.data.values()][0]
  expect(r).toMatchObject({ parentID: "parent", childID: null, requestedChildID: "existing", messageID: "message", callID: "call", original: "Original brief", supplement: "Exact approved text", check: "supplement", parentModel: { id: "parent-model", providerID: "test" } })
})))

test("unrelated auxiliary generation hook untouched", () => run(h => Effect.gen(function* () {
  const e = { tools: { write: {} }, options: { maxTokens: 500 } }
  yield* h.hooks.get("generate")!(e)
  expect(e).toEqual({ tools: { write: {} }, options: { maxTokens: 500 } })
})))

test("no supplement is successful original dispatch", () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  h.generate(() => Effect.succeed({ text: '{"kind":"none"}' }))
  const e = h.event()
  yield* h.before(e)
  expect(e.input.prompt).toBe("Original brief")
  expect([...h.data.values()][0].check).toBe("no-supplement")
})))

test("concurrent duplicate call waits for the same check; retry after result records a new attempt", () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  const entered = yield* Deferred.make<void>()
  const release = yield* Deferred.make<void>()
  h.generate(() => Deferred.succeed(entered, undefined).pipe(Effect.andThen(Deferred.await(release)), Effect.as({ text: '{"kind":"supplement","text":"Shared supplement"}' })))
  const a = h.event()
  const b = h.event()
  let secondFinished = false
  const first = yield* h.before(a).pipe(Effect.forkChild)
  yield* Deferred.await(entered)
  const second = yield* h.before(b).pipe(Effect.andThen(Effect.sync(() => { secondFinished = true })), Effect.forkChild)
  yield* Effect.yieldNow
  expect(secondFinished).toBe(false)
  yield* Deferred.succeed(release, undefined)
  yield* Fiber.join(first)
  yield* Fiber.join(second)
  expect(a.input.prompt).toBe(appendContext("Original brief", "Shared supplement"))
  expect(b.input.prompt).toBe(a.input.prompt)
  expect(h.count()).toBe(1)
  yield* h.after({ ...a, status: "error", error: { message: "failed" } })
  yield* h.before(h.event())
  expect(h.count()).toBe(2)
  expect(h.data.size).toBe(2)
})))

test("commands reject invalid actions and attachments without mutation", () => run(h => Effect.gen(function* () {
  expect(Exit.isFailure(yield* Effect.exit(h.command("enable")))).toBe(true)
  expect(Exit.isFailure(yield* Effect.exit(h.command("on", { files: [{ uri: "file:///ignored" }] })))).toBe(true)
  expect(h.sessions.get("parent").metadata).toEqual({ unrelated: "keep" })
})))

for (const failure of ["generation", "validation", "tool-only-empty-text", "initial-storage", "supplement-storage"]) test(`fail open original: ${failure}`, () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  if (failure === "generation") h.generate(() => Effect.fail(new Error("unsafe secret")))
  if (failure === "validation") h.generate(() => Effect.succeed({ text: "tool output is not protocol" }))
  if (failure === "tool-only-empty-text") h.generate(() => Effect.succeed({ text: "" }))
  if (failure === "initial-storage") h.failWrite(1)
  if (failure === "supplement-storage") h.failWrite(2)
  const e = h.event()
  yield* h.before(e)
  expect(e.input.prompt).toBe("Original brief")
  const r = [...h.data.values()][0]
  expect(r.check).toBe("failed")
  expect(r.error).not.toContain("unsafe")
  yield* h.command("status")
  if (failure.includes("storage")) expect(h.acknowledgments.at(-1).text).toContain("load: 1")
})))

test("timeout interrupts underlying effect and fails open", () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  let interrupted = false
  h.generate(() => Effect.never.pipe(Effect.onInterrupt(() => Effect.sync(() => { interrupted = true }))))
  const e = h.event()
  yield* h.before(e)
  expect(interrupted).toBe(true)
  expect(e.input.prompt).toBe("Original brief")
  expect([...h.data.values()][0].check).toBe("failed")
}), "5 millis"))

test("user cancellation interrupts generation and never continues dispatch", () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  const entered = yield* Deferred.make<void>()
  let interrupted = false
  let dispatched = false
  h.generate(() => Deferred.succeed(entered, undefined).pipe(Effect.andThen(Effect.never), Effect.onInterrupt(() => Effect.sync(() => { interrupted = true }))))
  const fiber = yield* h.before(h.event()).pipe(Effect.andThen(Effect.sync(() => { dispatched = true })), Effect.forkChild)
  yield* Deferred.await(entered)
  yield* Fiber.interrupt(fiber)
  expect(interrupted).toBe(true)
  expect(dispatched).toBe(false)
  expect([...h.data.values()][0].outcome).toBe("cancelled-before-dispatch")
})))

test("concurrent calls record independently; foreground/background/error correlation truthful", () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  const events = [h.event("one"), h.event("two"), h.event("three"), h.event("four")]
  yield* Effect.forEach(events, h.before, { concurrency: "unbounded" })
  expect(h.data.size).toBe(4)
  yield* h.after({ ...events[0], status: "completed", result: { output: { sessionID: "child1", status: "completed" }, metadata: { sessionID: "child1" } } })
  yield* h.after({ ...events[1], status: "completed", result: { output: { sessionID: "child2", status: "running" } } })
  yield* h.after({ ...events[2], status: "error", error: { message: "unsafe secret" } })
  yield* h.after({ ...events[3], status: "completed", result: { output: { sessionID: "a" }, metadata: { sessionID: "b" } } })
  const byCall = Object.fromEntries([...h.data.values()].map(r => [r.callID, r]))
  expect(byCall.one).toMatchObject({ childID: "child1", outcome: "foreground-completed" })
  expect(byCall.two).toMatchObject({ childID: "child2", outcome: "dispatched-running-completion-unknown" })
  expect(byCall.three).toMatchObject({ childID: null, outcome: "tool-error-child-unknown" })
  expect(byCall.four).toMatchObject({ childID: null, outcome: "correlation-error-child-unknown" })
  const list: (args: any) => Effect.Effect<{ content: string }, unknown> = h.tools.get("delegation_context_list").execute
  const first = JSON.parse((yield* list({ limit: 2 })).content)
  const second = JSON.parse((yield* list({ limit: 2, after: first.next })).content)
  expect(first.entries).toHaveLength(2)
  expect(second.entries).toHaveLength(2)
  expect(second.next).toBeNull()
  expect(first.entries[0].original).toBeUndefined()
  const get: (args: any) => Effect.Effect<{ content: string }, unknown> = h.tools.get("delegation_context_get").execute
  const record = JSON.parse((yield* get({ id: first.entries[0].id, offset: 2, limit: 4 })).content)
  expect(record.original).toEqual({ text: "igin", totalChars: 14, nextOffset: 6 })
  expect(Exit.isFailure(yield* Effect.exit(get({ id: "bad" })))).toBe(true)
  expect(Exit.isFailure(yield* Effect.exit(list({ limit: 21 })))).toBe(true)
  const invalid = yield* list({ limit: 21 }).pipe(Effect.catch(error => Effect.succeed(error)))
  expect(invalid).toMatchObject({ _tag: "Tool.Error", message: "Invalid cursor or limit (1..20)." })
})))

test("after-hook storage failure preserves actual tool result and exposes stale evidence", () => run(h => Effect.gen(function* () {
  yield* h.command("on")
  const e = h.event()
  yield* h.before(e)
  h.failWrite(3)
  const result = { output: { sessionID: "child", status: "running" }, metadata: { sessionID: "child" } }
  yield* h.after({ ...e, status: "completed", result })
  expect(result).toEqual({ output: { sessionID: "child", status: "running" }, metadata: { sessionID: "child" } })
  expect([...h.data.values()][0].outcome).toBe("dispatch-pending")
  yield* h.command("status")
  expect(h.acknowledgments.at(-1).text).toContain("load: 1")
})))

test("plugin unload interrupts active check, never dispatches", async () => {
  const h = harness()
  const scope = await Effect.runPromise(Scope.make())
  await Effect.runPromise(setup(h.ctx).pipe(Effect.provideService(Scope.Scope, scope)))
  await Effect.runPromise(h.command("on"))
  const entered = await Effect.runPromise(Deferred.make<void>())
  let interrupted = false
  let dispatched = false
  h.generate(() => Deferred.succeed(entered, undefined).pipe(Effect.andThen(Effect.never), Effect.onInterrupt(() => Effect.sync(() => { interrupted = true }))))
  const running = Effect.runPromiseExit(h.before(h.event()).pipe(Effect.andThen(Effect.sync(() => { dispatched = true }))))
  await Effect.runPromise(Deferred.await(entered))
  await Effect.runPromise(Scope.close(scope, Exit.void))
  const result = await running
  expect(Exit.isFailure(result)).toBe(true)
  expect(interrupted).toBe(true)
  expect(dispatched).toBe(false)
})
