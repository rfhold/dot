import { Plugin } from "@opencode/plugin"
import type { PermissionAsked, PermissionReplied } from "@opencode/client"

type Context = Pick<Plugin.Context, "tool" | "storage" | "event" | "location">
type PermissionEvent = PermissionAsked | PermissionReplied
type Evidence = {
  version: 1
  eventID: string
  type: PermissionEvent["type"]
  created: number
  sessionID: string
  requestID: string
  location?: { directory: string; workspaceID?: string }
} & (
  | { type: "permission.asked"; action: string; source?: { type: "tool"; messageID: string; id: string } }
  | { type: "permission.replied"; reply: "once" | "always" | "reject" }
)

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
const identifier = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 256

function sanitize(value: unknown): Evidence | undefined {
  if (!object(value) || value.version !== 1 || !identifier(value.eventID)
    || !identifier(value.sessionID) || !identifier(value.requestID)
    || typeof value.created !== "number" || !Number.isFinite(value.created)) return
  const base = {
    version: 1 as const, eventID: value.eventID, created: value.created,
    sessionID: value.sessionID, requestID: value.requestID,
  }
  const location = object(value.location) && typeof value.location.directory === "string"
    && value.location.directory.length > 0 && value.location.directory.length <= 16_384
    ? { location: {
      directory: value.location.directory,
      ...(identifier(value.location.workspaceID) ? { workspaceID: value.location.workspaceID } : {}),
    } } : {}
  if (value.type === "permission.replied"
    && (value.reply === "once" || value.reply === "always" || value.reply === "reject")) {
    return { ...base, ...location, type: value.type, reply: value.reply }
  }
  if (value.type !== "permission.asked" || !identifier(value.action)) return
  const source = object(value.source) && value.source.type === "tool"
    && identifier(value.source.messageID) && identifier(value.source.id)
    ? { source: { type: "tool" as const, messageID: value.source.messageID, id: value.source.id } } : {}
  return { ...base, ...location, ...source, type: value.type, action: value.action }
}

function evidence(event: PermissionEvent) {
  return sanitize({
    version: 1, eventID: event.id, type: event.type, created: event.created,
    sessionID: event.data.sessionID,
    requestID: event.type === "permission.asked" ? event.data.id : event.data.requestID,
    location: event.location,
    ...(event.type === "permission.asked"
      ? { action: event.data.action, source: event.data.source }
      : { reply: event.data.reply }),
  })
}

function listInput(input: unknown) {
  if (!object(input) || Object.keys(input).some((key) => !["after", "limit", "sessionID", "requestID"].includes(key))) {
    throw new Error("Expected permission log filters.")
  }
  for (const name of ["sessionID", "requestID"] as const) {
    if (input[name] !== undefined && !identifier(input[name])) throw new Error(`Invalid ${name}.`)
  }
  if (input.after !== undefined && (typeof input.after !== "string" || !input.after.startsWith("events/")
    || !identifier(input.after.slice(7)))) throw new Error("Invalid permission log cursor.")
  const limit = input.limit === undefined ? 50 : input.limit
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be an integer from 1 to 100.")
  }
  return {
    after: input.after as string | undefined, limit,
    sessionID: input.sessionID as string | undefined, requestID: input.requestID as string | undefined,
  }
}

export async function setupPermissionLog(ctx: Context) {
  const controller = new AbortController()
  await ctx.tool.transform((editor) => {
    editor.add({
      name: "permission_log_list",
      description: "Read one page of observed permission evidence across active locations. Key order, not chronological order. Filters can return an empty page with a next cursor. Reply observations do not identify actors or prove success.",
      input: {
        type: "object",
        properties: {
          after: { type: "string", minLength: 8, maxLength: 263, pattern: "^events/.+" },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
          sessionID: { type: "string", minLength: 1, maxLength: 256 },
          requestID: { type: "string", minLength: 1, maxLength: 256 },
        },
        additionalProperties: false,
      },
      execute: async (input) => {
        if (controller.signal.aborted) throw new Error("Permission log is unloaded.")
        const filters = listInput(input)
        const page = await ctx.storage.scan({ prefix: "events/", after: filters.after, limit: filters.limit })
        const records = page.entries.flatMap((entry) => {
          const record = sanitize(entry.value)
          if (!record || entry.key !== `events/${record.eventID}`
            || filters.sessionID !== undefined && record.sessionID !== filters.sessionID
            || filters.requestID !== undefined && record.requestID !== filters.requestID) return []
          return [record]
        })
        return { content: JSON.stringify({ records, scanned: page.entries.length, ...(page.next ? { next: page.next } : {}) }) }
      },
    })
  })
  void (async () => {
    for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
      if (controller.signal.aborted) break
      if (event.type !== "permission.asked" && event.type !== "permission.replied") continue
      if (event.location && (event.location.directory !== ctx.location.directory
        || event.location.workspaceID !== ctx.location.workspaceID)) continue
      const record = evidence(event)
      if (!record) continue
      try {
        await ctx.storage.set(`events/${record.eventID}`, record)
      } catch {
        if (!controller.signal.aborted) console.warn("Permission evidence write failed.")
      }
    }
    if (!controller.signal.aborted) console.warn("Permission evidence event stream stopped.")
  })().catch(() => {
    if (!controller.signal.aborted) console.warn("Permission evidence event stream failed.")
  })
  return () => controller.abort()
}

export default Plugin.define({ id: "rfhold.permission-log", setup: setupPermissionLog })
