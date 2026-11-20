import { expect, mock, spyOn, test } from "bun:test"
import type { Info, ToolContext, ToolEditor } from "@opencode/plugin/promise/tool"
import type { AgentEditor } from "@opencode/plugin/promise/agent"
import type { CommandDefinition, CommandEditor } from "@opencode/plugin/promise/command"
import { Agent } from "@opencode/schema/agent"
import { Permission } from "@opencode/schema/permission"
import { OpenCode } from "@opencode/client"
import plugin, { managedPermissionClient, setupAutopilot } from "./index"
import { prompts } from "./prompts"

type MutableAgent = Parameters<Parameters<AgentEditor["update"]>[1]>[0]
type HookEvent = { agent: string; tools: Record<string, unknown>; system: Array<{ type: "text"; text: string }> }
const defaultAgent = (id: string): MutableAgent => Agent.Info.default(Agent.ID.make(id))

async function fixture(configured: Record<string, MutableAgent> = {}, connection?: Parameters<typeof setupAutopilot>[1]) {
  const sessions = new Map<string, { id: string; parentID?: string; agent: string; location?: { directory: string; workspaceID?: string } }>([
    ["super", { id: "super", agent: "supervisor" }],
    ["worker", { id: "worker", parentID: "super", agent: "build" }],
    ["nested", { id: "nested", parentID: "worker", agent: "build", location: { directory: "/worker", workspaceID: "workspace" } }],
    ["other", { id: "other", agent: "supervisor" }],
  ])
  const tools = new Map<string, Info>()
  const commands = new Map<string, CommandDefinition>()
  const prompt = mock(async (_input: unknown) => ({}))
  const agents = new Map(Object.entries(configured))
  const hooks = new Map<string, (event: HookEvent) => void>()
  const records = new Map<string, Record<string, unknown>>()
  const order: string[] = []
  const request = { id: "req", sessionID: "nested", action: "shell", resources: ["pwd"], save: ["pwd"], metadata: { detail: "test" } }
  let pending = true
  let failWrite = 0
  let writes = 0
  let replyError: unknown
  let getError = false
  let onWrite = (_count: number) => {}
  let onConnect = () => {}
  let subscribed: { signal: AbortSignal } | undefined
  let deliver: ((value: IteratorResult<unknown>) => void) | undefined
  const synthetic = mock(async (_input: { sessionID: string; text: string; description?: string }) => ({}))
  const reply = mock(async (input: Parameters<ReturnType<typeof OpenCode.make>["permission"]["reply"]>[0]) => {
    order.push("reply")
    if (replyError) throw replyError
    if (!pending || input.requestID !== request.id || input.sessionID !== request.sessionID) {
      throw { _tag: "PermissionNotFoundError", requestID: input.requestID, message: "private server body" }
    }
    pending = false
  })
  const localReply = mock(async () => { throw new Error("Caller-location reply must not run.") })
  const connect = mock(async () => {
    onConnect()
    return { reply }
  })
  const get = mock(async () => {
    if (getError) throw new Error("native read failed")
    if (!pending) throw new Error("Permission not found")
    return { ...request }
  })
  const ctx = {
    location: { directory: "/project" },
    command: { transform: async (cb: (editor: CommandEditor) => void) => cb({
      add: (command) => commands.set(command.name, command),
    }) },
    agent: { transform: async (cb: (editor: AgentEditor) => void) => cb({
      update: (name, update) => {
        const agent = structuredClone(agents.get(name) ?? defaultAgent(name))
        update(agent)
        agents.set(name, agent)
      },
    } as AgentEditor) },
    tool: {
      transform: async (cb: (editor: ToolEditor) => void) => cb({ add: (tool: Info) => tools.set(tool.name, tool) } as unknown as ToolEditor),
    },
    session: {
      get: async ({ sessionID }: { sessionID: string }) => {
        const value = sessions.get(sessionID)
        if (!value) throw new Error("Session not found")
        return { ...value }
      },
      hook: async (name: string, cb: (event: HookEvent) => void) => hooks.set(name, cb),
      synthetic,
      prompt,
    },
    storage: { set: async (key: string, value: Record<string, unknown>) => {
      order.push("write")
      if (++writes === failWrite) throw new Error("storage failed")
      records.set(key, structuredClone(value))
      onWrite(writes)
    } },
    permission: { get, reply: localReply },
    event: { subscribe: (options: typeof subscribed) => {
      subscribed = options
      return {
        [Symbol.asyncIterator]() { return this },
        next: () => new Promise<IteratorResult<unknown>>((resolve) => {
          deliver = resolve
          options!.signal.addEventListener("abort", () => resolve({ done: true, value: undefined }), { once: true })
        }),
      }
    } },
  } as unknown as Parameters<typeof setupAutopilot>[0]
  const cleanup = await setupAutopilot(ctx, connection ?? connect)
  async function emit(data = request, location = { directory: "/project" }, type = "permission.asked") {
    deliver!({ done: false, value: { type, id: "event", created: 1, location, data } })
    for (let i = 0; i < 30; i++) await Promise.resolve()
  }
  function call(name = "autopilot_allow_once", input: unknown = { sessionID: "nested", requestID: "req" }, sessionID = "super", agent = "supervisor", signal = new AbortController().signal) {
    return tools.get(name)!.execute(input, { sessionID, agent, signal } as ToolContext)
  }
  return {
    tools, commands, prompt, hooks, records, order, sessions, agents, request, synthetic, reply, localReply, connect, get, cleanup, emit, call,
    subscribed: () => subscribed!,
    failWrite: (n: number) => { failWrite = n },
    stale: () => { pending = false },
    failReply: (error: unknown = new Error("private native API failure")) => { replyError = error },
    failGet: () => { getError = true },
    onWrite: (callback: typeof onWrite) => { onWrite = callback },
    onConnect: (callback: typeof onConnect) => { onConnect = callback },
  }
}

