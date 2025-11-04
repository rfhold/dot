import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Echo back the provided message. Use for testing tool execution or validating tool infrastructure.",
  
  args: {
    message: tool.schema.string().describe("Message to echo back"),
  },
  
  async execute(args, _context) {
    return `Echo: ${args.message}`
  }
})
