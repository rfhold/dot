// @bun
export default async () => ({
  "shell.env": async (_input, output) => {
    output.env.GIT_EDITOR = "true"
  },
})