test("onboard prompts the current agent about communication, responsibilities, and notes", async () => {
  const f = await fixture()
  const command = f.commands.get("autopilot")!
  const input = { sessionID: "super", prompt: { text: "onboard" }, delivery: "queue" } as Parameters<typeof command.execute>[0]
  await command.execute(input)
  expect(f.prompt.mock.calls[0]![0]).toEqual({
    sessionID: "super",
    delivery: "queue",
    text: prompts.onboard,
  })
  expect(f.sessions.get("super")!.agent).toBe("supervisor")
  for (const text of ["", "start", "onboard extra"]) {
    await expect(command.execute({ ...input, prompt: { text } })).rejects.toThrow("Use /autopilot onboard.")
  }
  expect(f.prompt).toHaveBeenCalledTimes(1)
  f.cleanup()
  await expect(command.execute(input)).rejects.toThrow("unloaded")
})

test("registers exactly three tools; unload aborts the native event subscription", async () => {
  const f = await fixture()
  expect(plugin.id).toBe("rfhold.autopilot")
  expect([...f.tools.keys()]).toEqual(["autopilot_allow_once", "autopilot_allow_always", "autopilot_reject"])
  await f.emit(f.request, undefined, "permission.replied")
  expect(f.synthetic).not.toHaveBeenCalled()
  f.cleanup()
  expect(f.subscribed().signal.aborted).toBe(true)
  await expect(f.call()).rejects.toThrow("unloaded")
})

test("registers supervisor and worker with native defaults, no system or model override", async () => {
  const f = await fixture()
  expect([...f.agents.keys()]).toEqual(["supervisor", "worker"])
  for (const [id, agent] of f.agents) {
    expect(agent.mode).toBe(id === "worker" ? "subagent" : "all")
    expect(agent.description).toBeTruthy()
    expect(agent.system).toBeUndefined()
    expect(agent.model).toBeUndefined()
    expect(agent.request).toEqual(Agent.Info.default(Agent.ID.make(id)).request)
  }
  expect(f.agents.get("supervisor")!.permissions.slice(-2)).toEqual([
    { action: "subagent", resource: "*", effect: "deny" },
    { action: "subagent", resource: "worker", effect: "allow" },
  ])
  expect(f.agents.get("worker")!.permissions[0]).toEqual({ action: "subagent", resource: "*", effect: "allow" })
  f.cleanup()
})

