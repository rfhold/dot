import { expect, mock, test } from "bun:test"

mock.module("@opencode/plugin", () => ({ Plugin: { define: (plugin: unknown) => plugin } }))
const { default: plugin } = await import("./index")

type Selection = { providerID: string; id: string; variant?: string }
type Model = { providerID: string; id: string; modelID: string; enabled: boolean; variants: { id: string }[] }

function family(providerID = "openai", base = "gpt-6.1-sol"): Model[] {
  return ["", "-fast", "-ultrafast"].map((suffix) => ({
    providerID, id: base + suffix, modelID: base, enabled: true, variants: [{ id: "high" }],
  }))
}

async function harness(models = family(), selection: Selection | undefined = { providerID: "openai", id: "gpt-6.1-sol" }) {
  let selected = selection
  let command: { execute(input: unknown): Promise<void> } | undefined
  const switchModel = mock(async ({ model }: { model: Selection }) => { selected = model })
  const synthetic = mock(async (_input: { sessionID: string; resume: boolean; text: string }) => ({}))
  const get = mock(async (): Promise<{ model: Selection | undefined; location: { directory: string } }> =>
    ({ model: selected, location: { directory: "/session/worktree" } }))
  const list = mock(async () => ({ data: models }))
  expect(plugin.id).toBe("rfhold.fast-mode")
  await plugin.setup({
    command: { transform: async (edit: (editor: unknown) => void) => {
      edit({ add: (definition: typeof command) => { command = definition } })
      return { dispose: async () => {} }
    } },
    model: { list },
    session: { get, switchModel, synthetic },
  } as never)
  return {
    switchModel, synthetic, get, list,
    selected: () => selected,
    run: async (text = "", attachments = {}) => {
      await command!.execute({ sessionID: "session-current", prompt: { text, ...attachments }, delivery: "steer" })
      for (const [input] of synthetic.mock.calls) {
        expect(input.sessionID).toBe("session-current")
        expect(input.resume).toBe(false)
      }
      return synthetic.mock.calls.at(-1)?.[0].text ?? ""
    },
  }
}

for (const [provider, base] of [["openai", "gpt-6.1-sol"], ["anthropic", "claude-opus-5-5"]] as const) {
  for (const suffix of ["", "-fast", "-ultrafast"]) {
    test(`${provider}${suffix}: fastest sibling and repeated selection are idempotent`, async () => {
      const h = await harness(family(provider, base), { providerID: provider, id: base + suffix, variant: "high" })
      await h.run()
      expect(h.selected()).toEqual({ providerID: provider, id: base + "-ultrafast", variant: "high" })
      await h.run()
      expect(h.switchModel).toHaveBeenCalledTimes(suffix === "-ultrafast" ? 0 : 1)
      expect(h.list).toHaveBeenCalledWith({ location: { directory: "/session/worktree" } })
      for (const [input] of h.switchModel.mock.calls) expect(input).toMatchObject({ sessionID: "session-current" })
    })
  }
  test(`${provider}: exact modes and off from a speed model`, async () => {
    const h = await harness(family(provider, base), { providerID: provider, id: base })
    await h.run("fast")
    expect(h.selected()?.id).toBe(base + "-fast")
    await h.run("ultrafast")
    expect(h.selected()?.id).toBe(base + "-ultrafast")
    await h.run("off")
    expect(h.selected()?.id).toBe(base)
    await h.run("off")
    expect(h.switchModel).toHaveBeenCalledTimes(3)
  })
}

test("status reports modes and never switches, even with an unsupported variant", async () => {
  const h = await harness(family(), { providerID: "openai", id: "gpt-6.1-sol-fast", variant: "unknown" })
  expect(await h.run("status")).toContain("Fast mode: fast")
  expect(await h.run("status")).toContain("Supported modes: off, fast, ultrafast")
  expect(h.switchModel).not.toHaveBeenCalled()
})

test("fastest falls back to fast but explicit ultrafast never falls back", async () => {
  const h = await harness(family().slice(0, 2))
  expect(await h.run("ultrafast")).toContain("ultrafast is unavailable")
  expect(h.switchModel).not.toHaveBeenCalled()
  await h.run()
  expect(h.selected()?.id).toBe("gpt-6.1-sol-fast")
})

test("explicit fast never falls forward to ultrafast", async () => {
  const h = await harness(family().filter((model) => !model.id.endsWith("-fast")))
  expect(await h.run("fast")).toContain("fast is unavailable")
  expect(h.switchModel).not.toHaveBeenCalled()
})

test("no speed siblings leaves the model and variant unchanged", async () => {
  const h = await harness(family().slice(0, 1))
  expect(await h.run()).toContain("no fast or ultrafast sibling")
  expect(h.switchModel).not.toHaveBeenCalled()
})

