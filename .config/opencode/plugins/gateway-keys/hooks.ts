import { allowedDestination, authenticate, repositoryIdentity, RepositoryKeys } from "./keys"

type Event = { sessionID: string; model: { providerID: string }; kind: string }

export function createHooks(
  directory: (sessionID: string) => Promise<string>,
  keys = new RepositoryKeys(),
  identity = repositoryIdentity,
  warn: () => void = () => console.warn("Gateway repository attribution unavailable; continuing without attribution."),
): {
  http(event: Event & { request: Request }): Promise<void>
  websocket(event: Event & { url: string; headers: Record<string, string> }): Promise<void>
} {
  let warnedAt = 0
  async function key(event: Event): Promise<string | undefined> {
    try {
      return await keys.get(await identity(await directory(event.sessionID)))
    } catch {
      if (Date.now() - warnedAt > 30000) {
        warnedAt = Date.now()
        warn()
      }
    }
  }
  return {
    async http(event): Promise<void> {
      if (!allowedDestination(event.model.providerID, event.request.url)) return
      const value = await key(event)
      if (!value) return
      authenticate(event.request.headers, value)
    },
    async websocket(event): Promise<void> {
      if (!allowedDestination(event.model.providerID, event.url, true)) return
      const value = await key(event)
      if (!value) return
      const headers = new Headers(event.headers)
      authenticate(headers, value)
      event.headers = Object.fromEntries(headers)
    },
  }
}