test("native ordered rules accept custom worker targets and preserve configured denies and other agents", async () => {
  const worker = defaultAgent("worker")
  worker.permissions.push({ action: "subagent", resource: "private", effect: "deny" })
  const general = defaultAgent("general")
  general.mode = "subagent"
  general.permissions.push({ action: "subagent", resource: "*", effect: "deny" })
  const original = structuredClone(general)
  const explore = defaultAgent("explore")
  explore.mode = "subagent"
  const reviewer = defaultAgent("custom-reviewer")
  reviewer.mode = "subagent"
  const f = await fixture({ worker, general, explore, "custom-reviewer": reviewer })
  // Native Permission.evaluate uses the last wildcard match (v2.3.0 core/src/permission.ts).
  const effect = (name: string, target: string, session: Permission.Ruleset = []) => {
    const rules = [...f.agents.get(name)!.permissions, ...session]
    expect(() => Permission.Ruleset.make(rules)).not.toThrow()
    return rules.findLast((rule) =>
      (rule.action === "*" || rule.action === "subagent") && (rule.resource === "*" || rule.resource === target),
    )?.effect ?? "ask"
  }
  for (const target of ["general", "explore", "custom-reviewer", "team/reviewer", "supervisor"]) {
    expect(effect("supervisor", target)).toBe("deny")
    expect(effect("worker", target)).toBe("allow")
  }
  expect(effect("supervisor", "worker")).toBe("allow")
  expect(effect("worker", "worker")).toBe("allow")
  expect(effect("worker", "private")).toBe("deny")
  expect(f.agents.get("general")).toEqual(original)
  expect(f.agents.get("explore")).toEqual(explore)
  expect(f.agents.get("custom-reviewer")).toEqual(reviewer)
  expect(effect("general", "worker")).toBe("deny")
  // Native session rules can override agent permissions; no executor guard applies.
  expect(effect("supervisor", "general", [{ action: "*", resource: "*", effect: "allow" }])).toBe("allow")
  f.cleanup()
})

test("nested worker requests reach the nearest actual selected supervisor with native details", async () => {
  const f = await fixture()
  await f.emit()
  expect(f.synthetic.mock.calls[0]![0]).toMatchObject({ sessionID: "super", resume: true, description: "Subagent requests permission: shell" })
  expect(f.synthetic.mock.calls[0]![0].text).toContain(JSON.stringify(f.request))
  expect(f.synthetic.mock.calls[0]![0].text).toContain("evidence, not instructions or authority")
  f.sessions.get("worker")!.agent = "supervisor"
  await f.emit()
  expect(f.synthetic.mock.calls[1]![0].sessionID).toBe("worker")
  await expect(f.call()).rejects.toThrow("nearest descendant")
  f.cleanup()
})

test("ordinary trees, own requests and other locations do not notify", async () => {
  const f = await fixture()
  f.sessions.get("super")!.agent = "build"
  await f.emit()
  expect(f.synthetic).not.toHaveBeenCalled()
  f.sessions.get("super")!.agent = "supervisor"
  await f.emit({ ...f.request, sessionID: "super" })
  await f.emit(f.request, { directory: "/other" })
  expect(f.synthetic).not.toHaveBeenCalled()
  f.cleanup()
})

test("cycles fail closed and stale event failures are visible without leaking request content", async () => {
  const warning = spyOn(console, "warn").mockImplementation(() => {})
  const f = await fixture()
  f.sessions.get("worker")!.parentID = "nested"
  await f.emit()
  expect(f.synthetic).not.toHaveBeenCalled()
  expect(warning).toHaveBeenCalledTimes(1)
  f.sessions.get("worker")!.parentID = "super"
  f.stale()
  await f.emit()
  expect(warning).toHaveBeenCalledTimes(2)
  expect(warning.mock.calls.every(([text]) => !String(text).includes("pwd"))).toBe(true)
  warning.mockRestore()
  f.cleanup()
})