test("disabled speeds are unavailable and do not beat an enabled fast sibling", async () => {
  const models = family()
  models[2]!.enabled = false
  const h = await harness(models)
  await h.run()
  expect(h.selected()?.id).toBe("gpt-6.1-sol-fast")
})

test("same upstream model alone cannot match unrelated catalog families or providers", async () => {
  const models = [family()[0]!, ...family("openai", "other"), ...family("anthropic")]
  for (const model of models) model.modelID = "gpt-6.1-sol"
  const h = await harness(models)
  expect(await h.run()).toContain("no fast or ultrafast sibling")
  expect(h.switchModel).not.toHaveBeenCalled()
})

test("exact sibling ID with another upstream model is unsupported", async () => {
  const models = family()
  models[1]!.modelID = "another-model"
  models[2]!.modelID = "another-model"
  const h = await harness(models)
  await h.run()
  expect(h.switchModel).not.toHaveBeenCalled()
})

test("provider-specific prefixes normalize for upstream equality", async () => {
  for (const [provider, prefix] of [["openai", "codex/"], ["anthropic", "claude/"]]) {
    const models = family(provider!)
    models[0]!.modelID = prefix + models[0]!.modelID
    const h = await harness(models, { providerID: provider!, id: "gpt-6.1-sol" })
    await h.run()
    expect(h.selected()?.id).toBe("gpt-6.1-sol-ultrafast")
  }
})

test("unsupported reasoning variant clears on switch with an explanation", async () => {
  const h = await harness(family(), { providerID: "openai", id: "gpt-6.1-sol", variant: "xhigh" })
  expect(await h.run("fast")).toContain("Reasoning variant xhigh cleared")
  expect(h.selected()).toEqual({ providerID: "openai", id: "gpt-6.1-sol-fast" })
})

test("off does not guess a base when the standard sibling is absent", async () => {
  const h = await harness(family().slice(1), { providerID: "openai", id: "gpt-6.1-sol-fast" })
  expect(await h.run("off")).toContain("off is unavailable")
  expect(h.switchModel).not.toHaveBeenCalled()
})

test("absent selection, unavailable model, and unsupported providers never switch", async () => {
  const absent = await harness()
  // Remove the selection through the mock, not through a runtime API.
  absent.get.mockImplementation(async () => ({ model: undefined, location: { directory: "/session/worktree" } }))
  expect(await absent.run()).toContain("no selected model")
  expect(absent.list).not.toHaveBeenCalled()
  for (const selected of [
    { providerID: "openai", id: "unavailable" },
    { providerID: "homelab", id: "gpt-6.1-sol" },
    { providerID: "openai-custom", id: "gpt-6.1-sol" },
  ]) {
    const h = await harness(family(), selected)
    expect(await h.run()).toContain("unchanged")
    expect(h.switchModel).not.toHaveBeenCalled()
  }
})

test("unknown arguments and all attachment kinds reject before reads or mutations", async () => {
  for (const text of ["on", "FAST", "fast off", "status extra", "--fast"]) {
    const h = await harness()
    await expect(h.run(text)).rejects.toThrow("Usage:")
    expect(h.get).not.toHaveBeenCalled()
    expect(h.switchModel).not.toHaveBeenCalled()
    expect(h.synthetic).not.toHaveBeenCalled()
  }
  for (const key of ["files", "agents", "skills"]) {
    const h = await harness()
    await expect(h.run("fast", { [key]: [{}] })).rejects.toThrow("text only")
    expect(h.get).not.toHaveBeenCalled()
    expect(h.switchModel).not.toHaveBeenCalled()
    expect(h.synthetic).not.toHaveBeenCalled()
  }
})

test("text whitespace and empty attachment arrays are valid", async () => {
  const h = await harness()
  await h.run(" \tfast\n", { files: [], agents: [], skills: [] })
  expect(h.selected()?.id).toBe("gpt-6.1-sol-fast")
})

test("switch failure emits no false success and acknowledgment failure reports the completed switch", async () => {
  const failed = await harness()
  failed.switchModel.mockImplementation(async () => { throw new Error("switch failed") })
  await expect(failed.run()).rejects.toThrow("switch failed")
  expect(failed.synthetic).not.toHaveBeenCalled()
  const ack = await harness()
  ack.synthetic.mockImplementation(async () => { throw new Error("ack failed") })
  await expect(ack.run()).rejects.toThrow("Model switched to openai/gpt-6.1-sol-ultrafast")
  expect(ack.switchModel).toHaveBeenCalledTimes(1)
})
