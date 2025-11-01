import { tool } from "@opencode-ai/plugin"
import { createOpencode } from "@opencode-ai/sdk"

export default tool({
  description: "Execute an agent with a test prompt and return tokens, steps, and results",
  args: {
    agent: tool.schema.string().optional().describe("Name of the main agent to use (e.g., 'default'). If not specified, uses default agent."),
    prompt: tool.schema.string().describe("Test prompt to send. For subagents, use @agent-name prefix (e.g., '@agent-tester test this')"),
    subagent: tool.schema.string().optional().describe("Name of subagent to test (without .md). If provided, automatically prepends @subagent-name to prompt."),
  },
  async execute(args) {
    // Use port 0 to let the OS assign a random available port
    // This prevents conflicts when test_agent is called within an active OpenCode session
    const { client, server } = await createOpencode({ port: 0 })
    
    try {
      // Construct the final prompt
      let finalPrompt: string
      let agentName: string
      
      if (args.subagent) {
        // If subagent is specified, prepend @subagent-name to the prompt
        finalPrompt = `@${args.subagent} ${args.prompt}`
        agentName = args.subagent
      } else {
        // Use prompt as-is (may already have @agent-name prefix)
        finalPrompt = args.prompt
        // Try to extract agent name from @agent-name prefix if present
        const match = args.prompt.match(/^@([\w-]+)\s/)
        agentName = match ? match[1] : (args.agent || 'default')
      }
      
      // Create session
      const sessionResponse = await client.session.create({
        body: { title: "Agent Test" }
      })
      
      if (!sessionResponse.data) {
        throw new Error("Failed to create session")
      }
      
      const session = sessionResponse.data
      
      // Run agent with prompt (agent parameter specifies main agent, subagent is in prompt)
      const promptResponse = await client.session.prompt({
        path: { id: session.id },
        body: {
          agent: args.agent, // Main agent (optional, defaults to system default)
          parts: [{ type: "text", text: finalPrompt }]
        }
      })
      
      if (!promptResponse.data) {
        throw new Error("Failed to get prompt response")
      }
      
      // Get messages to extract complete information
      const messagesResponse = await client.session.messages({
        path: { id: session.id }
      })
      
      if (!messagesResponse.data) {
        throw new Error("Failed to get messages")
      }
      
      const messages = messagesResponse.data
      const lastMessage = messages[messages.length - 1]
      
      // Ensure we have an assistant message with token data
      if (lastMessage.info.role !== 'assistant') {
        throw new Error("Last message is not an assistant message")
      }
      
      // Calculate token totals
      const tokens = lastMessage.info.tokens
      const cacheRead = tokens.cache?.read || 0
      const cacheWrite = tokens.cache?.write || 0
      const apiTokens = tokens.input + tokens.output
      const totalTokens = apiTokens + cacheRead + cacheWrite
      
      // Extract output text from message parts
      const outputParts = lastMessage.parts.filter(p => p.type === 'text')
      const output = outputParts.map(p => p.text).join('\n')
      
      // Count tool uses (steps)
      const toolParts = lastMessage.parts.filter(p => p.type === 'tool')
      const steps = toolParts.length
      
      // Build result object
      const result = {
        agent_name: agentName,
        main_agent: args.agent || 'default',
        is_subagent: !!args.subagent,
        original_prompt: args.prompt,
        final_prompt: finalPrompt,
        output: output,
        tokens: {
          input_tokens: tokens.input,
          output_tokens: tokens.output,
          cache_read_tokens: cacheRead,
          cache_write_tokens: cacheWrite,
          api_tokens: apiTokens,
          total_tokens: totalTokens
        },
        steps: steps,
        cost: lastMessage.info.cost,
        session_id: session.id,
        message_id: lastMessage.info.id,
        tool_uses: toolParts.map(t => ({
          name: t.tool,
          status: t.state.status
        }))
      }
      
      // Clean up session
      await client.session.delete({ path: { id: session.id } })
      await server.close()
      
      return JSON.stringify(result, null, 2)
      
    } catch (error) {
      await server.close()
      throw new Error(`Agent test failed: ${error.message}`)
    }
  }
})
