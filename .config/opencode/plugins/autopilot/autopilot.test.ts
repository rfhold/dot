import { describe, expect, test } from "bun:test"
import type { FormDetail, OpenCodeClient, PermissionRequest, SessionInfo } from "@opencode/client"
import type { Plugin } from "@opencode/plugin"
import { Service, type Endpoint } from "@opencode/client/service"
import { makeBridge } from "./bridge"
import { createController, decisionPrompt, decode, readSnapshot, type Registry, type Snapshot } from "./controller"
import { parseRequest } from "./policy"
import { setupAutopilot } from "./index"

const directory = "/workspace"
const worker = { id: "worker", agent: "build", model: { id: "model", providerID: "provider" }, location: { directory }, time: { created: 1, updated: 1 } } as SessionInfo
const request = () => parseRequest("Fix the bug, test it, and use blue for the theme. Keep this local.")
const form = { id: "form", sessionID: "worker", title: "Choose a color", fields: [{ key: "color", type: "string" }], state: { status: "pending" } } as FormDetail
const permission = { id: "permission", sessionID: "worker", action: "shell", resources: ["bun test"], source: { type: "tool", messageID: "message", id: "call" } } as PermissionRequest
const shell: Snapshot["shells"][number] = { info: { id: "shell", status: "running", command: "bun test", cwd: directory, time: { started: 1 } } as any, output: "ERROR: deadlocked waiting for itself", size: 34, stagnant: true }
function snapshot(): Snapshot { return { worker, running: false, queued: false, reminder: false, children: [], tools: [], messages: [], omittedMessages: 0, forms: [], permissions: [], shells: [] } }
function proxy(action: "answer" | "approve" | "cancel", extra: object = {}) {
  return { action, reason: "Confidently represents the local task", authority: "local", risk: "local", authorization: "Fix the bug, test it", ...extra }
}
function harness(registry: Registry = new Map()) {
  let now = 1_000_000
  let state = snapshot()
  let result = JSON.stringify({ action: "wait", reason: "Need human clarification" })
  let generate: (() => Promise<{ text: string }>) | undefined
  let fail = false
  let getForm: (() => Promise<FormDetail>) | undefined
  let getPermission: (() => Promise<PermissionRequest>) | undefined
  const actions: { method: string; input: any }[] = []
  const record = (method: string, output: unknown) => async (input: unknown) => { actions.push({ method, input }); return output }
  const client = {
    session: {
      get: async () => worker,
      create: record("create", { ...worker, id: "supervisor", agent: "autopilot" }),
      remove: record("removeSupervisor", undefined),
      synthetic: record("synthetic", {}),
      generate: async (input: unknown) => { actions.push({ method: "generate", input }); if (fail) throw new Error("model unavailable"); return generate ? generate() : { text: result } },
      form: { get: async () => getForm ? getForm() : structuredClone(state.forms[0]!), reply: record("answer", {}) },
    },
    permission: {
      get: async () => getPermission ? getPermission() : structuredClone(state.permissions[0]!),
      list: async () => structuredClone(state.permissions), reply: record("approve", undefined),
    },
    shell: { remove: record("cancel", undefined) },
  } as unknown as OpenCodeClient
  const controller = createController(directory, registry, {
    bridge: () => ({ client, verify: async () => { if (fail) throw new Error("bridge failed") } }),
    now: () => now, snapshot: async () => structuredClone(state),
  })
  return {
    controller, registry, actions, client,
    state: (next: Snapshot) => { state = next }, decision: (value: object) => { result = JSON.stringify(value) },
    generate: (fn: () => Promise<{ text: string }>) => { generate = fn },
    formGet: (fn: () => Promise<FormDetail>) => { getForm = fn }, permissionGet: (fn: () => Promise<PermissionRequest>) => { getPermission = fn },
    fail: () => { fail = true }, advance: (delta: number) => { now += delta },
  }
}

function discovery(endpoint: Awaited<ReturnType<typeof Service.discover>>) {
  let calls = 0, headerCalls = 0
  return {
    api: { discover: async () => { calls++; return endpoint }, headers: (value: Endpoint) => { headerCalls++; return Service.headers(value) } },
    counts: () => ({ calls, headerCalls }),
  }
}

