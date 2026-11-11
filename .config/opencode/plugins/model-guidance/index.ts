import { Plugin } from "@opencode/plugin"
import { guidance } from "./prompts"

export default Plugin.define({
  id: "rfhold.model-guidance",
  async setup(ctx) {
    await ctx.session.hook("context", (event) => {
      const text = guidance(event.model.providerID)
      if (text && !event.system.some((part) => part.type === "text" && part.text === text)) {
        event.system.push({ type: "text", text })
      }
    })
  },
})
