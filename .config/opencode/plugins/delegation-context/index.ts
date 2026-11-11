import { randomBytes } from "node:crypto"
import { Plugin } from "@opencode/plugin/effect"
import type { Context } from "@opencode/plugin/effect/plugin"
import type { Duration } from "effect"
import { Cause, Context as EffectContext, Deferred, Effect, Exit, Fiber, Schema, Scope } from "effect"
import { appendContext, checkPrompt, idPattern, metadataKey, notice, parseCheck, prefix, readObservation } from "./protocol"
import type { Observation } from "./protocol"

type Input = { prompt: string; sessionID?: string; [key: string]: unknown }
class ToolError extends Schema.TaggedError<ToolError>()("Tool.Error", { message: Schema.String }) {}
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const callKey = (e: { sessionID: string; messageID: string; id: string }) => JSON.stringify([e.sessionID, e.messageID, e.id])

export function setup(ctx: Context, timeout: Duration.Input = "60 seconds") {
  return Effect.gen(function* () {
    const scope = yield* Scope.Scope
    const calls = new Map<string, Observation>()
    const checks = new Map<string, Deferred.Deferred<void>>()
    // Memory-only diagnostics survive storage failures, never containing prompt text or raw errors.
    let storageFailures = 0
    let closed = false
    yield* Effect.addFinalizer(() => Effect.sync(() => {
      closed = true
      calls.clear()
      checks.clear()
    }))
    const warn = (id: string, category: string) => Effect.logWarning("Delegation context check did not pass; original brief retained", { id, category })
    const save = (r: Observation) => ctx.storage.set(prefix + r.id, { ...r }).pipe(
      Effect.catchCause(cause => Effect.gen(function* () {
        if (Cause.hasInterrupts(cause)) return yield* Effect.interrupt
        storageFailures++
        yield* Effect.logWarning("Delegation context evidence storage failed; evidence may be missing or stale", { id: r.id })
        return yield* Effect.fail("storage-error")
      })),
    )
    yield* ctx.command.transform(editor => editor.add({
      name: "delegation-context", description: "on/off/status: transient delegation context checks (default off).",
      execute: ({ sessionID, prompt }) => Effect.gen(function* () {
        if (closed) return yield* Effect.fail(new Error("Delegation context plugin is unloaded."))
        const action = prompt.text.trim() || "status"
        if (prompt.files?.length || prompt.agents?.length || prompt.skills?.length || !["on", "off", "status"].includes(action)) return yield* Effect.fail(new Error("Use /delegation-context on, off, or status; text only."))
        const session = yield* ctx.session.get({ sessionID })
        if (closed) return yield* Effect.interrupt
        let enabled = session.metadata?.[metadataKey] === true
        if (action !== "status") {
          enabled = action === "on"
          yield* ctx.session.update({ sessionID, metadata: { ...session.metadata, [metadataKey]: enabled } })
        }
        if (closed) return yield* Effect.interrupt
        yield* ctx.session.synthetic({ sessionID, resume: false, text: `Delegation context: ${enabled ? "on" : "off"}. New children inherit a snapshot; existing children are unchanged. Evidence storage failures since plugin load: ${storageFailures}. ${notice}` })
      }),
    }))

    // An Effect-local marker scopes the generate hook even when other callers generate concurrently.
    const marker = EffectContext.Reference<Observation | null>("rfhold.delegation-context/check", { defaultValue: () => null })
    yield* ctx.session.hook("generate", event => Effect.gen(function* () {
      const observation = yield* marker
      if (observation === null) return
      observation.parentModel = { ...event.model }
      // Native transient generation has no tool execution loop; retain the parent's schema prefix.
      event.options.maxTokens = 4096
    }))

    yield* ctx.tool.hook("execute.before", event => Effect.gen(function* () {
      if (event.tool !== "subagent" || !object(event.input) || typeof event.input.prompt !== "string") return
      if (closed) return yield* Effect.interrupt
      const key = callKey(event)
      const input = event.input as Input
      // A repeated hook invocation for this exact call must not append twice or regenerate.
      const reuse = (prior: Observation) => Effect.gen(function* () {
        yield* Deferred.await(checks.get(key)!)
        if (prior.check === "supplement" && prior.supplement !== null) event.input = { ...input, prompt: appendContext(prior.original, prior.supplement) }
      })
      const prior = calls.get(key)
      if (prior) return yield* reuse(prior)
      const session = yield* ctx.session.get({ sessionID: event.sessionID }).pipe(Effect.catchCause(cause => Cause.hasInterrupts(cause) ? Effect.interrupt : Effect.logWarning("Delegation context enabled-state lookup failed; original brief retained", { parentID: event.sessionID }).pipe(Effect.as(null))))
      if (closed) return yield* Effect.interrupt
      if (!session || session.metadata?.[metadataKey] !== true) return
      const concurrent = calls.get(key)
      if (concurrent) return yield* reuse(concurrent)
      const r: Observation = {
        version: 1, id: `dc_${randomBytes(12).toString("hex")}`, parentID: event.sessionID,
        childID: null, requestedChildID: typeof input.sessionID === "string" ? input.sessionID : null,
        messageID: event.messageID, callID: event.id, createdAt: Date.now(), updatedAt: Date.now(),
        parentModel: session.model ? { ...session.model } : null, original: input.prompt, supplement: null,
        check: "checking", outcome: "not-dispatched", error: null,
      }
      calls.set(key, r)
      const done = Deferred.makeUnsafe<void>()
      checks.set(key, done)
      let failure = "storage-error"
      const check = Effect.gen(function* () {
        yield* save(r)
        failure = "generation-error-or-timeout"
        const generated = yield* ctx.session.generate({ sessionID: event.sessionID, prompt: checkPrompt(r.original) }).pipe(
          Effect.provideService(marker, r),
          Effect.timeout(timeout),
          Effect.mapError(() => "generation-error-or-timeout"),
        )
        failure = "validation-error"
        const supplement = yield* Effect.try({ try: () => parseCheck(generated.text), catch: () => "validation-error" })
        r.supplement = supplement
        r.check = supplement === null ? "no-supplement" : "supplement"
        r.updatedAt = Date.now()
        r.outcome = "dispatch-pending"
        failure = "storage-error"
        yield* save(r)
        if (closed) return yield* Effect.interrupt
        if (supplement !== null) event.input = { ...input, prompt: appendContext(r.original, supplement) }
      }).pipe(
        Effect.catchCause(cause => {
          if (Cause.hasInterrupts(cause)) return Effect.interrupt
          r.check = "failed"
          r.outcome = "original-dispatch-pending"
          r.error = failure
          r.updatedAt = Date.now()
          return Effect.gen(function* () {
            event.input = input
            yield* warn(r.id, r.error!)
            yield* save(r).pipe(Effect.catch(() => Effect.void))
          })
        }),
        Effect.onInterrupt(() => Effect.gen(function* () {
          r.check = "cancelled"
          r.outcome = "cancelled-before-dispatch"
          r.updatedAt = Date.now()
          yield* save(r).pipe(Effect.catch(() => Effect.void))
        })),
        Effect.onExit(exit => Effect.gen(function* () {
          yield* Deferred.done(done, exit)
          if (Exit.isFailure(exit)) {
            calls.delete(key)
            checks.delete(key)
          }
        })),
      )
      // Plugin unload and parent stop both interrupt the underlying generation, not merely its waiter.
      const fiber = yield* check.pipe(Effect.forkIn(scope))
      yield* Fiber.join(fiber).pipe(Effect.onInterrupt(() => Fiber.interrupt(fiber).pipe(Effect.asVoid)))
    }))

    yield* ctx.tool.hook("execute.after", event => Effect.gen(function* () {
      if (event.tool !== "subagent") return
      const r = calls.get(callKey(event))
      if (!r) return
      r.updatedAt = Date.now()
      if (event.status === "error") {
        r.outcome = "tool-error-child-unknown"
        r.error = r.error ? r.error + ";native-subagent-error" : "native-subagent-error"
      } else {
        const output = event.result.output
        const metadata = event.result.metadata
        const a = object(output) && typeof output.sessionID === "string" ? output.sessionID : null
        const b = object(metadata) && typeof metadata.sessionID === "string" ? metadata.sessionID : null
        if (a && b && a !== b) {
          r.outcome = "correlation-error-child-unknown"
          r.error = "child-id-mismatch"
        } else {
          r.childID = a ?? b
          r.outcome = object(output) && output.status === "running" ? "dispatched-running-completion-unknown" : object(output) && output.status === "completed" ? "foreground-completed" : "dispatch-outcome-unknown"
        }
      }
      yield* save(r).pipe(Effect.catch(() => Effect.void))
      calls.delete(callKey(event))
      checks.delete(callKey(event))
    }))

    yield* ctx.tool.transform(editor => {
      editor.add({
        name: "delegation_context_list", description: "Read local delegation observations, paginated by reference; no prompt bodies.",
        input: Schema.Struct({ after: Schema.optionalKey(Schema.String), limit: Schema.optionalKey(Schema.Number) }),
        execute: ({ after, limit = 10 }) => Effect.gen(function* () {
          if (closed) return yield* Effect.fail(new ToolError({ message: "Delegation context plugin is unloaded." }))
          if ((after !== undefined && !idPattern.test(after)) || !Number.isInteger(limit) || limit < 1 || limit > 20) return yield* Effect.fail(new ToolError({ message: "Invalid cursor or limit (1..20)." }))
          const page = yield* ctx.storage.scan({ prefix, ...(after ? { after: prefix + after } : {}), limit })
          const entries = page.entries.map(entry => {
            try {
              const { original, supplement, ...summary } = readObservation(entry.value)
              if (prefix + summary.id !== entry.key) throw new Error("Invalid record key")
              return { ...summary, originalChars: original.length, supplementChars: supplement?.length ?? 0 }
            } catch { return { id: entry.key.slice(prefix.length), error: "corrupt-record" } }
          })
          return { content: JSON.stringify({ entries, next: page.next?.slice(prefix.length) ?? null, storageFailures, notice }) }
        }),
      })
      editor.add({
        name: "delegation_context_get", description: "Read one observation with bounded original/supplement excerpts; paginate each with offset.",
        input: Schema.Struct({ id: Schema.String, offset: Schema.optionalKey(Schema.Number), limit: Schema.optionalKey(Schema.Number) }),
        execute: ({ id, offset = 0, limit = 4000 }) => Effect.gen(function* () {
          if (closed) return yield* Effect.fail(new ToolError({ message: "Delegation context plugin is unloaded." }))
          if (!idPattern.test(id) || !Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 8000) return yield* Effect.fail(new ToolError({ message: "Invalid id, offset, or limit (1..8000)." }))
          const value = yield* ctx.storage.get(prefix + id)
          const r = yield* Effect.try({ try: () => readObservation(value), catch: () => new ToolError({ message: "Observation absent or corrupt." }) })
          if (r.id !== id) return yield* Effect.fail(new ToolError({ message: "Observation reference mismatch." }))
          const excerpt = (s: string) => ({ text: s.slice(offset, offset + limit), totalChars: s.length, nextOffset: offset + limit < s.length ? offset + limit : null })
          return { content: JSON.stringify({ ...r, original: excerpt(r.original), supplement: r.supplement === null ? null : excerpt(r.supplement), storageFailures, notice }) }
        }),
      })
    })
  })
}

export default Plugin.define({ id: "rfhold.delegation-context", effect: ctx => setup(ctx) })