describe("authenticated bridge", () => {
  test("partial explicit configuration fails closed without discovering or mixing credentials", async () => {
    const service = discovery({ url: "http://127.0.0.1:4096", auth: undefined })
    for (const env of [{ OPENCODE_AUTOPILOT_URL: "http://127.0.0.1:5000" }, { OPENCODE_AUTOPILOT_AUTHORIZATION: "Bearer secret" }, { OPENCODE_AUTOPILOT_URL: "", OPENCODE_AUTOPILOT_AUTHORIZATION: "" }]) {
      await expect(makeBridge(directory, "nonce", env, undefined, service.api)).rejects.toThrow("Set both")
    }
    expect(service.counts()).toEqual({ calls: 0, headerCalls: 0 })
  })
  test("rejects unsafe explicit origins without discovery", async () => {
    const service = discovery(undefined)
    for (const url of ["http://remote.example", "https://user:secret@example.com", "https://example.com/path", "https://example.com/?token=secret"]) {
      await expect(makeBridge(directory, "nonce", { OPENCODE_AUTOPILOT_URL: url, OPENCODE_AUTOPILOT_AUTHORIZATION: "Bearer env-only" }, undefined, service.api)).rejects.toThrow()
    }
    expect(service.counts().calls).toBe(0)
  })
  test("explicit overrides skip discovery, authenticate, reject redirects and prove same-server identity", async () => {
    const service = discovery(undefined)
    let observed: Request | undefined
    const transport = (async (input: RequestInfo | URL) => { observed = new Request(input); return Response.json({ output: "local-nonce" }) }) as typeof fetch
    const env = { OPENCODE_AUTOPILOT_URL: "http://127.0.0.1:4096", OPENCODE_AUTOPILOT_AUTHORIZATION: "Bearer env-only" }
    const bridge = await makeBridge(directory, "local-nonce", env, transport, service.api)
    await bridge.verify(new AbortController().signal)
    expect(observed?.headers.get("authorization")).toBe("Bearer env-only")
    expect(observed?.redirect).toBe("error")
    expect(observed?.url).toContain("/api/rpc/rfhold.autopilot/identity")
    const wrong = await makeBridge(directory, "different-server", env, transport, service.api)
    await expect(wrong.verify(new AbortController().signal)).rejects.toThrow("same server")
    expect(service.counts()).toEqual({ calls: 0, headerCalls: 0 })
  })
  test("discovers a healthy existing endpoint and uses native optional-auth headers", async () => {
    for (const auth of [undefined, { type: "basic" as const, username: "opencode", password: "test-only-secret" }]) {
      const endpoint = { url: "http://127.0.0.1:4096", auth }, service = discovery(endpoint)
      let observed: Request | undefined
      const transport = (async (input: RequestInfo | URL) => { observed = new Request(input); return Response.json({ output: "local-nonce" }) }) as typeof fetch
      const bridge = await makeBridge(directory, "local-nonce", {}, transport, service.api)
      expect(observed).toBeUndefined()
      await bridge.verify(new AbortController().signal)
      expect(observed?.headers.get("authorization")).toBe(Service.headers(endpoint)?.authorization ?? null)
      expect(observed?.redirect).toBe("error")
      expect(service.counts()).toEqual({ calls: 1, headerCalls: 1 })
    }
  })
  test("discovered endpoints retain origin protections and identity errors never expose credentials", async () => {
    let requests = 0
    const transport = (async (_input: RequestInfo | URL): Promise<Response> => { requests++; throw new Error("Transport detail containing test-only-secret") }) as typeof fetch
    for (const url of ["http://remote.example", "https://user:secret@example.com", "https://example.com/path", "https://example.com/?token=secret"]) {
      await expect(makeBridge(directory, "nonce", {}, transport, discovery({ url, auth: undefined }).api)).rejects.toThrow("Bridge URL")
    }
    expect(requests).toBe(0)
    const bridge = await makeBridge(directory, "nonce", {}, transport, discovery({ url: "http://127.0.0.1:4096", auth: undefined }).api)
    try { await bridge.verify(new AbortController().signal); throw new Error("Unexpected identity proof") } catch (error) {
      expect(String(error)).toContain("identity check failed")
      expect(String(error)).not.toContain("test-only-secret")
    }
  })
  test("missing, failed or wrong-server discovery never reaches task-session operations", async () => {
    for (const kind of ["missing", "failed", "wrong-server"] as const) {
      const service = discovery(kind === "missing" ? undefined : { url: "http://127.0.0.1:4096", auth: undefined })
      if (kind === "failed") service.api.discover = async () => { throw new Error("Registration failure with secret password") }
      const paths: string[] = []
      const transport = (async (input: RequestInfo | URL) => { paths.push(new URL(new Request(input).url).pathname); return Response.json({ output: "different-server-nonce" }) }) as typeof fetch
      const controller = createController(directory, new Map(), { bridge: (signal) => makeBridge(directory, "local-nonce", {}, transport, service.api, signal), now: Date.now })
      try { await controller.start("worker", request()); throw new Error("Unexpected admission") } catch (error) {
        expect(String(error)).not.toContain("secret password")
        expect(String(error)).toContain(kind === "missing" ? "No healthy compatible" : kind === "failed" ? "could not discover" : "same server")
      }
      expect(paths).toEqual(kind === "wrong-server" ? ["/api/rpc/rfhold.autopilot/identity"] : [])
      expect(controller.status("worker")).toContain("startup failed")
      await controller.close()
    }
  })
  test("discovery cancellation is bounded and discards a late endpoint", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof Service.discover>>) => void
    const service = discovery(undefined), abort = new AbortController()
    service.api.discover = () => new Promise((done) => { resolve = done })
    let requests = 0
    const transport = (async (_input: RequestInfo | URL) => { requests++; return Response.json({ output: "nonce" }) }) as typeof fetch
    const pending = makeBridge(directory, "nonce", {}, transport, service.api, abort.signal)
    await Promise.resolve()
    abort.abort()
    await expect(pending).rejects.toThrow("cancelled or timed out")
    resolve({ url: "http://127.0.0.1:4096", auth: undefined })
    await Promise.resolve(); await Promise.resolve()
    expect(requests).toBe(0)
    expect(service.counts().headerCalls).toBe(0)
  })
  test("stop aborts pending controller discovery without admitting late task operations", async () => {
    const service = discovery(undefined)
    let entered!: () => void, resolve!: (value: Awaited<ReturnType<typeof Service.discover>>) => void
    const discovering = new Promise<void>((done) => { entered = done })
    service.api.discover = () => { entered(); return new Promise((done) => { resolve = done }) }
    let requests = 0
    const transport = (async (_input: RequestInfo | URL) => { requests++; return Response.json({ output: "nonce" }) }) as typeof fetch
    const controller = createController(directory, new Map(), { bridge: (signal) => makeBridge(directory, "nonce", {}, transport, service.api, signal), now: Date.now })
    const starting = controller.start("worker", request())
    await discovering
    controller.stop("worker")
    await expect(starting).rejects.toThrow("cancelled or timed out")
    resolve({ url: "http://127.0.0.1:4096", auth: undefined })
    await controller.close()
    expect(requests).toBe(0)
    expect(service.counts().headerCalls).toBe(0)
  })
  test("each run discovers once but rechecks its nonce before subsequent reviews and cleanup", async () => {
    const service = discovery({ url: "http://127.0.0.1:4096", auth: undefined }), h = harness()
    let nonce = "local-nonce", proofs = 0, reads = 0
    const transport = (async (_input: RequestInfo | URL) => { proofs++; return Response.json({ output: nonce }) }) as typeof fetch
    const controller = createController(directory, new Map(), {
      bridge: async (signal) => { const bridge = await makeBridge(directory, "local-nonce", {}, transport, service.api, signal); return { client: h.client, verify: bridge.verify } },
      now: Date.now, snapshot: async () => { reads++; return { ...snapshot(), running: true } },
    })
    expect(service.counts().calls).toBe(0)
    await controller.start("worker", request())
    await controller.tick("worker"); await controller.tick("worker")
    expect(service.counts().calls).toBe(1)
    expect(proofs).toBe(3); expect(reads).toBe(2)
    nonce = "different-server"
    await controller.tick("worker")
    expect(reads).toBe(2)
    await controller.close()
    expect(proofs).toBe(5)
    expect(h.actions.some((action) => action.method === "removeSupervisor")).toBe(false)
  })
  test("bridge failure and stop during startup admit no worker goal", async () => {
    const failed = harness(); failed.fail()
    await expect(failed.controller.start("worker", request())).rejects.toThrow()
    expect(failed.actions).toHaveLength(0)
    const stopped = harness()
    const starting = stopped.controller.start("worker", request())
    stopped.controller.stop("worker")
    await starting
    expect(stopped.actions).toHaveLength(0)
  })
  test("a supervisor created after stop is cleaned up without resuming the worker", async () => {
    const h = harness()
    let resolve!: (value: SessionInfo) => void
    h.client.session.create = async () => new Promise((done) => { resolve = done })
    const pending = h.controller.start("worker", request())
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    h.controller.stop("worker")
    resolve({ ...worker, id: "late-supervisor", agent: "autopilot" })
    await pending
    await h.controller.close()
    expect(h.actions.some((action) => action.method === "synthetic")).toBe(false)
    expect(h.actions.find((action) => action.method === "removeSupervisor")?.input).toEqual({ sessionID: "late-supervisor" })
  })
})

