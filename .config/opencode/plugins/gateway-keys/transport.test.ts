import { expect, test } from "bun:test"
import { Effect } from "effect"
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http"
import { authenticate, gateway, providers } from "./keys"

test("OpenCode 2.0.31 Effect conversion sends only consumable bearer auth through FetchHttpClient", async () => {
  for (const providerID of providers) {
    let calls = 0
    const key = "sk-agw-local-transport-fixture"
    const request = new Request(`${gateway}/v1/${providerID === "claude" ? "messages" : "responses"}`, {
      method: "POST", redirect: "error", body: "{}",
      headers: { Authorization: "Bearer unused", "X-Api-Key": "unused", "api-key": "unused", "x-keep": "yes" },
    })
    authenticate(request.headers, key)
    const injected = (async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls++
      expect(String(url)).toBe(request.url)
      expect(init?.redirect).toBeUndefined()
      const headers = new Headers(init?.headers)
      expect(headers.get("authorization")).toBe(`Bearer ${key}`)
      expect(headers.has("x-api-key")).toBe(false)
      expect(headers.has("api-key")).toBe(false)
      expect(headers.get("x-keep")).toBe("yes")
      headers.delete("authorization")
      expect(JSON.stringify(Object.fromEntries(headers))).not.toContain(key)
      return Response.json({})
    }) as typeof fetch
    const program = Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient
      let sent = HttpClientRequest.fromWeb(request)
      if (request.body) sent = HttpClientRequest.bodyUint8Array(
        sent, new Uint8Array(yield* Effect.promise(() => request.clone().arrayBuffer())),
        request.headers.get("content-type") ?? undefined,
      )
      return yield* client.execute(sent)
    })
    await Effect.runPromise(program.pipe(
      Effect.provide(FetchHttpClient.layer),
      Effect.provideService(FetchHttpClient.Fetch, injected),
    ))
    expect(calls).toBe(1)
  }
})
