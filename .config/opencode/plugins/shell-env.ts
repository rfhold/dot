import { Plugin } from "@opencode/plugin"

export default Plugin.define({
  id: "rfhold.shell-env",
  async setup(ctx) {
    await ctx.shell.hook("create.before", (event) => {
      event.env.GIT_EDITOR = "true"
    })
  },
})
