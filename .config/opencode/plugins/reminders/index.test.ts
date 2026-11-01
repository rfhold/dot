import { describe, expect, mock, spyOn, test } from "bun:test"
import type { ToolContext, ToolEditor, Info } from "@opencode/plugin/promise/tool"
import plugin, { setupReminders } from "./index"

async function fixture(prompt = mock(async (_input: unknown) => ({}))) {
  let now = 0
  const timers: { callback: () => void; milliseconds: number; next: number; active: boolean }[] = []
  const tools = new Map<string, Info>()
  const transform = async (callback: (editor: ToolEditor) => void) => {
    callback({ add: (tool: Info) => tools.set(tool.name, tool) } as unknown as ToolEditor)
    return { dispose: async () => {} }
  }
  const context = { tool: { transform }, session: { prompt } } as unknown as Parameters<typeof setupReminders>[0]
  const cleanup = await setupReminders(context, (callback, milliseconds) => {
    const timer = { callback, milliseconds, next: now + milliseconds, active: true }
    timers.push(timer)
    return () => { timer.active = false }
  })
  async function advance(milliseconds: number) {
    const target = now + milliseconds
    while (true) {
      const timer = timers.filter((timer) => timer.active && timer.next <= target).sort((a, b) => a.next - b.next)[0]
      if (!timer) break
      now = timer.next
      timer.next += timer.milliseconds
      timer.callback()
      await Promise.resolve()
      await Promise.resolve()
    }
    now = target
  }
  function call(name: string, input: unknown, sessionID = "session-a") {
    return tools.get(name)!.execute(input, { sessionID } as ToolContext)
  }
  return { tools, prompt, cleanup, timers, advance, call }
}

