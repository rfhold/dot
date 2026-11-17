import { Plugin } from "@opencode/plugin"

const prefixes: Record<string, string> = { anthropic: "claude/", openai: "codex/" }

type Context = {
  model: Pick<Plugin.Context["model"], "list">
  command: Pick<Plugin.Context["command"], "transform">
  session: Pick<Plugin.Context["session"], "get" | "switchModel" | "synthetic">
}

function speed(id: string) {
  return id.endsWith("-ultrafast") ? "ultrafast" : id.endsWith("-fast") ? "fast" : "off"
}

export async function setupFast(ctx: Context) {
  return ctx.command.transform((editor) => {
    editor.add({
      name: "fast",
      description: "Select this session's fastest available sibling; accepts fast, ultrafast, off, or status. No agent turn.",
      execute: async ({ sessionID, prompt }) => {
        if (prompt.files?.length || prompt.agents?.length || prompt.skills?.length) {
          throw new Error("/fast accepts text only; no files, agents, or skills.")
        }
        const request = prompt.text.trim()
        if (!["", "fast", "ultrafast", "off", "status"].includes(request)) {
          throw new Error("Usage: /fast [fast|ultrafast|off|status]")
        }
        const reply = async (text: string) => {
          await ctx.session.synthetic({ sessionID, resume: false, text })
        }
        const session = await ctx.session.get({ sessionID })
        const selected = session.model
        if (!selected) {
          await reply("Fast mode unchanged: this session has no selected model. Supported modes: none.")
          return
        }
        const { providerID, id } = selected
        if (providerID !== "openai" && providerID !== "anthropic") {
          await reply(`Fast mode unchanged: ${providerID}/${id} is outside the built-in openai and anthropic providers. Supported modes: none.`)
          return
        }
        const catalog = await ctx.model.list({ location: { directory: session.location.directory } })
        const models = catalog.data.filter((model) => model.enabled && model.providerID === providerID)
        const current = models.find((model) => model.id === id)
        if (!current) {
          await reply(`Fast mode unchanged: ${providerID}/${id} is unavailable in this session's catalog. Supported modes: none.`)
          return
        }
        const prefix = prefixes[providerID]!
        const upstream = (modelID: string) => modelID.startsWith(prefix) ? modelID.slice(prefix.length) : modelID
        const base = id.replace(/-(ultrafast|fast)$/, "")
        const modes = ["off", "fast", "ultrafast"] as const
        const siblings = modes.map((mode) => ({
          mode,
          model: models.find((model) =>
            model.id === (mode === "off" ? base : `${base}-${mode}`)
            && upstream(model.modelID) === upstream(current.modelID)),
        }))
        const supported = siblings.filter((sibling) => sibling.model).map((sibling) => sibling.mode).join(", ") || "none"
        const status = `Fast mode: ${speed(id)} (${providerID}/${id}). Supported modes: ${supported}.`
        if (request === "status") {
          await reply(status)
          return
        }
        const mode = request || (siblings.find((sibling) => sibling.mode === "ultrafast")?.model ? "ultrafast" : "fast")
        const target = siblings.find((sibling) => sibling.mode === mode)?.model
        if (!target) {
          await reply(`Fast mode unchanged: ${request ? `${mode} is unavailable` : "no fast or ultrafast sibling is available"}. ${status}`)
          return
        }
        if (target.id === id) {
          await reply(`Fast mode unchanged: already ${mode}. ${status}`)
          return
        }
        const variant = selected.variant && target.variants.some((variant) => variant.id === selected.variant)
          ? selected.variant : undefined
        await ctx.session.switchModel({
          sessionID,
          model: { providerID, id: target.id, ...(variant ? { variant } : {}) },
        })
        const variantNotice = selected.variant
          ? variant ? ` Reasoning variant ${variant} preserved.` : ` Reasoning variant ${selected.variant} cleared: target does not support it.`
          : ""
        try {
          await reply(`Fast mode set to ${mode}: ${providerID}/${target.id}.${variantNotice}`)
        } catch {
          throw new Error(`Model switched to ${providerID}/${target.id}, but the acknowledgment failed. Use /fast status to inspect it.`)
        }
      },
    })
  })
}

export default Plugin.define({
  id: "rfhold.fast-mode",
  async setup(ctx) {
    await setupFast(ctx)
  },
})
