import { Plugin } from "@opencode/plugin"

export const prefixes: Record<string, string> = { anthropic: "claude/", openai: "codex/" }

export function prefixed(prefix: string, modelID: string): string {
  return modelID.startsWith(prefix) ? modelID : prefix + modelID
}

export default Plugin.define({
  id: "rfhold.gateway-prefix",
  async setup(ctx) {
    await ctx.model.transform((editor) => {
      for (const [providerID, prefix] of Object.entries(prefixes)) {
        for (const model of editor.list(providerID)) {
          const original = String(model.modelID)
          const modelID = prefixed(prefix, original)
          if (modelID !== original) editor.update(providerID, String(model.id), (draft) => {
            draft.modelID = modelID as unknown as typeof draft.modelID
          })
        }
      }
    })
  },
})
