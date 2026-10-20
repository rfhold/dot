import { afterEach, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createHooks } from "./hooks"
import { allowedDestination, gateway, keyHash, originIdentity, providers, repositoryIdentity, RepositoryKeys } from "./keys"

const roots: string[] = []
async function temporary(): Promise<string> {
  const base = join(tmpdir(), "opencode")
  await mkdir(base, { recursive: true })
  const path = await mkdtemp(join(base, "gateway-test-"))
  roots.push(path)
  return path
}
afterEach(async () => { await Promise.all(roots.splice(0).map((path) => rm(path, { recursive: true, force: true }))) })

test("origin formats share identity without credentials and remain host-sensitive", () => {
  const expected = "github.com/rfhold/homelab"
  for (const origin of ["git@github.com:rfhold/homelab.git", "ssh://git@github.com/rfhold/homelab.git", "https://user:password@github.com/rfhold/homelab.git?token=secret", "ssh://git@github.com:22/rfhold/homelab.git"]) expect(originIdentity(origin)).toBe(expected)
  expect(originIdentity("https://elsewhere.net/rfhold/homelab.git")).not.toBe(expected)
  expect(originIdentity("file:///secret/path")).toBeUndefined()
  expect(originIdentity("/secret/path")).toBeUndefined()
  expect(originIdentity("https://github.com/repo%40secret.git")).toBeUndefined()
})