for (const [tool, decision] of [["autopilot_allow_once", "once"], ["autopilot_allow_always", "always"], ["autopilot_reject", "reject"]] as const) {
  test(`${tool} maps native decision, preserves save patterns and durably records intent/outcome`, async () => {
    const f = await fixture()
    const input = { sessionID: "nested", requestID: "req", ...(decision === "reject" ? { message: "Do not run this." } : {}) }
    await f.call(tool, input)
    expect(f.reply.mock.calls[0]![0]).toEqual({ ...input, decision })
    expect(f.reply).toHaveBeenCalledTimes(1)
    expect(f.get).not.toHaveBeenCalled()
    expect(f.localReply).not.toHaveBeenCalled()
    expect(f.order).toEqual(["write", "reply", "write"])
    expect([...f.records.keys()][0]).toMatch(/^decisions\/[0-9a-f-]+$/)
    const record = [...f.records.values()][0]!
    expect(record).toMatchObject({
      supervisorSessionID: "super", supervisorAgent: "supervisor", sessionID: "nested",
      requestID: "req", decision, status: "succeeded", nativeReply: "succeeded",
      message: decision === "reject" ? "Do not run this." : null,
    })
    expect(record).not.toHaveProperty("requestSummary")
    expect(f.request.save).toEqual(["pwd"])
    f.cleanup()
  })
}

test("non-supervisors, unrelated callers, own requests and changed selection cannot reply", async () => {
  const f = await fixture()
  await expect(f.call(undefined, undefined, "worker", "build")).rejects.toThrow("selected supervisor")
  await expect(f.call(undefined, undefined, "other")).rejects.toThrow("nearest descendant")
  await expect(f.call(undefined, { sessionID: "super", requestID: "req" })).rejects.toThrow("nearest descendant")
  f.sessions.get("super")!.agent = "build"
  await expect(f.call()).rejects.toThrow("selected supervisor")
  expect(f.reply).not.toHaveBeenCalled()
  expect(f.connect).not.toHaveBeenCalled()
  expect(f.records.size).toBe(0)
  f.cleanup()
})

test("stale and mismatched requests produce one native not-found outcome without a local preflight or fallback", async () => {
  for (const mode of ["stale", "mismatched"] as const) {
    const f = await fixture()
    if (mode === "stale") f.stale()
    else f.request.sessionID = "worker"
    await expect(f.call()).rejects.toThrow("do not retry automatically")
    expect([...f.records.values()][0]).toMatchObject({ status: "error", nativeReply: "not-applied" })
    expect([...f.records.values()][0]).not.toHaveProperty("requestSummary")
    expect(f.reply).toHaveBeenCalledTimes(1)
    expect(f.get).not.toHaveBeenCalled()
    expect(f.localReply).not.toHaveBeenCalled()
    expect(JSON.stringify([...f.records.values()])).not.toContain("private server body")
    f.cleanup()
  }
})

test("new audit records leave historical request summaries untouched", async () => {
  const f = await fixture()
  const historical = { requestSummary: "historical payload", status: "succeeded" }
  f.records.set("decisions/historical", historical)
  await f.call()
  expect(f.records.get("decisions/historical")).toEqual(historical)
  expect([...f.records.values()].filter((record) => "requestSummary" in record)).toEqual([historical])
  f.cleanup()
})

test("intent storage failure prevents reply; native errors have durable uncertain outcomes", async () => {
  const failedIntent = await fixture()
  failedIntent.failWrite(1)
  await expect(failedIntent.call()).rejects.toThrow()
  expect(failedIntent.reply).not.toHaveBeenCalled()
  expect(failedIntent.connect).not.toHaveBeenCalled()
  failedIntent.cleanup()
  const f = await fixture()
  f.failReply()
  await expect(f.call()).rejects.toThrow("Native permission reply failed")
  expect([...f.records.values()][0]).toMatchObject({ status: "error", nativeReply: "uncertain" })
  expect(f.reply).toHaveBeenCalledTimes(1)
  expect(JSON.stringify([...f.records.values()])).not.toContain("private native API failure")
  f.cleanup()
})

test("outcome audit failure after native success is explicit and does not retry", async () => {
  const f = await fixture()
  f.failWrite(2)
  await expect(f.call()).rejects.toThrow("native reply succeeded but outcome audit failed")
  expect(f.reply).toHaveBeenCalledTimes(1)
  expect([...f.records.values()][0]).toMatchObject({ status: "intent", nativeReply: "not-called" })
  f.cleanup()
})

