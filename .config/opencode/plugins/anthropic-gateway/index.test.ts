import { expect, mock, test } from "bun:test"

mock.module("@opencode/plugin", () => ({ Plugin: { define: (plugin: unknown) => plugin } }))

test("prefixes anthropic upstream model IDs once and leaves other providers alone", async () => {
  const plugin = (await import("./index")).default
  const models = [
    { providerID: "anthropic", id: "claude-fable-5-2", modelID: "claude-fable-5-2" },
    { providerID: "anthropic", id: "claude-opus-5-5-fast", modelID: "claude-opus-5-5" },
    { providerID: "anthropic", id: "claude-sonnet-5-5", modelID: "claude/claude-sonnet-5-5" },
    { providerID: "claude", id: "fable-5.2", modelID: "claude/claude-fable-5-2" },
  ]
  let transform: ((editor: unknown) => void) | undefined
  await plugin.setup({ model: { transform: async (callback: typeof transform) => { transform = callback } } } as never)
  const editor = {
    list: (providerID: string) => models.filter((model) => model.providerID === providerID),
    update: (providerID: string, id: string, update: (draft: { modelID: string }) => void) => {
      const model = models.find((model) => model.providerID === providerID && model.id === id)
      if (model) update(model)
    },
  }
  transform!(editor)
  transform!(editor)
  expect(plugin.id).toBe("rfhold.anthropic-gateway")
  expect(models.map((model) => model.modelID)).toEqual([
    "claude/claude-fable-5-2",
    "claude/claude-opus-5-5",
    "claude/claude-sonnet-5-5",
    "claude/claude-fable-5-2",
  ])
})
