export const prefix = "anchors/"
export const idPattern = /^fb_[a-f0-9]{24}$/
export const maxNote = 1000
export const maxMessages = 32
export const maxText = 24000
export const maxMessageText = 8000
// JSON escapes use at most six characters per UTF-16 unit; 4 KiB covers fixed fields and punctuation.
export const maxEncodedRecord = 6 * (maxText + maxNote + 4096 + 2 * 256 + maxMessages * (256 + 64)) + 4096

export type Message = { id: string; type: string; text?: string; content?: readonly { type: string; text?: string }[] }
export type SnapshotMessage = { id: string; type: string; text: string; truncated: boolean }
export type Record = {
  version: 1
  id: string
  sessionID: string
  directory: string
  createdAt: number
  note: string
  anchor: { kind: "message"; messageID: string } | { kind: "start"; messageID: null }
  snapshot: { source: "active-context"; omittedMessages: number; messages: SnapshotMessage[] }
}

export function snapshot(messages: readonly Message[]): Record["snapshot"] {
  const result: SnapshotMessage[] = []
  let budget = maxText
  for (let index = messages.length - 1; index >= 0 && result.length < maxMessages; index--) {
    const message = messages[index]!
    const cap = Math.min(maxMessageText, budget)
    let text = ""
    let length = 0
    const append = (value: string) => {
      length += value.length
      text = cap ? (text + value.slice(-cap)).slice(-cap) : ""
    }
    if (message.type === "user") append(message.text ?? "")
    if (message.type === "assistant") {
      for (const part of message.content ?? []) if (part.type === "text") append(part.text ?? "")
    }
    result.unshift({ id: message.id, type: message.type, text, truncated: length > text.length })
    budget -= text.length
  }
  return { source: "active-context", omittedMessages: messages.length - result.length, messages: result }
}

function object(value: unknown): value is { [key: string]: unknown } {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function string(value: unknown, max: number, empty = false): value is string {
  return typeof value === "string" && value.length <= max && (empty || value.length > 0)
}

export function readRecord(value: unknown, expectedID: string): Record {
  const invalid = () => { throw new Error(`Feedback ${expectedID} has an unsupported or corrupt record.`) }
  if (!object(value) || JSON.stringify(value).length > maxEncodedRecord) return invalid()
  if (value.version !== 1 || value.id !== expectedID || !idPattern.test(expectedID)
    || !string(value.sessionID, 256) || !string(value.directory, 4096)
    || typeof value.createdAt !== "number" || !Number.isSafeInteger(value.createdAt) || value.createdAt < 0
    || !string(value.note, maxNote, true) || !object(value.anchor) || !object(value.snapshot)) return invalid()
  const anchor = value.anchor
  if (!(anchor.kind === "start" && anchor.messageID === null)
    && !(anchor.kind === "message" && string(anchor.messageID, 256))) return invalid()
  const saved = value.snapshot
  if (saved.source !== "active-context" || !Number.isSafeInteger(saved.omittedMessages)
    || (saved.omittedMessages as number) < 0 || !Array.isArray(saved.messages) || saved.messages.length > maxMessages) return invalid()
  let length = 0
  const seen = new Set<string>()
  for (const message of saved.messages) {
    if (!object(message) || !string(message.id, 256) || !string(message.type, 64)
      || !string(message.text, maxMessageText, true) || typeof message.truncated !== "boolean" || seen.has(message.id)) return invalid()
    seen.add(message.id)
    length += message.text.length
  }
  if (length > maxText) return invalid()
  if (anchor.kind === "start" && (saved.messages.length || saved.omittedMessages)) return invalid()
  if (anchor.kind === "message" && saved.messages.at(-1)?.id !== anchor.messageID) return invalid()
  // Return only the schema's fields; unknown persisted fields are never exposed.
  return {
    version: 1, id: expectedID, sessionID: value.sessionID, directory: value.directory,
    createdAt: value.createdAt, note: value.note, anchor: { kind: anchor.kind, messageID: anchor.messageID },
    snapshot: {
      source: "active-context", omittedMessages: saved.omittedMessages as number,
      messages: saved.messages.map((message: SnapshotMessage) => ({ id: message.id, type: message.type, text: message.text, truncated: message.truncated })),
    },
  } as Record
}

export function inputObject(input: unknown, keys: readonly string[]) {
  if (!object(input) || Object.keys(input).some((key) => !keys.includes(key))) throw new Error("Invalid feedback tool input.")
  return input
}

export function reference(value: unknown): string {
  if (typeof value !== "string" || !idPattern.test(value)) throw new Error("Expected a feedback reference: fb_ followed by 24 lowercase hex digits.")
  return value
}