test("selection, ancestry changes and unload after intent block the native reply", async () => {
  for (const mode of ["selection", "ancestry", "unload"]) {
    const f = await fixture()
    f.onWrite((count) => {
      if (count !== 1) return
      if (mode === "selection") f.sessions.get("super")!.agent = "build"
      else if (mode === "ancestry") f.sessions.get("worker")!.parentID = "other"
      else f.cleanup()
    })
    await expect(f.call()).rejects.toThrow()
    expect(f.reply).not.toHaveBeenCalled()
    expect([...f.records.values()][0]).toMatchObject({ status: "error", nativeReply: "not-called" })
    f.cleanup()
  }
})

test("API error plus failed outcome audit reports uncertainty without retry", async () => {
  const f = await fixture()
  f.failReply()
  f.failWrite(2)
  await expect(f.call()).rejects.toThrow("outcome audit unavailable; native reply uncertain")
  expect(f.reply).toHaveBeenCalledTimes(1)
  f.cleanup()
})

test("official client sends one session-scoped reply across worker locations for every native decision", async () => {
  for (const [tool, decision] of [["autopilot_allow_once", "once"], ["autopilot_allow_always", "always"], ["autopilot_reject", "reject"]] as const) {
    const requests: Array<{ path: string; method: string; body?: unknown }> = []
    const discover = mock(async () => ({ url: "http://managed.invalid", auth: undefined }))
    const fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      const path = new URL(String(url)).pathname
      requests.push({ path, method: init!.method!, ...(init?.body ? { body: JSON.parse(String(init.body)) } : {}) })
      if (path === "/api/info") return Response.json({ pid: process.pid })
      return new Response(null, { status: 204 })
    }) as unknown as typeof globalThis.fetch
    const f = await fixture({}, (signal) => managedPermissionClient(signal, discover, (options) => OpenCode.make({ ...options, fetch })))
    f.onWrite(() => { f.sessions.get("nested")!.location = { directory: "/moved-worker", workspaceID: "new-workspace" } })
    const message = decision === "reject" ? "Keep the exact feedback.\nDo not run this." : undefined
    await f.call(tool, { sessionID: "nested", requestID: "req", ...(message ? { message } : {}) })
    expect(requests).toEqual([
      { path: "/api/info", method: "GET" },
      { path: "/api/session/nested/permission/req/reply", method: "POST", body: { decision, ...(message ? { message } : {}) } },
    ])
    expect(discover).toHaveBeenCalledTimes(1)
    expect(f.get).not.toHaveBeenCalled()
    expect(f.localReply).not.toHaveBeenCalled()
    expect([...f.records.values()][0]).toMatchObject({ status: "succeeded", nativeReply: "succeeded" })
    f.cleanup()
  }
})

test("missing, failed or different managed hosts fail closed without a reply or private error details", async () => {
  for (const mode of ["missing", "discovery", "different", "info"] as const) {
    const methods: string[] = []
    const discover = mock(async () => {
      if (mode === "discovery") throw new Error("private registration details")
      return mode === "missing" ? undefined : { url: "http://managed.invalid", auth: undefined }
    })
    const fetch = mock(async (_url: unknown, init?: RequestInit) => {
      methods.push(init!.method!)
      if (mode === "info") throw new Error("private transport details")
      return Response.json({ pid: process.pid + 1 })
    }) as unknown as typeof globalThis.fetch
    const f = await fixture({}, (signal) => managedPermissionClient(signal, discover, (options) => OpenCode.make({ ...options, fetch })))
    await expect(f.call()).rejects.toThrow("own shared managed OpenCode server")
    expect(methods).not.toContain("POST")
    expect(f.localReply).not.toHaveBeenCalled()
    expect([...f.records.values()][0]).toMatchObject({ status: "error", nativeReply: "not-called" })
    expect(JSON.stringify([...f.records.values()])).not.toContain("private")
    f.cleanup()
  }
})

