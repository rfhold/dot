import { createHash, randomBytes } from "node:crypto"
import { chmod, lstat, mkdir, open, readFile, realpath, rename, rm } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

export const gateway = "https://agent-gateway.holdenitdown.net"
export const providers = ["homelab", "codex", "bifrost", "claude"] as const
const resourceURL = `${gateway}/api/config/resources/llm.apiKey`
const digest = (value: string): string => createHash("sha256").update(value).digest("hex")
export const keyHash = (key: string): string => `sha256:${digest(key)}`

type Entry = { version: 1; key: string; ready: boolean }
type Fetch = (url: string, init: RequestInit) => Promise<Response>

export function originIdentity(origin: string): string | undefined {
  try {
    const raw = origin.trim()
    const scp = raw.match(/^(?:[^@/\s]+@)?([a-zA-Z0-9.-]+):([^/].*)$/)
    const url = new URL(scp && !raw.includes("://") ? `ssh://${scp[1]}/${scp[2]}` : raw)
    if (!["ssh:", "https:", "http:", "git:"].includes(url.protocol)) return
    const host = url.hostname.toLowerCase() + (url.port && !(url.protocol === "ssh:" && url.port === "22") ? `:${url.port}` : "")
    const path = url.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "")
    if (!host || !path || !/^[a-zA-Z0-9._/-]+$/.test(path) || path.split("/").some((part) => !part || part === "." || part === "..")) return
    return `${host}/${path}`
  } catch {
    return
  }
}

async function git(directory: string, args: string[]): Promise<string | undefined> {
  const child = Bun.spawn(["git", "-C", directory, ...args], { stdout: "pipe", stderr: "ignore", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } })
  const timer = setTimeout(() => child.kill(), 2000)
  try {
    const text = await new Response(child.stdout).text()
    return await child.exited === 0 ? text.trim() : undefined
  } finally {
    clearTimeout(timer)
  }
}

export async function repositoryIdentity(directory: string): Promise<string> {
  const origin = await git(directory, ["config", "--get", "remote.origin.url"])
  const identity = origin && originIdentity(origin)
  if (identity) return identity
  const common = await git(directory, ["rev-parse", "--path-format=absolute", "--git-common-dir"])
  return `local/${digest(await realpath(common || directory))}`
}

export function allowedDestination(providerID: string, address: string, websocket = false): boolean {
  if (!providers.some((id) => id === providerID)) return false
  try {
    const url = new URL(address)
    return !url.username && !url.password && url.origin === (websocket ? gateway.replace("https:", "wss:") : gateway)
      && ["/v1/chat/completions", "/v1/responses", "/v1/messages", "/v1/messages/count_tokens"].includes(url.pathname)
  } catch {
    return false
  }
}

export function authenticate(headers: Headers, key: string): void {
  headers.set("authorization", `Bearer ${key}`)
  headers.delete("x-api-key")
  headers.delete("api-key")
}

async function privateDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true, mode: 0o700 })
  const info = await lstat(path)
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid?.()) throw new Error("unsafe cache")
  await chmod(path, 0o700)
}

async function load(path: string): Promise<Entry | undefined> {
  try {
    const info = await lstat(path)
    if (!info.isFile() || info.isSymbolicLink() || info.uid !== process.getuid?.()) throw new Error("unsafe cache")
    await chmod(path, 0o600)
    const entry = JSON.parse(await readFile(path, "utf8")) as Entry
    if (entry.version !== 1 || !/^sk-agw-[a-f0-9]{64}$/.test(entry.key) || typeof entry.ready !== "boolean") throw new Error("invalid cache")
    return entry
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return
    throw new Error("cache unavailable")
  }
}

async function save(path: string, entry: Entry): Promise<void> {
  const temporary = `${path}.${randomBytes(12).toString("hex")}`
  const file = await open(temporary, "wx", 0o600)
  try {
    await file.writeFile(JSON.stringify(entry))
    await file.sync()
    await file.close()
    await rename(temporary, path)
  } finally {
    await file.close().catch(() => {})
    await rm(temporary, { force: true })
  }
}

async function lock(path: string): Promise<() => Promise<void>> {
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    try {
      await mkdir(path, { mode: 0o700 })
      await Bun.write(join(path, "owner"), String(process.pid), { mode: 0o600 })
      return () => rm(path, { recursive: true, force: true })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
      const guard = `${path}.recovery`
      const recovering = await mkdir(guard, { mode: 0o700 }).then(() => true).catch(() => false)
      if (recovering) {
        try {
          const info = await lstat(path).catch(() => undefined)
          if (info) {
            if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid?.()) throw new Error("unsafe lock")
            const owner = Number(await readFile(join(path, "owner"), "utf8").catch(() => ""))
            let dead = false
            if (Number.isSafeInteger(owner) && owner > 0) {
              try { process.kill(owner, 0) } catch (error) { dead = (error as NodeJS.ErrnoException).code === "ESRCH" }
            } else dead = Date.now() - info.mtimeMs > 30000
            if (dead) await rm(path, { recursive: true, force: true })
          }
        } finally {
          await rm(guard, { recursive: true, force: true })
        }
      }
      await Bun.sleep(40)
    }
  }
  throw new Error("cache busy")
}

export class RepositoryKeys {
  private readonly running = new Map<string, Promise<string>>()
  private readonly failed = new Map<string, number>()
  constructor(
    private readonly directory = join(process.env.XDG_STATE_HOME || join(homedir(), ".local/state"), "opencode/gateway-keys"),
    private readonly request: Fetch = fetch,
  ) {}

  async get(identity: string): Promise<string> {
    if ((this.failed.get(identity) || 0) > Date.now()) throw new Error("attribution unavailable")
    const previous = this.running.get(identity)
    if (previous) return previous
    const promise = this.ensure(identity).catch(() => {
      this.running.delete(identity)
      this.failed.set(identity, Date.now() + 30000)
      throw new Error("attribution unavailable")
    })
    this.running.set(identity, promise)
    return promise
  }

  private async call(method: string, body?: unknown): Promise<Response> {
    const response = await this.request(resourceURL, {
      method, redirect: "error", signal: AbortSignal.timeout(3000),
      headers: { "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!response.ok) throw new Error("registration unavailable")
    return response
  }

  private async ensure(identity: string): Promise<string> {
    await privateDirectory(this.directory)
    const path = join(this.directory, `${digest(identity)}.json`)
    const release = await lock(`${path}.lock`)
    try {
      let entry = await load(path)
      if (entry?.ready) return entry.key
      const pending = !!entry
      if (!entry) {
        entry = { version: 1, key: `sk-agw-${randomBytes(32).toString("hex")}`, ready: false }
        await save(path, entry)
      }
      const hash = keyHash(entry.key)
      let exists = false
      if (pending) {
        const listed = await (await this.call("GET")).json() as { resources?: { value?: { keyHash?: string } }[] }
        if (!Array.isArray(listed.resources)) throw new Error("registration unavailable")
        exists = listed.resources.some((record) => record.value?.keyHash === hash)
      }
      if (!exists) await this.call("PUT", { resources: [{ value: { keyHash: hash, metadata: { name: `opencode:${identity}`, user: "rfhold", group: identity } } }] })
      await save(path, { ...entry, ready: true })
      await Bun.sleep(150)
      return entry.key
    } finally {
      await release()
    }
  }
}
