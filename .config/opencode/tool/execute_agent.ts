import { tool } from "@opencode-ai/plugin"
import { createOpencode } from "@opencode-ai/sdk"

export default tool({
  description: "Execute an agent with a test prompt, subagent invocation, or slash command, and return comprehensive metrics including tokens, steps, costs, and results. Use when testing agent behavior, subagent interactions, slash command functionality, or measuring performance.",
  args: {
    agent: tool.schema.string().optional().describe("Name of the main agent to use (e.g., 'default'). If not specified, uses default agent."),
    prompt: tool.schema.string().optional().describe("Test prompt to send. For subagents, use @agent-name prefix (e.g., '@agent-tester test this'). Not required when using 'command' parameter."),
    subagent: tool.schema.string().optional().describe("Name of subagent to test (without .md). If provided, automatically prepends @subagent-name to prompt."),
    command: tool.schema.string().optional().describe("Name of slash command to test (without / prefix, e.g., 'backwards' not '/backwards'). Command takes precedence over subagent if both are specified."),
    commandArgs: tool.schema.union([
      tool.schema.string(),
      tool.schema.array(tool.schema.string())
    ]).optional().describe("Arguments to pass to the slash command. Can be a single string or array of strings. If array, arguments will be joined with spaces."),
    timeout: tool.schema.number().optional().describe("Maximum execution time in milliseconds (default: 300000ms / 5 minutes). Set to 0 for no timeout."),
  },
  async execute(args) {
    // Use port 0 to let the OS assign a random available port
    // This prevents conflicts when execute_agent is called within an active OpenCode session
    const { client, server } = await createOpencode({ port: 0 })

    // Set timeout (default: 5 minutes, 0 means no timeout)
    const timeoutMs = args.timeout !== undefined ? args.timeout : 300000

    // Store session info for cleanup and timeout handling
    let sessionId: string | null = null
    let finalPrompt: string = ''
    let agentName: string = ''

    try {
      // Construct the final prompt (priority: command > subagent > plain prompt)
      if (args.command) {
        // If command is specified, construct slash command invocation
        const commandArgsStr = args.commandArgs 
          ? (Array.isArray(args.commandArgs) ? args.commandArgs.join(' ') : args.commandArgs)
          : ''
        finalPrompt = `/${args.command}${commandArgsStr ? ' ' + commandArgsStr : ''}`
        agentName = `command:${args.command}`
      } else if (args.subagent) {
        // If subagent is specified, prepend @subagent-name to the prompt
        if (!args.prompt) {
          throw new Error("prompt parameter is required when using subagent")
        }
        finalPrompt = `@${args.subagent} ${args.prompt}`
        agentName = args.subagent
      } else {
        // Use prompt as-is (may already have @agent-name prefix)
        if (!args.prompt) {
          throw new Error("prompt parameter is required when not using command or subagent")
        }
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
        is_command: !!args.command,
        original_prompt: args.prompt,
        final_prompt: finalPrompt,
        timed_out: timedOut,
        session_id: sessionId,
        message_id: lastMessage.info.id
      }

      // Add command-specific metadata if applicable
      if (args.command) {
        result.command_name = args.command
        if (args.commandArgs) {
          result.command_args = args.commandArgs
        }
      }

      // Aggregate data from ALL assistant messages (there may be multiple)
      const assistantMessages = messages.filter(m => m.info.role === 'assistant')

      if (assistantMessages.length > 0) {
        // Sum up tokens from all assistant messages
        let totalInput = 0
        let totalOutput = 0
        let totalCacheRead = 0
        let totalCacheWrite = 0
        let totalCost = 0

        assistantMessages.forEach(msg => {
          if (msg.info.role === 'assistant') {
            const tokens = msg.info.tokens
            totalInput += tokens.input
            totalOutput += tokens.output
            totalCacheRead += tokens.cache?.read || 0
            totalCacheWrite += tokens.cache?.write || 0
            totalCost += msg.info.cost || 0
          }
        })

        // Collect ALL tool uses from ALL assistant messages
        const allToolParts: any[] = []
        assistantMessages.forEach(msg => {
          const toolParts = msg.parts.filter(p => p.type === 'tool')
          allToolParts.push(...toolParts)
        })

        // Recursively aggregate tokens from nested task/execute_agent executions
        // This handles cases where agents spawn sub-agents via the task tool or execute_agent tool
        const extractNestedTokens = async (toolPart: any): Promise<any> => {
          const state: any = toolPart.state
          let nestedTokens = {
            input: 0,
            output: 0,
            cache_read: 0,
            cache_write: 0,
            cost: 0
          }

          // Check if this is a task or execute_agent tool
          if (toolPart.tool === 'task' || toolPart.tool === 'execute_agent') {
            // For task tool: extract sessionId from metadata and fetch the nested session
            // The task tool doesn't return token data in output, only a session reference
            if (toolPart.tool === 'task' && state.metadata?.sessionId) {
              try {
                const nestedSessionId = state.metadata.sessionId
                const nestedMessagesResponse = await client.session.messages({
                  path: { id: nestedSessionId }
                })
                
                if (nestedMessagesResponse.data) {
                  // Aggregate tokens from all assistant messages in the nested session
                  for (const msg of nestedMessagesResponse.data) {
                    if (msg.info.role === 'assistant') {
                      const tokens = msg.info.tokens
                      nestedTokens.input += tokens.input || 0
                      nestedTokens.output += tokens.output || 0
                      nestedTokens.cache_read += tokens.cache?.read || 0
                      nestedTokens.cache_write += tokens.cache?.write || 0
                      nestedTokens.cost += msg.info.cost || 0
                    }
                  }
                }
              } catch (e) {
                // If we can't fetch the nested session, skip it
              }
            }
            
            // For execute_agent tool: extract token data from JSON output
            // The execute_agent tool returns structured token information in its output
            if (toolPart.tool === 'execute_agent' && state.output) {
              try {
                // Try to parse the tool output as JSON
                let outputData: any
                if (typeof state.output === 'string') {
                  outputData = JSON.parse(state.output)
                } else {
                  outputData = state.output
                }

                // If the output has token information, extract it
                if (outputData.tokens) {
                  nestedTokens.input += outputData.tokens.input_tokens || 0
                  nestedTokens.output += outputData.tokens.output_tokens || 0
                  nestedTokens.cache_read += outputData.tokens.cache_read_tokens || 0
                  nestedTokens.cache_write += outputData.tokens.cache_write_tokens || 0
                  nestedTokens.cost += outputData.cost || 0
                }

                // Recursively check for nested tool uses
                if (outputData.tool_uses && Array.isArray(outputData.tool_uses)) {
                  for (const nestedTool of outputData.tool_uses) {
                    const deeperTokens = await extractNestedTokens(nestedTool)
                    nestedTokens.input += deeperTokens.input
                    nestedTokens.output += deeperTokens.output
                    nestedTokens.cache_read += deeperTokens.cache_read
                    nestedTokens.cache_write += deeperTokens.cache_write
                    nestedTokens.cost += deeperTokens.cost
                  }
                }
              } catch (e) {
                // If output is not JSON or doesn't have expected structure, skip
              }
            }
          }

          return nestedTokens
        }

        // Sum up nested tokens from all tool parts (now async)
        let nestedInput = 0
        let nestedOutput = 0
        let nestedCacheRead = 0
        let nestedCacheWrite = 0
        let nestedCost = 0

        for (const toolPart of allToolParts) {
          const nested = await extractNestedTokens(toolPart)
          nestedInput += nested.input
          nestedOutput += nested.output
          nestedCacheRead += nested.cache_read
          nestedCacheWrite += nested.cache_write
          nestedCost += nested.cost
        }

        // Add nested tokens to totals
        totalInput += nestedInput
        totalOutput += nestedOutput
        totalCacheRead += nestedCacheRead
        totalCacheWrite += nestedCacheWrite
        totalCost += nestedCost

        const apiTokens = totalInput + totalOutput
        const totalTokens = apiTokens + totalCacheRead + totalCacheWrite

        // Extract output text from the last assistant message
        const outputParts = lastMessage.parts.filter(p => p.type === 'text')
        const output = outputParts.map(p => p.text).join('\n')

        result.output = output
        result.tokens = {
          input_tokens: totalInput,
          output_tokens: totalOutput,
          cache_read_tokens: totalCacheRead,
          cache_write_tokens: totalCacheWrite,
          api_tokens: apiTokens,
          total_tokens: totalTokens,
          // Include breakdown of nested vs direct tokens
          nested_tokens: {
            input: nestedInput,
            output: nestedOutput,
            cache_read: nestedCacheRead,
            cache_write: nestedCacheWrite,
            api_tokens: nestedInput + nestedOutput,
            cost: nestedCost
          }
        }
        result.steps = allToolParts.length
        result.cost = totalCost
        result.tool_uses = allToolParts.map(t => {
          const toolData: any = {
            name: t.tool,
            status: t.state.status,
            call_id: t.callID
          }

          // Access state properties that exist on all state types
          const state: any = t.state

          // Include input parameters if available
          if (state.input !== undefined) {
            toolData.input = state.input
          }

          // Include execution time if available
          if (state.time !== undefined) {
            const duration = state.time.end - state.time.start
            toolData.execution_time_ms = duration
          }

          // Include output summary (not full output to avoid huge JSON)
          if (state.output !== undefined) {
            const output = state.output
            if (typeof output === 'string') {
              // Truncate long outputs for summary
              toolData.output_length = output.length
              toolData.output_preview = output.substring(0, 200) + (output.length > 200 ? '...' : '')
            } else {
              toolData.output_type = typeof output
            }
          }

          // Include metadata if available
          if (state.metadata !== undefined) {
            toolData.metadata = state.metadata
          }

          return toolData
        })
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

      // Add note about session preservation for inspection
      result._note = `Session preserved for inspection. Use export_session tool with session_id: ${sessionId}`

      // Clean up server (but keep session for inspection)
      await server.close()

      return JSON.stringify(result, null, 2)

    } catch (error) {
      // Clean up server on error (session preserved for debugging)
      await server.close()

      // Include session ID in error for debugging
      const errorMsg = sessionId
        ? `Agent test failed: ${error.message} (session_id: ${sessionId} preserved for inspection)`
        : `Agent test failed: ${error.message}`

      throw new Error(errorMsg)
    }
  }
})
