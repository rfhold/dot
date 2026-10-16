import { Plugin } from "@opencode/plugin"
import { registerPackageSkills } from "../skills.ts"

export default Plugin.define({
  id: "rfhold.skills",
  async setup(ctx) {
    await registerPackageSkills(ctx, "rfhold-skills")
  },
})
