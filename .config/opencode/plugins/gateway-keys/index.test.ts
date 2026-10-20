import { expect, mock, test } from "bun:test"

mock.module("@opencode/plugin", () => ({ Plugin: { define: (plugin: unknown) => plugin } }))

test("plugin registers native HTTP and WebSocket hooks for only the four gateway providers", async () => {
  const plugin = (await import("./index")).default
  const registrations: { hook: string; providerID: string }[] = []
  await plugin.setup({
    session: {
      get: async () => ({ location: { directory: "/unused" } }),
      hook: async (hook: string, _: unknown, scope: { providerID: string }) => {
        registrations.push({ hook, providerID: scope.providerID })
      },
    },
  } as never)
  expect(plugin.id).toBe("rfhold.gateway-keys")
  expect(registrations).toEqual(["homelab", "codex", "bifrost", "claude"].flatMap((providerID) => [
    { hook: "http.request", providerID },
    { hook: "experimental.ws.handshake", providerID },
  ]))
})
