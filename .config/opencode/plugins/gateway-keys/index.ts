import { Plugin } from "@opencode/plugin"
import { createHooks } from "./hooks"
import { providers } from "./keys"

export default Plugin.define({
  id: "rfhold.gateway-keys",
  async setup(ctx) {
    const hooks = createHooks(async (sessionID) => (await ctx.session.get({ sessionID })).location.directory)
    for (const providerID of providers) {
      await ctx.session.hook("http.request", hooks.http, { providerID })
      await ctx.session.hook("experimental.ws.handshake", hooks.websocket, { providerID })
    }
  },
})
