import { Plugin } from "@opencode/plugin"

const maxSeconds = 2_147_483_647 / 1000
type Context = {
  tool: Pick<Plugin.Context["tool"], "transform">
  session: Pick<Plugin.Context["session"], "prompt">
}
type SessionID = Parameters<Context["session"]["prompt"]>[0]["sessionID"]
type Schedule = (callback: () => void, milliseconds: number) => () => void
type Interval = { owner: object; cancel: () => void; pending: boolean }

// Global plugins can have distinct instances for different locations.
const registryKey = Symbol.for("rfhold.reminders.intervals")
const shared = globalThis as typeof globalThis & { [registryKey]?: Map<SessionID, Interval> }
const intervals = shared[registryKey] ??= new Map<SessionID, Interval>()

const scheduleInterval: Schedule = (callback, milliseconds) => {
  const timer = setInterval(callback, milliseconds)
  return () => clearInterval(timer)
}

export async function setupReminders(ctx: Context, schedule: Schedule = scheduleInterval) {
  const owner = {}
  let closed = false

  function unset(sessionID: SessionID) {
    intervals.get(sessionID)?.cancel()
    intervals.delete(sessionID)
  }

  await ctx.tool.transform((editor) => {
    editor.add({
      name: "set_reminder",
      description: "Send a recurring user reminder to this session. Replaces its interval and can wake idle sessions and spend tokens.",
      input: {
        type: "object",
        properties: {
          seconds: { type: "number", minimum: 0.001, maximum: maxSeconds },
          message: { type: "string", minLength: 1, pattern: "\\S" },
        },
        required: ["seconds", "message"],
        additionalProperties: false,
      },
      execute: async (input, context) => {
        if (closed) throw new Error("Reminder plugin is unloaded.")
        if (!input || typeof input !== "object" || Array.isArray(input)) {
          throw new Error("Expected seconds and message.")
        }
        const { seconds, message } = input as Record<string, unknown>
        if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0.001 || seconds > maxSeconds) {
          throw new Error(`seconds must be finite and between 0.001 and ${maxSeconds}.`)
        }
        if (typeof message !== "string" || !message.trim()) throw new Error("message must contain nonblank text.")
        if (Object.keys(input).some((key) => key !== "seconds" && key !== "message")) {
          throw new Error("Expected only seconds and message.")
        }

        const sessionID = context.sessionID
        const text = message
        unset(sessionID)
        const interval = { owner, cancel: () => {}, pending: false }
        intervals.set(sessionID, interval)
        const current = () => !closed && intervals.get(sessionID) === interval
        async function tick() {
          if (!current() || interval.pending) return
          interval.pending = true
          try {
            await ctx.session.prompt({ sessionID, text, delivery: "steer" })
          } catch {
            if (current()) {
              unset(sessionID)
              console.warn("Reminder interval stopped after prompt admission failed.")
            }
          } finally {
            interval.pending = false
          }
        }
        interval.cancel = schedule(() => { void tick() }, seconds * 1000)
        return { content: `Reminder interval set for this session every ${seconds} seconds. First reminder follows one interval.` }
      },
    })
    editor.add({
      name: "unset_reminder",
      description: "Cancel this session's reminder interval. Other sessions are unaffected; already admitted reminders remain.",
      input: { type: "object", properties: {}, additionalProperties: false },
      execute: async (input, context) => {
        if (closed) throw new Error("Reminder plugin is unloaded.")
        if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) {
          throw new Error("Expected an empty object.")
        }
        unset(context.sessionID)
        return { content: "Reminder interval cleared for this session." }
      },
    })
  })

  return () => {
    closed = true
    for (const [sessionID, interval] of intervals) {
      if (interval.owner === owner) unset(sessionID)
    }
  }
}

export default Plugin.define({ id: "rfhold.reminders", setup: (ctx) => setupReminders(ctx) })