describe("session reminders", () => {
  test("defines a V2 plugin with exactly two tools and no automatic interval", async () => {
    const f = await fixture()
    expect(plugin.id).toBe("rfhold.reminders")
    expect([...f.tools.keys()]).toEqual(["set_reminder", "unset_reminder"])
    expect(f.timers).toHaveLength(0)
    expect(f.prompt).not.toHaveBeenCalled()
    expect(f.tools.get("set_reminder")!.input).toMatchObject({ required: ["seconds", "message"], additionalProperties: false })
  })

  test("waits a full interval, repeats, and preserves the exact message and caller ID", async () => {
    const f = await fixture()
    const message = "  Check progress.\nKeep whitespace.  "
    await f.call("set_reminder", { seconds: 2, message })
    await f.advance(1999)
    expect(f.prompt).not.toHaveBeenCalled()
    await f.advance(1)
    expect(f.prompt.mock.calls).toEqual([[{ sessionID: "session-a", text: message, delivery: "steer" }]])
    await f.advance(4000)
    expect(f.prompt).toHaveBeenCalledTimes(3)
    f.cleanup()
  })

  test("replacement resets the first tick and blocks stale callbacks", async () => {
    const f = await fixture()
    await f.call("set_reminder", { seconds: 1, message: "old" })
    await f.advance(500)
    await f.call("set_reminder", { seconds: 2, message: "new" })
    f.timers[0]!.callback()
    await f.advance(1999)
    expect(f.prompt).not.toHaveBeenCalled()
    await f.advance(1)
    expect(f.prompt.mock.calls).toEqual([[{ sessionID: "session-a", text: "new", delivery: "steer" }]])
    f.cleanup()
  })

  test("unset is idempotent and isolates sessions", async () => {
    const f = await fixture()
    await f.call("set_reminder", { seconds: 1, message: "a" })
    await f.call("set_reminder", { seconds: 2, message: "b" }, "session-b")
    await f.advance(1000)
    await f.call("unset_reminder", {})
    await f.call("unset_reminder", {})
    f.timers[0]!.callback()
    await f.advance(3000)
    expect(f.prompt.mock.calls).toEqual([
      [{ sessionID: "session-a", text: "a", delivery: "steer" }],
      [{ sessionID: "session-b", text: "b", delivery: "steer" }],
      [{ sessionID: "session-b", text: "b", delivery: "steer" }],
    ])
    f.cleanup()
  })

  test("replacement in one session leaves the other interval intact", async () => {
    const f = await fixture()
    await f.call("set_reminder", { seconds: 1, message: "a" })
    await f.call("set_reminder", { seconds: 1, message: "b" }, "session-b")
    await f.call("set_reminder", { seconds: 2, message: "a2" })
    await f.advance(2000)
    expect(f.prompt.mock.calls.map(([input]) => input)).toEqual([
      { sessionID: "session-b", text: "b", delivery: "steer" },
      { sessionID: "session-b", text: "b", delivery: "steer" },
      { sessionID: "session-a", text: "a2", delivery: "steer" },
    ])
    f.cleanup()
  })

  test("runtime validation rejects invalid arguments without changing a valid interval", async () => {
    const f = await fixture()
    await f.call("set_reminder", { seconds: 1, message: "valid" })
    const invalid = [
      null, undefined, [], "text", {},
      ...[0, -1, NaN, Infinity, -Infinity, "1", 0.0001, 2147483.648].map((seconds) => ({ seconds, message: "x" })),
      ...["", " \n\t", null, 2].map((message) => ({ seconds: 1, message })),
      { seconds: 1, message: "x", sessionID: "other" },
    ]
    for (const input of invalid) await expect(f.call("set_reminder", input)).rejects.toThrow()
    for (const input of [null, [], undefined, { sessionID: "other" }]) {
      await expect(f.call("unset_reminder", input)).rejects.toThrow()
    }
    expect(f.timers).toHaveLength(1)
    await f.advance(1000)
    expect(f.prompt).toHaveBeenCalledTimes(1)
    f.cleanup()
  })

  test("different location instances share one interval per session and isolate cleanup", async () => {
    const first = await fixture()
    const second = await fixture()
    await first.call("set_reminder", { seconds: 1, message: "old location" })
    await first.call("set_reminder", { seconds: 1, message: "other session" }, "session-b")
    await second.call("set_reminder", { seconds: 1, message: "new location" })
    expect(first.timers[0]!.active).toBe(false)
    first.timers[0]!.callback()
    first.cleanup()
    await second.advance(1000)
    expect(first.prompt).not.toHaveBeenCalled()
    expect(second.prompt).toHaveBeenCalledTimes(1)
    await expect(first.call("unset_reminder", {})).rejects.toThrow("unloaded")
    const third = await fixture()
    await third.call("unset_reminder", {})
    await second.advance(1000)
    expect(second.prompt).toHaveBeenCalledTimes(1)
    second.cleanup()
    third.cleanup()
  })

  test("accepts timer boundaries", async () => {
    const f = await fixture()
    await f.call("set_reminder", { seconds: 0.001, message: "min" })
    await f.call("set_reminder", { seconds: 2147483.647, message: "max" }, "session-b")
    expect(f.timers.map((timer) => timer.milliseconds)).toEqual([1, 2147483647])
    f.cleanup()
  })

  test("cleanup cancels all timers and rejects stale set executors", async () => {
    const f = await fixture()
    await f.call("set_reminder", { seconds: 1, message: "a" })
    await f.call("set_reminder", { seconds: 1, message: "b" }, "session-b")
    f.cleanup()
    f.cleanup()
    for (const timer of f.timers) timer.callback()
    await f.advance(10000)
    expect(f.prompt).not.toHaveBeenCalled()
    expect(f.timers.every((timer) => !timer.active)).toBe(true)
    await expect(f.call("set_reminder", { seconds: 1, message: "stale" })).rejects.toThrow("unloaded")
    await expect(f.call("unset_reminder", {})).rejects.toThrow("unloaded")
  })

  test("skips ticks during unresolved admission without overlap or a catch-up burst", async () => {
    const pending = Promise.withResolvers<object>()
    const prompt = mock((_input: unknown) => pending.promise)
    const f = await fixture(prompt)
    await f.call("set_reminder", { seconds: 1, message: "a" })
    await f.advance(5000)
    expect(prompt).toHaveBeenCalledTimes(1)
    pending.resolve({})
    await Promise.resolve()
    await f.advance(1000)
    expect(prompt).toHaveBeenCalledTimes(2)
    f.cleanup()
  })

  test("a rejected admission stops only its interval, including deletion failures", async () => {
    const warning = spyOn(console, "warn").mockImplementation(() => {})
    try {
      const prompt = mock(async (input: unknown) => {
        if ((input as { sessionID: string }).sessionID === "session-a") throw new Error("Session not found: private detail")
        return {}
      })
      const f = await fixture(prompt)
      await f.call("set_reminder", { seconds: 1, message: "a" })
      await f.call("set_reminder", { seconds: 1, message: "b" }, "session-b")
      await f.advance(3000)
      expect(prompt).toHaveBeenCalledTimes(4)
      expect(f.timers.map((timer) => timer.active)).toEqual([false, true])
      expect(warning.mock.calls).toEqual([["Reminder interval stopped after prompt admission failed."]])
      f.cleanup()
    } finally {
      warning.mockRestore()
    }
  })

  test("synchronous admission errors do not escape timer callbacks", async () => {
    const warning = spyOn(console, "warn").mockImplementation(() => {})
    try {
      const f = await fixture(mock((_input: unknown): Promise<object> => { throw new Error("failure") }))
      await f.call("set_reminder", { seconds: 1, message: "a" })
      await f.advance(3000)
      expect(f.prompt).toHaveBeenCalledTimes(1)
      expect(f.timers[0]!.active).toBe(false)
      f.cleanup()
    } finally {
      warning.mockRestore()
    }
  })

  test("a stale failed admission cannot cancel a replacement", async () => {
    const pending = Promise.withResolvers<object>()
    const prompt = mock((_input: unknown) => Promise.resolve({}))
    prompt.mockImplementationOnce(() => pending.promise)
    const f = await fixture(prompt)
    await f.call("set_reminder", { seconds: 1, message: "old" })
    await f.advance(1000)
    await f.call("set_reminder", { seconds: 1, message: "new" })
    pending.reject(new Error("old failure"))
    await Promise.resolve()
    await f.advance(2000)
    expect(prompt).toHaveBeenCalledTimes(3)
    expect(f.timers[1]!.active).toBe(true)
    f.cleanup()
  })

  test("unset and cleanup during admission prevent subsequent calls", async () => {
    for (const stop of ["unset", "cleanup"]) {
      const pending = Promise.withResolvers<object>()
      const f = await fixture(mock((_input: unknown) => pending.promise))
      await f.call("set_reminder", { seconds: 1, message: "a" })
      await f.advance(1000)
      if (stop === "unset") await f.call("unset_reminder", {})
      else f.cleanup()
      pending.reject(new Error("late failure"))
      await Promise.resolve()
      f.timers[0]!.callback()
      await f.advance(3000)
      expect(f.prompt).toHaveBeenCalledTimes(1)
      expect(f.timers[0]!.active).toBe(false)
      f.cleanup()
    }
  })
})
