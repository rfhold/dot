import { Plugin } from "@opencode/plugin"
import { readSkillFilters, registerPackageSkills } from "../skills.ts"

export default Plugin.define({
  id: "cfaintl.skills",
  async setup(ctx) {
    const configFile = ctx.options.configFile
    if (typeof configFile !== "string") throw new Error("cfaintl.skills requires options.configFile")
    await registerPackageSkills(ctx, "cfa-skills", await readSkillFilters(configFile))
  },
})