describe("human proxy", () => {
  test("plain goals inherit the worker model without changing worker agent or permissions", async () => {
    const h = harness()
    expect(h.controller.status("worker")).toBe("inactive")
    await h.controller.start("worker", request())
    expect(h.actions[0]?.input).toMatchObject({ parentID: "worker", agent: "autopilot", model: worker.model, permissions: [{ action: "*", resource: "*", effect: "deny" }] })
    expect(h.actions[1]?.input).toMatchObject({ sessionID: "worker", resume: true, text: `Autopilot goal: ${request().goal}` })
    await expect(h.controller.start("worker", request())).rejects.toThrow("already active")
    expect(h.controller.stop("worker")).toContain("untouched")
    await h.controller.tick("worker")
    expect(h.actions.filter((a) => a.method === "synthetic")).toHaveLength(1)
    expect(h.actions.find((a) => a.method === "removeSupervisor")?.input).toEqual({ sessionID: "supervisor" })
    expect(() => parseRequest('Fix --scope {"files":["a.ts"]}')).toThrow("no longer supported")
    expect(() => parseRequest(" ")).toThrow()
  })
  test("an unselected worker model uses native selection without a guessed model ID", async () => {
    const h = harness()
    h.client.session.get = async () => ({ ...worker, model: undefined })
    await h.controller.start("worker", request())
    expect(h.actions.find((action) => action.method === "create")?.input.model).toBeUndefined()
  })
  test("derives a pending form answer from the goal without prewritten answer grants", async () => {
    const h = harness(); await h.controller.start("worker", request())
    h.state({ ...snapshot(), forms: [form] })
    h.decision(proxy("answer", { id: "form", answer: { color: "blue" }, authorization: "use blue for the theme" }))
    await h.controller.tick("worker")
    expect(h.actions.find((a) => a.method === "answer")?.input).toEqual({ sessionID: "worker", formID: "form", answer: { color: "blue" } })
  })
  test("approves only a genuinely pending worker request, once, with no permission rules", async () => {
    const h = harness(); await h.controller.start("worker", request())
    h.state({ ...snapshot(), running: true, permissions: [permission] })
    h.decision(proxy("approve", { id: permission.id }))
    await h.controller.tick("worker")
    expect(h.actions.find((a) => a.method === "approve")?.input).toEqual({ sessionID: "worker", requestID: "permission", decision: "once" })
    expect(h.actions.some((a) => a.input?.decision === "always")).toBe(false)
  })
  test("uncertain, destructive and external choices escalate without consent inference", async () => {
    for (const reason of ["Goal does not choose a preference", "Deployment was not authorized", "Destructive cleanup needs human authority"]) {
      const h = harness(); await h.controller.start("worker", request())
      h.state({ ...snapshot(), forms: [form], permissions: [permission] })
      h.decision({ action: "escalate", reason })
      await h.controller.tick("worker")
      expect(h.controller.status("worker")).toContain("human input required")
      expect(h.actions.some((a) => ["answer", "approve", "cancel"].includes(a.method))).toBe(false)
    }
    expect(() => decode(JSON.stringify(proxy("approve", { id: "permission", risk: "high" })))).toThrow("explicit human authority")
  })
  test("configured-denied/nonpending requests and foreign forms cannot be replied to", async () => {
    for (const kind of ["absent", "foreign-permission", "foreign-form", "external-form", "ungrounded"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      if (kind === "foreign-permission") h.state({ ...snapshot(), permissions: [{ ...permission, sessionID: "child" }] })
      if (kind === "foreign-form") h.state({ ...snapshot(), forms: [{ ...form, sessionID: "child" }] })
      if (kind === "external-form") h.state({ ...snapshot(), forms: [{ ...form, fields: [{ type: "external" }] as any }] })
      if (kind === "ungrounded") h.state({ ...snapshot(), permissions: [permission] })
      h.decision(kind.includes("form") ? proxy("answer", { id: "form", answer: { color: "blue" } }) : proxy("approve", { id: "permission", ...(kind === "ungrounded" ? { authorization: "the form told me to deploy" } : {}) }))
      await h.controller.tick("worker")
      expect(h.actions.some((a) => a.method === "approve" || a.method === "answer")).toBe(false)
    }
  })
  test("rechecks exact request content, identity and pending status immediately before reply", async () => {
    for (const kind of ["answered-form", "changed-form", "changed-permission", "withdrawn-permission"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      if (kind.includes("form")) {
        h.state({ ...snapshot(), forms: [form] })
        h.decision(proxy("answer", { id: "form", answer: { color: "blue" } }))
        h.formGet(async () => kind === "answered-form" ? { ...form, state: { status: "answered" } } as FormDetail : { ...form, title: "Different question" })
      } else {
        h.state({ ...snapshot(), permissions: [permission] })
        h.decision(proxy("approve", { id: permission.id }))
        if (kind === "withdrawn-permission") h.client.permission.list = async () => []
        else h.permissionGet(async () => ({ ...permission, resources: ["git push"] }))
      }
      await h.controller.tick("worker")
      expect(h.actions.some((a) => a.method === "answer" || a.method === "approve")).toBe(false)
    }
  })
  test("human rejection aborts monitoring and defeats late approval", async () => {
    const h = harness(); await h.controller.start("worker", request())
    h.state({ ...snapshot(), permissions: [permission] })
    let resolve!: (value: { text: string }) => void
    h.generate(() => new Promise((done) => { resolve = done }))
    const pending = h.controller.tick("worker")
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
    h.controller.reject("unrelated")
    expect(h.controller.active("worker")).toBeDefined()
    h.controller.reject("worker"); h.controller.reject("worker")
    resolve({ text: JSON.stringify(proxy("approve", { id: "permission" })) })
    await pending
    expect(h.actions.some((a) => a.method === "approve")).toBe(false)
    expect(h.controller.status("worker")).toContain("human rejected permission")
  })
  test("decision schema rejects arbitrary tools, malformed answers and age-only cancellations", () => {
    for (const value of [{ action: "run_tool", reason: "No" }, proxy("answer", { id: "form", answer: { color: {} } }), proxy("cancel", { id: "shell", problem: "stuck", evidence: "" }), { action: "complete", reason: "No hidden mutations", answer: { commit: true } }, { action: "complete", reason: "Too much evidence", evidenceIndices: Array.from({ length: 9 }, (_, i) => i) }, { action: "complete", reason: "Invalid acknowledgment", verifiedGoal: "true" }]) {
      expect(() => decode(JSON.stringify(value))).toThrow()
    }
  })
})

describe("idle and shell supervision", () => {
  test("real background wakeups wait; unfinished idle without a source is nudged", async () => {
    for (const source of [{ queued: true }, { reminder: true }, { children: ["cross-worktree-child"] }, { tools: ["running-tool"] }, { shells: [{ ...shell, info: { ...shell.info, time: { started: 999_999 } } }] }]) {
      const h = harness(); await h.controller.start("worker", request())
      h.state({ ...snapshot(), ...source })
      await h.controller.tick("worker")
      expect(h.actions.some((a) => a.method === "generate")).toBe(false)
    }
    const h = harness(); await h.controller.start("worker", request())
    h.decision({ action: "nudge", reason: "Unfinished without any pending wakeup" })
    await h.controller.tick("worker")
    expect(h.actions.filter((a) => a.method === "synthetic" && a.input.resume)).toHaveLength(2)
  })
  test("concrete stuck or suboptimal execution evidence permits owned-shell cancellation", async () => {
    for (const problem of ["stuck", "suboptimal"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      h.state({ ...snapshot(), shells: [{ ...shell, stagnant: problem === "stuck" }] })
      h.decision(proxy("cancel", { id: "shell", problem, evidence: "deadlocked waiting for itself" }))
      await h.controller.tick("worker")
      expect(h.actions.find((a) => a.method === "cancel")?.input).toEqual({ id: "shell", location: { directory } })
    }
  })
  test("healthy quiet shells, progress, missing evidence and foreign IDs never cause age-only cancellation", async () => {
    for (const kind of ["quiet", "progress", "missing-evidence", "foreign"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      h.state({ ...snapshot(), shells: [{ ...shell, stagnant: kind !== "progress", ...(kind === "quiet" ? { output: "Watching for changes" } : {}) }] })
      h.decision(kind === "quiet" ? { action: "wait", reason: "Healthy watcher has a real wakeup" } : proxy("cancel", { id: kind === "foreign" ? "other-shell" : "shell", problem: "stuck", evidence: kind === "missing-evidence" ? "not actually present in output" : "deadlocked waiting for itself" }))
      await h.controller.tick("worker")
      expect(h.actions.some((a) => a.method === "cancel")).toBe(false)
    }
  })
  test("fresh-snapshot progress invalidates an earlier stuck decision", async () => {
    const h = harness(); await h.controller.start("worker", request())
    h.state({ ...snapshot(), shells: [shell] })
    h.generate(async () => { h.state({ ...snapshot(), shells: [{ ...shell, output: "Tests progressing", size: 200, stagnant: false }] }); return { text: JSON.stringify(proxy("cancel", { id: "shell", problem: "stuck", evidence: "deadlocked waiting for itself" })) } })
    await h.controller.tick("worker")
    expect(h.actions.some((a) => a.method === "cancel")).toBe(false)
  })
  test("suboptimal cancellation tolerates advancing logs with the same owned shell and diagnostic", async () => {
    const h = harness(); await h.controller.start("worker", request())
    h.state({ ...snapshot(), shells: [{ ...shell, stagnant: false }] })
    h.generate(async () => {
      h.state({ ...snapshot(), worker: { ...worker, time: { ...worker.time, updated: 2 } }, shells: [{ ...shell, stagnant: false, size: 400, output: `${shell.output}\nretry 20: still wasting execution` }] })
      return { text: JSON.stringify(proxy("cancel", { id: "shell", problem: "suboptimal", evidence: "deadlocked waiting for itself" })) }
    })
    await h.controller.tick("worker"); await h.controller.tick("worker")
    expect(h.actions.filter((a) => a.method === "cancel")).toHaveLength(1)
  })
  test("cancellation freshness rejects replaced identity, ownership, diagnostic and running status", async () => {
    for (const changed of ["command", "cwd", "started", "ownership", "diagnostic", "status"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      h.state({ ...snapshot(), shells: [shell] })
      h.generate(async () => {
        const replacement = structuredClone(shell)
        if (changed === "command") replacement.info.command = "unrelated command"
        if (changed === "cwd") replacement.info.cwd = "/other-project"
        if (changed === "started") replacement.info.time.started++
        if (changed === "status") replacement.info.status = "exited"
        if (changed === "diagnostic") replacement.output = "healthy ongoing output"
        h.state({ ...snapshot(), shells: changed === "ownership" ? [] : [replacement] })
        return { text: JSON.stringify(proxy("cancel", { id: "shell", problem: "suboptimal", evidence: "deadlocked waiting for itself" })) }
      })
      await h.controller.tick("worker")
      expect(h.actions.some((a) => a.method === "cancel")).toBe(false)
    }
  })
})

describe("bounded lifecycle", () => {
  test("completion and idle uncertainty stop monitoring without waking the worker", async () => {
    for (const action of ["complete", "escalate", "wait"]) {
      const h = harness(); await h.controller.start("worker", request())
      h.decision({ action, reason: "Reviewed goal" })
      await h.controller.tick("worker")
      expect(h.controller.active("worker")).toBeUndefined()
      expect(h.actions.filter((a) => a.method === "synthetic").at(-1)?.input.resume).toBe(false)
    }
  })
  test("non-cancellation actions retain full current-snapshot freshness", async () => {
    for (const action of ["answer", "approve", "nudge", "complete"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      const before = { ...snapshot(), ...(action === "answer" ? { forms: [form] } : {}), ...(action === "approve" ? { permissions: [permission] } : {}) }
      h.state(before)
      h.generate(async () => {
        h.state({ ...before, worker: { ...worker, time: { ...worker.time, updated: 2 } } })
        return { text: JSON.stringify(action === "answer" ? proxy("answer", { id: "form", answer: { color: "blue" } }) : action === "approve" ? proxy("approve", { id: "permission" }) : { action, reason: "Now stale" }) }
      })
      await h.controller.tick("worker")
      expect(h.controller.status("worker").startsWith("active")).toBe(true)
      expect(h.actions.filter((a) => ["answer", "approve"].includes(a.method))).toHaveLength(0)
      expect(h.actions.filter((a) => a.method === "synthetic")).toHaveLength(1)
    }
  })
  test("duplicate triggers and late decisions after stop/unload cannot mutate", async () => {
    for (const how of ["stop", "close"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      let resolve!: (value: { text: string }) => void
      h.generate(() => new Promise((done) => { resolve = done }))
      const pending = h.controller.tick("worker")
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve()
      await h.controller.tick("worker")
      expect(h.actions.filter((a) => a.method === "generate")).toHaveLength(1)
      if (how === "stop") h.controller.stop("worker"); else await h.controller.close()
      resolve({ text: JSON.stringify({ action: "nudge", reason: "Late" }) })
      await pending
      expect(h.actions.filter((a) => a.method === "synthetic")).toHaveLength(1)
      expect(h.actions.filter((a) => a.method === "removeSupervisor")).toHaveLength(1)
    }
  })
  test("budgets, repeated failures and uncertain mutations stop monitoring", async () => {
    const failed = harness(); await failed.controller.start("worker", request()); failed.fail()
    await failed.controller.tick("worker"); await failed.controller.tick("worker")
    expect(failed.controller.status("worker")).toContain("repeated failure")
    for (const limit of ["lifetime", "calls", "interventions"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      if (limit === "lifetime") h.advance(3_600_001); else h.registry.get("worker")![limit] = limit === "calls" ? 24 : 12
      await h.controller.tick("worker")
      expect(h.controller.status("worker")).toContain("budget exhausted")
    }
    const unknown = harness(); await unknown.controller.start("worker", request())
    unknown.decision({ action: "nudge", reason: "Unfinished" })
    unknown.client.session.synthetic = async () => { throw new Error("Lost response after possible admission") }
    await unknown.controller.tick("worker"); await unknown.controller.tick("worker")
    expect(unknown.controller.status("worker")).toContain("mutation outcome unknown")
    expect(unknown.actions.filter((a) => a.method === "generate")).toHaveLength(1)
  })
  test("cooldown defers a second nudge without duplicate reviews", async () => {
    const h = harness(); await h.controller.start("worker", request())
    h.decision({ action: "nudge", reason: "Unfinished" }); await h.controller.tick("worker")
    h.state({ ...snapshot(), worker: { ...worker, time: { ...worker.time, updated: 2 } } }); h.advance(1000)
    await h.controller.tick("worker"); await h.controller.tick("worker")
    expect(h.actions.filter((a) => a.method === "generate")).toHaveLength(2)
    h.advance(120_000); await h.controller.tick("worker")
    expect(h.actions.filter((a) => a.method === "synthetic" && a.input.resume)).toHaveLength(3)
  })
  test("locations share one supervisor, unload owns only its resources, and no guard persists", async () => {
    const registry: Registry = new Map(), a = harness(registry), b = harness(registry)
    await a.controller.start("worker", request())
    await expect(b.controller.start("worker", request())).rejects.toThrow("already active")
    await b.controller.tick("worker"); await b.controller.close()
    expect(b.actions).toHaveLength(0)
    expect(a.controller.active("worker")).toBeDefined()
    await a.controller.close()
    expect(registry.size).toBe(0)
    expect(a.actions.find((a) => a.method === "removeSupervisor")?.input.sessionID).toBe("supervisor")
  })
})

describe("native observations and evidence budgets", () => {
  test("cross-location children and their shells justify idle without becoming cancellation targets", async () => {
    let running = true, background = false
    const child = { ...worker, id: "child", location: { directory: "/other-worktree" } }
    const client = {
      session: {
        get: async () => worker, active: async () => running ? { child: { type: "running" } } : {},
        context: async ({ sessionID }: { sessionID: string }) => sessionID === "child" && background ? [{ type: "shell", shellID: "child-shell" }] : Array.from({ length: sessionID === "worker" ? 14 : 0 }, (_, i) => ({ type: "assistant", id: `message-${i}`, content: [{ type: "text", text: `Evidence ${i}` }] })),
        form: { list: async () => [] }, inbox: { list: async () => [] }, list: async () => ({ data: [child], cursor: {} }),
      }, permission: { list: async () => [] },
      shell: { list: async ({ location }: { location: { directory: string } }) => ({ data: location.directory === child.location.directory && background ? [{ ...shell.info, id: "child-shell" }] : [] }) },
    } as unknown as OpenCodeClient
    const read = () => readSnapshot(directory, { worker: "worker", samples: new Map() }, client, new AbortController().signal, 1_000_000)
    expect((await read()).children).toEqual(["child"])
    running = false; background = true
    expect((await read()).children).toEqual(["child"])
    expect((await read()).shells).toEqual([])
    background = false
    const completed = await read()
    expect(completed.children).toEqual([])
    expect(completed.messages).toHaveLength(14)
    expect(completed.omittedMessages).toBe(0)
    expect(decisionPrompt(request(), completed).incompleteEvidence).toBe(false)
  })
  test("owned shell sampling detects progress, unchanged output and transcript ownership", async () => {
    let size = 10
    const client = {
      session: { get: async () => worker, active: async () => ({}), context: async () => [{ type: "shell", shellID: "owned" }], form: { list: async () => [] }, inbox: { list: async () => [] }, list: async () => ({ data: [], cursor: {} }) },
      permission: { list: async () => [] }, shell: { list: async () => ({ data: [{ ...shell.info, id: "owned" }, { ...shell.info, id: "foreign" }] }), output: async () => ({ data: { size, output: "progress" } }) },
    } as unknown as OpenCodeClient
    const samples = new Map()
    const read = (now: number) => readSnapshot(directory, { worker: "worker", samples }, client, new AbortController().signal, now)
    expect((await read(1000)).shells).toHaveLength(1)
    expect((await read(130_000)).shells[0]?.stagnant).toBe(true)
    size++; expect((await read(131_000)).shells[0]?.stagnant).toBe(false)
  })
  test("observes the local reminders plugin's real shared interval record read-only", async () => {
    const key = Symbol.for("rfhold.reminders.intervals")
    const original: unknown = Reflect.get(globalThis, key)
    const intervals = original instanceof Map ? original : new Map()
    const previous = intervals.get("worker")
    const interval = { owner: {}, cancel: () => {}, pending: false }
    intervals.set("worker", interval); Reflect.set(globalThis, key, intervals)
    const client = {
      session: { get: async () => worker, active: async () => ({}), context: async () => [], form: { list: async () => [] }, inbox: { list: async () => [] }, list: async () => ({ data: [], cursor: {} }) },
      permission: { list: async () => [] }, shell: { list: async () => ({ data: [] }) },
    } as unknown as OpenCodeClient
    try {
      const read = () => readSnapshot(directory, { worker: "worker", samples: new Map() }, client, new AbortController().signal, 1_000_000)
      expect((await read()).reminder).toBe(true)
      expect(intervals.get("worker")).toBe(interval)
      intervals.delete("worker")
      expect((await read()).reminder).toBe(false)
    } finally {
      if (previous) intervals.set("worker", previous); else intervals.delete("worker")
      if (original === undefined) Reflect.deleteProperty(globalThis, key)
    }
  })
  test("large messages retain structured excerpts and full pending request/shell evidence", () => {
    const state = { ...snapshot(), messages: [{ type: "assistant", content: [{ type: "text", text: `start-${"x".repeat(60_000)}-recent-result` }] }] as any, forms: [form], permissions: [permission], shells: [shell] }
    const prepared = decisionPrompt(request(), state), data = JSON.parse(prepared.text.split("DATA ")[1]!)
    expect(data.snapshot.forms).toEqual([form])
    expect(data.snapshot.permissions).toEqual([permission])
    expect(data.snapshot.shells[0].output).toBe(shell.output)
    expect(data.messages[0].message.content[0].text.excerptEnd).toContain("recent-result")
    expect(data.messages[0].index).toBe(0)
    expect(prepared.incompleteEvidence).toBe(true)
    expect(prepared.text.length).toBeLessThan(52_000)
    expect(() => decisionPrompt(request(), { ...snapshot(), forms: [{ ...form, title: "x".repeat(50_000) }] })).toThrow()
    const omitted = decisionPrompt(request(), { ...snapshot(), omittedMessages: 9 })
    expect(JSON.parse(omitted.text.split("DATA ")[1]!).evidenceOmissions.olderMessages).toBe(9)
    expect(omitted.incompleteEvidence).toBe(true)
  })
  test("completion cannot bypass a missing required-evidence selection; critical oversize pauses before inference", async () => {
    for (const state of [{ ...snapshot(), omittedMessages: 2 }, { ...snapshot(), messages: [{ type: "assistant", content: [{ type: "text", text: "x".repeat(60_000) }] }] as any }]) {
      const h = harness(); await h.controller.start("worker", request()); h.state(state)
      h.decision({ action: "complete", reason: "Would incorrectly declare success" }); await h.controller.tick("worker")
      expect(h.controller.status("worker")).toContain("required completion evidence is unavailable")
    }
    const h = harness(); await h.controller.start("worker", request())
    h.state({ ...snapshot(), permissions: [{ ...permission, resources: ["x".repeat(50_000)] }] })
    await h.controller.tick("worker")
    expect(h.controller.status("worker")).toContain("data exceeds safe budget")
    expect(h.actions.some((a) => a.method === "generate")).toBe(false)
  })
  test("long historical transcript can finish after one unabridged full-goal verification", async () => {
    const h = harness(); await h.controller.start("worker", request())
    const verifiedMessage = { id: "verified-result", type: "assistant", content: [{ type: "text", text: "Fixed the parser bug; all parser tests passed; blue theme applied; all changes remain local." }] }
    h.state({ ...snapshot(), messages: [{ type: "assistant", id: "old-history", content: [{ type: "text", text: "historical exploration ".repeat(4000) }] }, verifiedMessage] as any })
    let reviews = 0
    h.generate(async () => ({ text: JSON.stringify(++reviews === 1 ? { action: "complete", reason: "Request final goal evidence", evidenceIndices: [1] } : { action: "complete", reason: "The unabridged final outcome supports every goal obligation", verifiedGoal: true, evidenceIndices: [1] }) }))
    await h.controller.tick("worker")
    expect(h.controller.status("worker")).toContain("complete; reviews 2/24")
    const calls = h.actions.filter((a) => a.method === "generate")
    expect(calls).toHaveLength(2)
    const data = JSON.parse(calls[1]!.input.prompt.split("DATA ")[1])
    expect(data.request.goal).toBe(request().goal)
    expect(data.snapshot.worker.id).toBe("worker")
    expect(data.evidence).toEqual([{ index: 1, message: verifiedMessage }])
    expect(data.requiredEvidenceIndices).toEqual([1])
  })
  test("missing, oversized, inconclusive or incompletely acknowledged required evidence cannot finish", async () => {
    for (const kind of ["missing", "oversized", "inconclusive", "unacknowledged", "wrong-indices", "malformed"] as const) {
      const h = harness(); await h.controller.start("worker", request())
      h.state({ ...snapshot(), messages: [{ type: "assistant", content: [{ type: "text", text: "x".repeat(60_000) }] }, { type: "assistant", content: [{ type: "text", text: "Current task result" }] }] as any })
      let calls = 0
      h.generate(async () => ({ text: JSON.stringify(++calls === 1
        ? { action: "complete", reason: "Select required evidence", evidenceIndices: [kind === "missing" ? 99 : kind === "oversized" ? 0 : 1] }
        : kind === "inconclusive" ? { action: "escalate", reason: "Required test outcome is incomplete" }
          : { action: "complete", reason: "Not a valid full evidence acknowledgment", ...(kind !== "unacknowledged" ? { verifiedGoal: kind === "malformed" ? "true" : true } : {}), evidenceIndices: kind === "wrong-indices" ? [0] : [1] }) }))
      await h.controller.tick("worker")
      await h.controller.tick("worker")
      expect(h.controller.status("worker").startsWith("paused:")).toBe(true)
      expect(calls).toBe(kind === "missing" || kind === "oversized" ? 1 : 2)
      expect(h.actions.some((a) => a.method === "synthetic" && a.input.text.startsWith("Autopilot: complete"))).toBe(false)
    }
  })
  test("fresh state changes or stop during staged verification defeat completion", async () => {
    for (const change of ["state", "stop"]) {
      const h = harness(); await h.controller.start("worker", request())
      const state = { ...snapshot(), omittedMessages: 10, messages: [{ type: "assistant", content: [{ type: "text", text: "Goal outcome" }] }] as any }
      h.state(state)
      let calls = 0
      h.generate(async () => {
        if (++calls === 1) return { text: JSON.stringify({ action: "complete", reason: "Inspect goal outcome", evidenceIndices: [0] }) }
        if (change === "state") h.state({ ...state, worker: { ...worker, time: { ...worker.time, updated: 3 } } }); else h.controller.stop("worker")
        return { text: JSON.stringify({ action: "complete", reason: "Now stale", verifiedGoal: true, evidenceIndices: [0] }) }
      })
      await h.controller.tick("worker")
      expect(h.controller.status("worker").startsWith("complete")).toBe(false)
      expect(h.actions.filter((a) => a.method === "generate")).toHaveLength(2)
    }
  })
  test("both staged reviews consume the common budget and never admit a twenty-fifth call", async () => {
    for (const admitted of [22, 23]) {
      const h = harness(); await h.controller.start("worker", request())
      h.registry.get("worker")!.calls = admitted
      h.state({ ...snapshot(), omittedMessages: 1, messages: [{ type: "assistant", content: [{ type: "text", text: "Full goal outcome" }] }] as any })
      let calls = 0
      h.generate(async () => ({ text: JSON.stringify({ action: "complete", reason: "Goal verified", evidenceIndices: [0], ...(++calls === 2 ? { verifiedGoal: true } : {}) }) }))
      await h.controller.tick("worker")
      expect(h.registry.get("worker")!.calls).toBe(24)
      expect(calls).toBe(admitted === 22 ? 2 : 1)
      expect(h.controller.status("worker")).toContain(admitted === 22 ? "complete;" : "budget exhausted")
    }
  })
})

describe("plugin commands leave worker behavior unchanged", () => {
  test("registers no worker tool/permission hooks; status/stop do not wake worker", async () => {
    let command: any, disposed = 0
    let emit!: (event: unknown) => void, consumed!: () => void
    const event = new Promise((resolve) => { emit = resolve }), handled = new Promise<void>((resolve) => { consumed = resolve })
    const hooks = new Map<string, (event: any) => void>(), synthetic: any[] = []
    const reg = () => ({ dispose: async () => { disposed++ } })
    const ctx = {
      location: { directory }, rpc: { register: async () => reg() },
      session: { hook: async (kind: string, callback: (event: any) => void) => { hooks.set(kind, callback); return reg() }, synthetic: async (input: unknown) => { synthetic.push(input) } },
      tool: { hook: () => { throw new Error("Worker tool hooks are forbidden") } },
      permission: { hook: () => { throw new Error("Worker permission hooks are forbidden") } },
      command: { transform: async (callback: any) => { callback({ add: (value: unknown) => { command = value } }); return reg() } }, event: { subscribe: async function* () { yield await event; consumed() } },
    } as unknown as Plugin.Context
    const cleanup = await setupAutopilot(ctx)
    const registry = Reflect.get(globalThis, Symbol.for("rfhold.autopilot.sessions")) as Registry
    const h = harness(registry)
    await h.controller.start("worker", request())
    const tools: Record<string, object> = { read: {}, shell: {}, execute: {}, browser: {}, mcpMutation: {}, subagent: {} }
    const options = { maxTokens: 8000 }
    for (const kind of ["context", "generate"]) {
      const event = { sessionID: "worker", agent: "build", tools, options }
      hooks.get(kind)!(event)
      expect(event.tools).toBe(tools); expect(event.options).toBe(options)
      const supervisor = { sessionID: "supervisor", agent: "autopilot", tools, options: { maxTokens: 8000 } }
      hooks.get(kind)!(supervisor)
      expect(supervisor.tools).toEqual({}); expect(supervisor.options.maxTokens).toBe(1000)
    }
    const workerRetry = { agent: "build", decision: { retry: true } }
    hooks.get("retry")!(workerRetry); expect(workerRetry.decision.retry).toBe(true)
    const supervisorRetry = { agent: "autopilot", decision: { retry: true } }
    hooks.get("retry")!(supervisorRetry); expect(supervisorRetry.decision.retry).toBe(false)
    emit({ type: "permission.replied", data: { sessionID: "worker", requestID: "permission", reply: "reject" } })
    await handled
    expect(h.controller.status("worker")).toContain("human rejected permission")
    await command.execute({ sessionID: "worker", prompt: { text: "status" } })
    await command.execute({ sessionID: "worker", prompt: { text: "stop" } })
    expect(synthetic.every((item) => item.resume === false)).toBe(true)
    await cleanup(); expect(disposed).toBe(5)
    await h.controller.close()
    await expect(command.execute({ sessionID: "worker", prompt: { text: "status" } })).rejects.toThrow("unloaded")
  })
})