test("hash matches v1.5 APIKeyHash sha256 UTF-8 and prefixed hex validator", () => {
  expect(keyHash("abc")).toBe("sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  expect(keyHash("abc").slice(7)).toMatch(/^[a-f0-9]{64}$/)
})

test("real git worktrees share origin and no-origin fallback identities", async () => {
  const root = await temporary()
  const repo = join(root, "repo")
  await mkdir(repo)
  async function git(args: string[]): Promise<void> {
    const child = Bun.spawn(["git", "-C", repo, ...args], { stdout: "ignore", stderr: "ignore" })
    expect(await child.exited).toBe(0)
  }
  await git(["init"])
  await git(["-c", "user.name=test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-m", "fixture"])
  await git(["worktree", "add", "--detach", join(root, "tree")])
  const fallback = await repositoryIdentity(repo)
  expect(fallback).toMatch(/^local\/[a-f0-9]{64}$/)
  expect(await repositoryIdentity(join(root, "tree"))).toBe(fallback)
  await git(["remote", "add", "origin", "git@github.com:rfhold/homelab.git"])
  expect(await repositoryIdentity(join(root, "tree"))).toBe("github.com/rfhold/homelab")
  expect(await repositoryIdentity(root)).not.toContain(root)
})

test("parallel processes provision once and preserve private cache permissions", async () => {
  const root = await temporary()
  const cache = join(root, "state")
  const count = join(root, "calls")
  const module = new URL("./keys.ts", import.meta.url).pathname
  const code = `import { RepositoryKeys } from ${JSON.stringify(module)}; import { appendFile } from 'node:fs/promises'; const keys = new RepositoryKeys(${JSON.stringify(cache)}, async (url, init) => { if (init.method !== 'PUT' || init.redirect !== 'error') process.exit(2); await appendFile(${JSON.stringify(count)}, 'call\\n'); await Bun.sleep(100); return new Response('{}'); }); await Promise.all(Array.from({length: 8}, () => keys.get('github.com/rfhold/homelab')));`
  const children = Array.from({ length: 5 }, () => Bun.spawn([process.execPath, "--eval", code], { stdout: "ignore", stderr: "pipe" }))
  for (const child of children) {
    const error = await new Response(child.stderr).text()
    expect({ exit: await child.exited, error }).toEqual({ exit: 0, error: "" })
  }
  expect((await readFile(count, "utf8")).trim().split("\n")).toHaveLength(1)
  expect((await stat(cache)).mode & 0o777).toBe(0o700)
  const files = await readdir(cache)
  expect(files).toHaveLength(1)
  expect((await stat(join(cache, files[0]))).mode & 0o777).toBe(0o600)
})

test("dead process lock recovers before registration", async () => {
  const root = await temporary()
  const identity = "github.com/a/dead-lock"
  const child = Bun.spawn([process.execPath, "--eval", "process.exit(0)"], { stdout: "ignore", stderr: "ignore" })
  await child.exited
  const name = createHash("sha256").update(identity).digest("hex")
  const lock = join(root, `${name}.json.lock`)
  await mkdir(lock, { mode: 0o700 })
  await writeFile(join(lock, "owner"), String(child.pid), { mode: 0o600 })
  let calls = 0
  await new RepositoryKeys(root, async () => { calls++; return Response.json({}) }).get(identity)
  expect(calls).toBe(1)
  expect((await readdir(root)).some((file) => file.endsWith(".lock") || file.endsWith(".recovery"))).toBe(false)
})

test("pending written before PUT; uncertain successful create reconciles without another PUT", async () => {
  const root = await temporary()
  let hash = ""
  let puts = 0
  const first = new RepositoryKeys(root, async (_, init) => {
    const files = (await readdir(root)).filter((file) => file.endsWith(".json"))
    const entry = JSON.parse(await readFile(join(root, files[0]), "utf8"))
    expect(entry.ready).toBe(false)
    hash = keyHash(entry.key)
    const body = String(init.body)
    expect(body).not.toContain(entry.key)
    expect(body).toContain(hash)
    puts++
    throw new Error("sensitive server error")
  })
  await expect(first.get("github.com/a/b")).rejects.toThrow("attribution unavailable")
  const next = new RepositoryKeys(root, async (_, init) => {
    expect(init.redirect).toBe("error")
    expect(init.method).toBe("GET")
    return Response.json({ resources: [{ value: { keyHash: hash } }] })
  })
  expect(keyHash(await next.get("github.com/a/b"))).toBe(hash)
  expect(puts).toBe(1)
})

test("pending absent remotely retries same hash; rejects redirect and throttles errors", async () => {
  const root = await temporary()
  const hashes: string[] = []
  const request = async (_: string, init: RequestInit): Promise<Response> => {
    expect(init.redirect).toBe("error")
    if (init.method === "GET") return Response.json({ resources: [] })
    hashes.push(JSON.parse(String(init.body)).resources[0].value.keyHash)
    return new Response("secret", { status: hashes.length === 1 ? 302 : 200, headers: { location: "https://evil.invalid" } })
  }
  const first = new RepositoryKeys(root, request)
  await expect(first.get("repo")).rejects.toThrow("attribution unavailable")
  await expect(first.get("repo")).rejects.toThrow("attribution unavailable")
  await new RepositoryKeys(root, request).get("repo")
  expect(hashes).toHaveLength(2)
  expect(hashes[0]).toBe(hashes[1])
})

test("all four providers and request kinds use current session directory on HTTP and WS", async () => {
  const root = await temporary()
  let puts = 0
  const keys = new RepositoryKeys(root, async () => { puts++; return Response.json({}) })
  const locations: Record<string, string> = { a: "repo-a", b: "repo-b" }
  const hooks = createHooks(async (id) => locations[id], keys, async (directory) => directory)
  let aKey = ""
  for (const providerID of providers) for (const kind of ["primary", "title", "compaction", "generate"]) {
    const event = { sessionID: "a", model: { providerID }, kind, request: new Request(`${gateway}/v1/messages`, { headers: { Authorization: "Bearer unused", "api-key": "unused", "X-Api-Key": "unused", "x-keep": "yes" } }) }
    await hooks.http(event)
    const headers = event.request.headers
    aKey ||= headers.get("authorization")!
    expect(headers.get("authorization")).toBe(aKey)
    expect(headers.get("api-key")).toBeNull()
    expect(headers.get("x-api-key")).toBeNull()
    expect(headers.get("x-keep")).toBe("yes")
    const ws = { ...event, url: gateway.replace("https:", "wss:") + "/v1/responses", headers: { Authorization: "unused", "api-key": "unused", "X-Api-Key": "unused", "x-keep": "yes" } as Record<string, string> }
    await hooks.websocket(ws)
    expect(ws.headers.authorization).toBe(aKey)
    expect(ws.headers["api-key"]).toBeUndefined()
    expect(ws.headers["x-api-key"]).toBeUndefined()
    expect(ws.headers["x-keep"]).toBe("yes")
  }
  locations.a = "repo-b"
  const moved = { sessionID: "a", model: { providerID: "codex" }, kind: "primary", request: new Request(`${gateway}/v1/responses`) }
  await hooks.http(moved)
  const other = { ...moved, sessionID: "b", request: new Request(`${gateway}/v1/responses`) }
  await hooks.http(other)
  expect(other.request.headers.get("authorization")).toBe(moved.request.headers.get("authorization"))
  expect(other.request.headers.get("authorization")).not.toBe(aKey)
  expect(puts).toBe(2)
})

test("destination allowlist excludes credential redirects and unrelated providers", async () => {
  for (const url of [`${gateway}.evil/v1/responses`, `${gateway}/api/config/resources/llm.apiKey`, `${gateway}/v1/responses/evil`, "http://agent-gateway.holdenitdown.net/v1/responses", "https://user@agent-gateway.holdenitdown.net/v1/responses"]) expect(allowedDestination("codex", url)).toBe(false)
  expect(allowedDestination("unrelated", `${gateway}/v1/responses`)).toBe(false)
  let called = false
  const hooks = createHooks(async () => { called = true; throw new Error() })
  const event = { sessionID: "a", model: { providerID: "other" }, kind: "primary", request: new Request(`${gateway}/v1/responses`) }
  await hooks.http(event)
  expect(called).toBe(false)
  let warnings = 0
  const failing = createHooks(async () => { throw new Error("secret path / key") }, undefined, undefined, () => { warnings++ })
  event.model.providerID = "claude"
  event.request.headers.set("authorization", "Bearer unused")
  await failing.http(event)
  await failing.http(event)
  expect(warnings).toBe(1)
  expect(event.request.headers.get("authorization")).toBe("Bearer unused")
})
