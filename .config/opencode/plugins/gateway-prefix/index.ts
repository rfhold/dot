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
          const modelID = prefixed(prefix, model.modelID)
          if (modelID !== model.modelID) editor.update(providerID, model.id, (draft) => {
            draft.modelID = modelID as typeof draft.modelID
          })
        }
      }
    })
  },
})
