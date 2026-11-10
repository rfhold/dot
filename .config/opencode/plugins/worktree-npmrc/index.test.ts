import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile, lstat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Plugin } from "@opencode/plugin"
import plugin from "./index"

const cleanups: (() => Promise<void>)[] = []
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup()
})

async function git(root: string, ...args: string[]) {
  const process = Bun.spawn(["git", "-C", root, ...args], { stdout: "ignore", stderr: "ignore" })
  expect(await process.exited).toBe(0)
}

async function fixture() {
  const temp = await mkdtemp(join(tmpdir(), "worktree-npmrc-"))
  cleanups.push(() => rm(temp, { recursive: true, force: true }))
  const root = join(temp, "root")
  await mkdir(root)
  await git(root, "init")
  await git(root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-m", "test")
  await writeFile(join(root, ".git", "info", "exclude"), ".npmrc\n")
  const bytes = Buffer.from("registry=https://example.invalid/\r\n//example.invalid/:_authToken=fixture\n\0")
  await writeFile(join(root, ".npmrc"), bytes)
  let entries = [{ directory: root }]
  let wake = Promise.withResolvers<void>()
  const queue: { projectID?: string; error?: boolean; done: ReturnType<typeof Promise.withResolvers<void>> }[] = []
  let signal: AbortSignal | undefined
  let subscribed = 0
  let calls = 0
  let failList = false
  const warnings: unknown[][] = []
  const originalWarn = console.warn
  console.warn = (...args) => { warnings.push(args) }
  cleanups.push(async () => { console.warn = originalWarn })
  const ctx = {
    location: { project: { id: "project", directory: root, canonical: root } },
    event: {
      async *subscribe(options: { signal: AbortSignal }) {
        subscribed++
        signal = options.signal
        signal.addEventListener("abort", () => wake.resolve(), { once: true })
        while (!signal.aborted) {
          if (!queue.length) await wake.promise
          wake = Promise.withResolvers<void>()
          const item = queue.shift()
          if (!item) continue
          try {
            if (item.error) throw new Error("secret error detail")
            yield { type: "worktree.updated", data: { projectID: item.projectID } }
          } finally {
            item.done.resolve()
          }
        }
      },
    },
    worktree: {
      async list() {
        calls++
        if (failList) throw new Error("secret error detail")
        return [...entries]
      },
    },
  }
  async function start() {
    const cleanup = await plugin.setup(ctx as unknown as Plugin.Context)
    if (cleanup) cleanups.push(async () => { await cleanup() })
    return cleanup
  }
  async function emit(projectID = "project", error = false) {
    const done = Promise.withResolvers<void>()
    queue.push({ projectID, error, done })
    wake.resolve()
    await done.promise
  }
  async function tree(name: string) {
    const directory = join(temp, name)
    await git(root, "worktree", "add", "--detach", directory, "HEAD")
    entries.push({ directory })
    return directory
  }
  return {
    root, bytes, start, emit, tree, warnings, ctx,
    get calls() { return calls },
    get subscribed() { return subscribed },
    get signal() { return signal },
    set failList(value: boolean) { failList = value },
    add(directory: string) { entries.push({ directory }) },
  }
}

describe("worktree .npmrc", () => {
  test("copies ignored source bytes only into new linked worktrees", async () => {
    const f = await fixture()
    const existing = await f.tree("existing")
    await f.start()
    const added = await f.tree("added")
    await f.emit()
    expect(await readFile(join(added, ".npmrc"))).toEqual(f.bytes)
    expect(await Bun.file(join(existing, ".npmrc")).exists()).toBe(false)
    await f.emit()
    expect(await readFile(join(added, ".npmrc"))).toEqual(f.bytes)
  })

  for (const kind of ["missing", "unignored", "tracked"] as const) {
    test(`skips ${kind} source`, async () => {
      const f = await fixture()
      if (kind === "missing") await rm(join(f.root, ".npmrc"))
      if (kind === "unignored") await writeFile(join(f.root, ".git", "info", "exclude"), "")
      if (kind === "tracked") {
        await git(f.root, "add", "--force", ".npmrc")
        await git(f.root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-m", "track config")
      }
      await f.start()
      const added = await f.tree("added")
      if (kind === "tracked") await rm(join(added, ".npmrc"))
      await f.emit()
      expect(await Bun.file(join(added, ".npmrc")).exists()).toBe(false)
      expect(f.warnings).toEqual([])
    })
  }

  test("preserves existing files and dangling symlinks", async () => {
    const f = await fixture()
    await f.start()
    const file = await f.tree("file")
    const link = await f.tree("link")
    await writeFile(join(file, ".npmrc"), "keep")
    await symlink("missing-target", join(link, ".npmrc"))
    await f.emit()
    expect(await readFile(join(file, ".npmrc"), "utf8")).toBe("keep")
    expect((await lstat(join(link, ".npmrc"))).isSymbolicLink()).toBe(true)
    expect(f.warnings).toEqual([])
  })

  test("skips other projects and noncanonical plugin instances", async () => {
    const f = await fixture()
    await f.start()
    const added = await f.tree("added")
    await f.emit("other")
    expect(f.calls).toBe(1)
    expect(await Bun.file(join(added, ".npmrc")).exists()).toBe(false)
    f.ctx.location.project.directory = added
    await f.start()
    expect(f.subscribed).toBe(1)
  })

  test("does not copy into another repository or root", async () => {
    const f = await fixture()
    const other = await fixture()
    await f.start()
    await rm(join(other.root, ".npmrc"))
    f.add(other.root)
    await f.emit()
    expect(await Bun.file(join(other.root, ".npmrc")).exists()).toBe(false)
  })

  test("sanitizes failures, keeps listening, and aborts on cleanup", async () => {
    const f = await fixture()
    const cleanup = await f.start()
    f.failList = true
    await f.emit()
    f.failList = false
    f.add(join(f.root, "nonexistent"))
    await f.emit()
    const added = await f.tree("added")
    await f.emit()
    expect(await readFile(join(added, ".npmrc"))).toEqual(f.bytes)
    expect(f.warnings).toEqual([
      ["[worktree-npmrc] Unable to copy ignored .npmrc into a new worktree."],
      ["[worktree-npmrc] Unable to copy ignored .npmrc into a new worktree."],
    ])
    if (cleanup) await cleanup()
    expect(f.signal?.aborted).toBe(true)
  })

  test("reports unexpected stream failure without error details", async () => {
    const f = await fixture()
    const cleanup = await f.start()
    await f.emit("project", true)
    if (cleanup) await cleanup()
    expect(f.warnings).toEqual([["[worktree-npmrc] Worktree event listener stopped unexpectedly."]])
  })

  test("baseline failure disables copying safely", async () => {
    const f = await fixture()
    f.failList = true
    await f.start()
    expect(f.signal?.aborted).toBe(true)
    expect(f.warnings).toEqual([["[worktree-npmrc] Unable to copy ignored .npmrc into a new worktree."]])
  })
})
