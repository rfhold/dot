import { Plugin } from "@opencode/plugin"
import { constants } from "node:fs"
import { copyFile, realpath, stat } from "node:fs/promises"
import { join, resolve } from "node:path"

const warning = "[worktree-npmrc] Unable to copy ignored .npmrc into a new worktree."
const streamWarning = "[worktree-npmrc] Worktree event listener stopped unexpectedly."

async function git(directory: string, ...args: string[]) {
  const process = Bun.spawn(["git", "-C", directory, ...args], {
    stdout: "pipe",
    stderr: "ignore",
  })
  const output = await new Response(process.stdout).text()
  const code = await process.exited
  return { code, output: output.trim() }
}

async function gitPath(directory: string, flag: string) {
  const result = await git(directory, "rev-parse", "--path-format=absolute", flag)
  if (result.code !== 0) throw new Error("Git lookup failed")
  return realpath(result.output)
}

async function copy(root: string, directory: string) {
  const source = join(root, ".npmrc")
  try {
    if (!(await stat(source)).isFile()) return
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return
    throw error
  }
  const ignored = await git(root, "check-ignore", "--quiet", "--", ".npmrc")
  if (ignored.code === 1) return
  if (ignored.code !== 0) throw new Error("Git ignore lookup failed")

  const common = await gitPath(root, "--git-common-dir")
  if ((await gitPath(directory, "--git-common-dir")) !== common) return
  if ((await gitPath(directory, "--git-dir")) === common) return
  if ((await gitPath(directory, "--show-toplevel")) !== (await realpath(directory))) return
  try {
    await copyFile(source, join(directory, ".npmrc"), constants.COPYFILE_EXCL)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
  }
}

export default Plugin.define({
  id: "rfhold.worktree-npmrc",
  async setup(ctx) {
    const project = ctx.location.project
    if (resolve(project.directory) !== resolve(project.canonical)) return

    const controller = new AbortController()
    const baseline = Promise.withResolvers<Set<string>>()
    const listener = (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event.type !== "worktree.updated" || event.data.projectID !== project.id) continue
          const seen = await baseline.promise
          if (controller.signal.aborted) break
          try {
            const entries = await ctx.worktree.list({ projectID: project.id })
            const current = new Set(entries.map((entry) => resolve(entry.directory)))
            for (const directory of current) {
              if (controller.signal.aborted) break
              if (seen.has(directory)) continue
              seen.add(directory)
              try {
                await copy(project.canonical, directory)
              } catch {
                console.warn(warning)
              }
            }
            for (const directory of seen) {
              if (!current.has(directory)) seen.delete(directory)
            }
          } catch {
            console.warn(warning)
          }
        }
        if (!controller.signal.aborted) console.warn(streamWarning)
      } catch {
        if (!controller.signal.aborted) console.warn(streamWarning)
      }
    })()

    try {
      const entries = await ctx.worktree.list({ projectID: project.id })
      baseline.resolve(new Set(entries.map((entry) => resolve(entry.directory))))
    } catch {
      console.warn(warning)
      controller.abort()
      baseline.resolve(new Set())
      await listener
      return
    }

    return async () => {
      controller.abort()
      await listener
    }
  },
})
