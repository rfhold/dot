import { OpenCode, type OpenCodeClient } from "@opencode/client"
import { Service } from "@opencode/client/service"

export type Bridge = { client: OpenCodeClient; verify: (signal: AbortSignal) => Promise<void> }

type Discovery = Pick<typeof Service, "discover" | "headers">

async function discover(service: Discovery, signal: AbortSignal) {
  signal.throwIfAborted()
  return new Promise<Awaited<ReturnType<Discovery["discover"]>>>((resolve, reject) => {
    const abort = () => reject(new Error("Autopilot service discovery was cancelled or timed out."))
    signal.addEventListener("abort", abort, { once: true })
    Promise.resolve().then(() => { signal.throwIfAborted(); return service.discover() }).then(resolve, () => reject(new Error("Autopilot could not discover the local service. Use both OPENCODE_AUTOPILOT_URL and OPENCODE_AUTOPILOT_AUTHORIZATION for an explicit connection."))).finally(() => signal.removeEventListener("abort", abort))
  })
}

export async function makeBridge(directory: string, nonce: string, env = process.env, transport = globalThis.fetch, service: Discovery = Service, signal = AbortSignal.timeout(30_000)): Promise<Bridge> {
  signal.throwIfAborted()
  let address = env.OPENCODE_AUTOPILOT_URL
  const authorization = env.OPENCODE_AUTOPILOT_AUTHORIZATION
  let headers: ReturnType<Discovery["headers"]>
  if (address !== undefined || authorization !== undefined) {
    if (!address?.trim() || !authorization?.trim()) throw new Error("Set both OPENCODE_AUTOPILOT_URL and OPENCODE_AUTOPILOT_AUTHORIZATION, or unset both to discover the local service.")
    headers = { authorization }
  } else {
    const endpoint = await discover(service, signal)
    signal.throwIfAborted()
    if (!endpoint) throw new Error("No healthy compatible local OpenCode service was found. For a standalone/custom server, set both OPENCODE_AUTOPILOT_URL and OPENCODE_AUTOPILOT_AUTHORIZATION.")
    address = endpoint.url
    try { headers = service.headers(endpoint) } catch { throw new Error("Autopilot could not prepare local service authentication.") }
  }
  let url: URL
  try { url = new URL(address) } catch { throw new Error("Autopilot bridge URL is not a valid origin.") }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || !(url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) {
    throw new Error("Bridge URL must be an HTTPS origin or loopback HTTP origin, without credentials.")
  }
  const client = OpenCode.make({
    baseUrl: url.origin,
    headers,
    fetch: ((input, init) => {
      const request = new Request(input, init)
      if (new URL(request.url).origin !== url.origin) throw new Error("Bridge origin mismatch.")
      return transport(new Request(request, { redirect: "error" }))
    }) as typeof fetch,
  })
  return {
    client,
    async verify(signal) {
      let response: Awaited<ReturnType<typeof client.rpc.call>>
      try { response = await client.rpc.call({ rpcID: "rfhold.autopilot", method: "identity", location: { directory }, input: null }, { signal }) }
      catch { throw new Error("Autopilot bridge identity check failed. Check service availability and connection configuration.") }
      if (response.output !== nonce) throw new Error("Autopilot bridge is not connected to this plugin instance on the same server.")
    },
  }
}