test("official native not-found and transport errors retain distinct certainty without retry or raw response data", async () => {
  for (const mode of ["stale", "transport", "foreign-error"] as const) {
    let posts = 0
    const fetch = mock(async (_url: unknown, init?: RequestInit) => {
      if (init!.method === "GET") return Response.json({ pid: process.pid })
      posts++
      if (mode === "transport") throw new Error("private transport details")
      return Response.json({
        _tag: "PermissionNotFoundError", requestID: mode === "stale" ? "req" : "foreign", message: "private response details",
      }, { status: 404 })
    }) as unknown as typeof globalThis.fetch
    const f = await fixture({}, (signal) => managedPermissionClient(
      signal, async () => ({ url: "http://managed.invalid", auth: undefined }), (options) => OpenCode.make({ ...options, fetch }),
    ))
    await expect(f.call()).rejects.toThrow("do not retry automatically")
    expect(posts).toBe(1)
    expect([...f.records.values()][0]).toMatchObject({ status: "error", nativeReply: mode === "stale" ? "not-applied" : "uncertain" })
    expect(JSON.stringify([...f.records.values()])).not.toContain("private")
    expect(f.get).not.toHaveBeenCalled()
    expect(f.localReply).not.toHaveBeenCalled()
    f.cleanup()
  }
})

test("cancellation and changed ancestry during connection prevent the native reply", async () => {
  for (const mode of ["cancel", "ancestry"] as const) {
    const f = await fixture()
    const controller = new AbortController()
    f.onConnect(() => {
      if (mode === "cancel") controller.abort()
      else f.sessions.get("nested")!.parentID = "other"
    })
    await expect(f.call(undefined, undefined, undefined, undefined, controller.signal)).rejects.toThrow()
    expect(f.reply).not.toHaveBeenCalled()
    expect([...f.records.values()][0]).toMatchObject({ status: "error", nativeReply: "not-called" })
    f.cleanup()
  }
})

test("cancellation after reply invocation propagates the signal and retains uncertainty without retry", async () => {
  const controller = new AbortController()
  const reply = mock(async (
    _input: Parameters<ReturnType<typeof OpenCode.make>["permission"]["reply"]>[0],
    options?: Parameters<ReturnType<typeof OpenCode.make>["permission"]["reply"]>[1],
  ) => {
    controller.abort()
    options!.signal!.throwIfAborted()
  })
  const f = await fixture({}, async () => ({ reply }))
  await expect(f.call(undefined, undefined, undefined, undefined, controller.signal)).rejects.toThrow("result is uncertain")
  expect(reply).toHaveBeenCalledTimes(1)
  expect([...f.records.values()][0]).toMatchObject({ status: "error", nativeReply: "uncertain" })
  expect(f.localReply).not.toHaveBeenCalled()
  f.cleanup()
})

test("reject requires a nonblank message and executors validate extra/invalid input", async () => {
  const f = await fixture()
  for (const message of [undefined, "", "  ", 1, "a".repeat(4001)]) {
    await expect(f.call("autopilot_reject", { sessionID: "nested", requestID: "req", message })).rejects.toThrow("nonblank")
  }
  await expect(f.call(undefined, { sessionID: "nested", requestID: "req", agent: "supervisor" })).rejects.toThrow("Unexpected")
  await expect(f.call(undefined, { sessionID: "", requestID: "req" })).rejects.toThrow("identifiers")
  expect(f.reply).not.toHaveBeenCalled()
  f.cleanup()
})

test("role guidance supplements the base prompt only for supervisor and worker agent loops", async () => {
  const f = await fixture()
  for (const [name, hook] of f.hooks) {
    for (const agent of ["supervisor", "worker", "build", "general", "explore"]) {
      const base = { type: "text" as const, text: "Provider base and project instructions" }
      const event = { agent, system: [base], tools: {} }
      hook(event)
      hook(event)
      const role = agent === "supervisor" || agent === "worker" ? prompts[agent] : undefined
      expect(event.system).toEqual(name === "context" && role ? [base, { type: "text", text: role }] : [base])
    }
  }
  f.cleanup()
})

test("worker model requests conceal all decision tools on each model hook", async () => {
  const f = await fixture()
  for (const hook of f.hooks.values()) {
    const tools = Object.fromEntries([...f.tools.keys(), "read"].map((key) => [key, {}]))
    hook({ agent: "build", tools, system: [] })
    expect(Object.keys(tools)).toEqual(["read"])
    const supervisorTools = Object.fromEntries([...f.tools.keys()].map((key) => [key, {}]))
    hook({ agent: "supervisor", tools: supervisorTools, system: [] })
    expect(Object.keys(supervisorTools)).toHaveLength(3)
  }
  f.cleanup()
})
