import { tool } from "@opencode-ai/plugin"
import { createOpencode } from "@opencode-ai/sdk"

export default tool({
  description: "Execute an agent with a test prompt and return tokens, steps, and results",
  args: {
    agent: tool.schema.string().optional().describe("Name of the main agent to use (e.g., 'default'). If not specified, uses default agent."),
    prompt: tool.schema.string().describe("Test prompt to send. For subagents, use @agent-name prefix (e.g., '@agent-tester test this')"),
    subagent: tool.schema.string().optional().describe("Name of subagent to test (without .md). If provided, automatically prepends @subagent-name to prompt."),
    timeout: tool.schema.number().optional().describe("Maximum execution time in milliseconds (default: 300000ms / 5 minutes). Set to 0 for no timeout."),
  },
  async execute(args) {
    // Use port 0 to let the OS assign a random available port
    // This prevents conflicts when test_agent is called within an active OpenCode session
    const { client, server } = await createOpencode({ port: 0 })
    
    // Set timeout (default: 5 minutes, 0 means no timeout)
    const timeoutMs = args.timeout !== undefined ? args.timeout : 300000
    
    // Store session info for cleanup and timeout handling
    let sessionId: string | null = null
    let finalPrompt: string = ''
    let agentName: string = ''
    
    try {
      // Construct the final prompt
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
      sessionId = session.id
      
      // Wrap the prompt execution in timeout logic
      const executePrompt = async () => {
        // Run agent with prompt (agent parameter specifies main agent, subagent is in prompt)
        const promptResponse = await client.session.prompt({
          path: { id: sessionId! },
          body: {
            agent: args.agent, // Main agent (optional, defaults to system default)
            parts: [{ type: "text", text: finalPrompt }]
          }
        })
        
        if (!promptResponse.data) {
          throw new Error("Failed to get prompt response")
        }
        
        return promptResponse.data
      }
      
      // Execute with or without timeout
      let timedOut = false
      if (timeoutMs > 0) {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            timedOut = true
            reject(new Error('TIMEOUT'))
          }, timeoutMs)
        })
        
        try {
          await Promise.race([executePrompt(), timeoutPromise])
        } catch (error) {
          if (error.message === 'TIMEOUT') {
            // Continue to message retrieval to get partial results
          } else {
            throw error
          }
        }
      } else {
        await executePrompt()
      }
      
      // Get messages to extract complete information (works even if timed out)
      const messagesResponse = await client.session.messages({
        path: { id: sessionId }
      })
      
      if (!messagesResponse.data || messagesResponse.data.length === 0) {
        throw new Error("Failed to get messages")
      }
      
      const messages = messagesResponse.data
      const lastMessage = messages[messages.length - 1]
      
      // Build result object from whatever we have
      let result: any = {
        agent_name: agentName,
        main_agent: args.agent || 'default',
        is_subagent: !!args.subagent,
        original_prompt: args.prompt,
        final_prompt: finalPrompt,
        timed_out: timedOut,
        session_id: sessionId,
        message_id: lastMessage.info.id
      }
      
      // If we have an assistant message, extract full details
      if (lastMessage.info.role === 'assistant') {
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
        
        result.output = output
        result.tokens = {
          input_tokens: tokens.input,
          output_tokens: tokens.output,
          cache_read_tokens: cacheRead,
          cache_write_tokens: cacheWrite,
          api_tokens: apiTokens,
          total_tokens: totalTokens
        }
        result.steps = steps
        result.cost = lastMessage.info.cost
        result.tool_uses = toolParts.map(t => ({
          name: t.tool,
          status: t.state.status
        }))
      } else {
        // If no assistant message yet, just record what we have
        result.output = "No response generated (timeout occurred before completion)"
        result.partial_messages = messages.map(m => ({
          role: m.info.role,
          tool_count: m.parts.filter(p => p.type === 'tool').length
        }))
      }
      
      // Add timeout warning if applicable
      if (timedOut) {
        result.timeout_info = {
          timeout_ms: timeoutMs,
          message: `Agent execution timed out after ${timeoutMs}ms. Returning partial results.`
        }
      }
      
      // Clean up session
      await client.session.delete({ path: { id: sessionId } })
      await server.close()
      
      return JSON.stringify(result, null, 2)
      
    } catch (error) {
      // Attempt cleanup even on error
      if (sessionId) {
        try {
          await client.session.delete({ path: { id: sessionId } })
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      await server.close()
      throw new Error(`Agent test failed: ${error.message}`)
    }
  }
})
