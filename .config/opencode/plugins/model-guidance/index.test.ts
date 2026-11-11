import { expect, test } from "bun:test"
import type { SessionContext } from "@opencode/plugin/promise/session"
import plugin from "./index"

async function hook() {
  const hooks = new Map<string, (event: SessionContext) => void>()
  await plugin.setup({
    session: {
      hook: async (name: string, callback: (event: SessionContext) => void) => {
        hooks.set(name, callback)
        return { dispose: async () => {} }
      },
    },
  } as never)
  expect([...hooks.keys()]).toEqual(["context"])
  return hooks.get("context")!
}

function event(providerID: string): SessionContext {
  return {
    sessionID: "ses_test",
    agent: "build",
    model: { providerID, id: "current-model" },
    system: [{ type: "text", text: "Existing instructions", metadata: { custom: true } }],
    messages: [],
    tools: { subagent: { description: "Explicit model requests only", input: {} } },
    options: { temperature: 0.2 },
  } as unknown as SessionContext
}

test("selects the current request provider, including switches in one session", async () => {
  const apply = await hook()
  for (const provider of ["openai", "anthropic", "openai"]) {
    const request = event(provider)
    const before = structuredClone(request)
    const system = request.system
    apply(request)
    expect(request.system).toBe(system)
    expect(request.system).toHaveLength(2)
    expect(request.system[0]).toEqual(before.system[0])
    expect({ ...request, system: before.system }).toEqual(before)
    const added = request.system[1]!
    expect(added.type).toBe("text")
    if (added.type !== "text") throw new Error("Expected text")
    expect(added.text).toContain("Default: omit the subagent model parameter")
    expect(added.text).toContain("broad permission to choose models is insufficient")
    expect(added.text).toContain(provider === "openai" ? "openai/gpt-6.1-terra" : "anthropic/claude-sonnet-5-5")
    expect(added.text).not.toContain(provider === "openai" ? "anthropic/" : "openai/")
    apply(request)
    expect(request.system).toHaveLength(2)
  }
})

test("unsupported providers receive no guidance or other changes", async () => {
  const apply = await hook()
  for (const provider of ["homelab", "bifrost", "OpenAI", "toString", "__proto__", ""]) {
    const request = event(provider)
    const before = structuredClone(request)
    apply(request)
    expect(request).toEqual(before)
  }
})

test("adds guidance to every fresh context without session-wide suppression", async () => {
  const apply = await hook()
  const first = event("anthropic")
  const next = event("anthropic")
  apply(first)
  apply(next)
  expect(first.system).toEqual(next.system)
  expect(next.system).toHaveLength(2)
})
