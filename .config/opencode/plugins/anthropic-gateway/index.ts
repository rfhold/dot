import { Plugin } from "@opencode/plugin"

export const providerID = "anthropic"
export const prefix = "claude/"

export function prefixed(modelID: string): string {
  return modelID.startsWith(prefix) ? modelID : prefix + modelID
}

export default Plugin.define({
  id: "rfhold.anthropic-gateway",
  async setup(ctx) {
    await ctx.model.transform((editor) => {
      for (const model of editor.list(providerID)) {
        const modelID = prefixed(model.modelID)
        if (modelID !== model.modelID) editor.update(providerID, model.id, (draft) => {
          draft.modelID = modelID as typeof draft.modelID
        })
      }
    })
  },
})
