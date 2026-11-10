import { randomUUID } from "node:crypto"
import { Plugin, Rpc } from "@opencode/plugin"
import { makeBridge } from "./bridge"
import { createController, type Dependencies, type Registry } from "./controller"
import { parseRequest } from "./policy"

const key = Symbol.for("rfhold.autopilot.sessions")
const shared = globalThis as typeof globalThis & { [key]?: Registry }
const registry = shared[key] ??= new Map()
const identity = Rpc.define({
  id: "rfhold.autopilot",
  methods: { identity: { input: { type: "null" }, output: { type: "string" } } },
  events: {},
})

export async function setupAutopilot(ctx: Plugin.Context, dependencies?: Dependencies) {
  const nonce = randomUUID()
  const controller = createController(ctx.location.directory, registry, dependencies ?? {
    bridge: (signal) => makeBridge(ctx.location.directory, nonce, undefined, undefined, undefined, signal), now: Date.now,
  })
  const abort = new AbortController()
  let closed = false
  const registrations: { dispose: () => Promise<void> }[] = []
  const review = () => { for (const worker of controller.workers()) void controller.tick(worker) }
  let timer: ReturnType<typeof setInterval> | undefined
  try {
    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: abort.signal })) {
          if (closed) break
          if (event.type === "session.created" && event.data.metadata?.autopilotSupervisor) continue
          if (event.type === "permission.replied" && event.data.reply === "reject") controller.reject(event.data.sessionID)
          if (event.type.startsWith("session.") || event.type.startsWith("form.") || event.type.startsWith("shell.") || event.type.startsWith("permission.")) review()
        }
      } catch { /* Active reviews retain polling. */ }
    })()
    registrations.push(await ctx.rpc.register(identity, { identity: async () => nonce }))
    for (const kind of ["generate", "context"] as const) {
      registrations.push(await ctx.session.hook(kind, (event) => {
        if (event.agent === "autopilot") {
          event.tools = {}
          event.options.maxTokens = 1000
        }
      }))
    }
    registrations.push(await ctx.session.hook("retry", (event) => {
      if (event.agent === "autopilot") event.decision = { retry: false }
    }))
    registrations.push(await ctx.command.transform((editor) => {
      editor.add({
        name: "autopilot", description: "Start silent supervision, or show status / stop without waking the worker.",
        execute: async ({ sessionID, prompt }) => {
          if (closed) throw new Error("Autopilot is unloaded.")
          const text = prompt.text.trim()
          if (text === "status" || text === "stop") {
            const result = text === "stop" ? controller.stop(sessionID) : controller.status(sessionID)
            await ctx.session.synthetic({ sessionID, text: `Autopilot: ${result}`, resume: false })
            return
          }
          if (prompt.files?.length || prompt.agents?.length || prompt.skills?.length) throw new Error("Autopilot accepts text only; state your goal and limits in the command.")
          await controller.start(sessionID, parseRequest(text))
        },
      })
    }))
    timer = setInterval(review, 15_000)
  } catch (error) {
    closed = true
    abort.abort()
    await controller.close()
    await Promise.allSettled(registrations.map((registration) => registration.dispose()))
    throw error
  }
  return async () => {
    closed = true
    if (timer) clearInterval(timer)
    abort.abort()
    await controller.close()
    await Promise.allSettled(registrations.map((registration) => registration.dispose()))
  }
}

export default Plugin.define({ id: "rfhold.autopilot", setup: setupAutopilot })
