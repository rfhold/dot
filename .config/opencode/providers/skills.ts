import { Plugin, Skill } from "@opencode/plugin"
import { createRequire } from "node:module"
import { homedir } from "node:os"
import { basename, dirname, join } from "node:path"

type Filters = { include?: string[]; exclude?: string[] }

export async function packageSkills(packageName: string, filters: Filters = {}): Promise<Skill.Info[]> {
  const require = createRequire(import.meta.url)
  let manifest: string
  try {
    manifest = require.resolve(`${packageName}/package.json`)
  } catch (cause) {
    throw new Error(`${packageName} is not installed; run bun install in ~/dot with access to its Git repository`, { cause })
  }
  const root = join(dirname(manifest), "skills")
  const files = Array.from(new Bun.Glob("**/SKILL.md").scanSync({ cwd: root, absolute: true })).sort()
  const skills: Skill.Info[] = []
  for (const path of files) {
    const id = basename(dirname(path))
    if (filters.include && !filters.include.includes(id)) continue
    if (filters.exclude?.includes(id)) continue
    const text = await Bun.file(path).text()
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
    const meta = (match ? Bun.YAML.parse(match[1]!) : {}) as Record<string, unknown>
    const metadata = meta.metadata as Record<string, unknown> | undefined
    skills.push({
      id: Skill.ID.make(id),
      name: Skill.Name.make(typeof meta.name === "string" ? meta.name : id),
      description: typeof meta.description === "string" ? meta.description : undefined,
      autoinvoke: metadata?.["opencode/autoinvoke"] === undefined
        ? meta["disable-model-invocation"] !== true
        : metadata["opencode/autoinvoke"] !== false,
      path: path as Skill.Info["path"],
      content: match ? text.slice(match[0].length) : text,
    })
  }
  if (!files.length) throw new Error(`No skills found in ${packageName}; run bun install in ~/dot`)
  return skills
}

export async function registerPackageSkills(ctx: Plugin.Context, packageName: string, filters?: Filters) {
  const skills = await packageSkills(packageName, filters)
  await ctx.skill.transform((editor) => {
    for (const skill of skills) editor.add(skill)
  })
}

export async function readSkillFilters(file: string): Promise<Filters> {
  const path = file.replace(/^~(?=\/)/, homedir())
  const config = await Bun.file(path).json()
  const values = (value: unknown) => Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))]
    : []
  const include = Object.hasOwn(config, "include") ? config : config.skills ?? {}
  const exclude = Object.hasOwn(config, "exclude") ? config : config.skills ?? {}
  return {
    include: Object.hasOwn(include, "include") ? values(include.include) : undefined,
    exclude: values(exclude.exclude),
  }
}
