import { tool } from "@opencode-ai/plugin"
import { createOpencode } from "@opencode-ai/sdk"

export default tool({
  description: "Export complete session details including all messages, tool uses, and metadata",
  args: {
    session_id: tool.schema.string().describe("ID of the session to export (e.g., 'ses_5bdea460dffei6gMMYvZZcrJ91')"),
    include_tool_results: tool.schema.boolean().optional().describe("Include synthetic tool result parts (default: false for readability)"),
  },
  async execute(args) {
    // Use port 0 to let the OS assign a random available port
    const { client, server } = await createOpencode({ port: 0 })
    
    try {
      // Get session list to find the session
      const sessionListResponse = await client.session.list({})
      
      if (!sessionListResponse.data) {
        throw new Error("Failed to retrieve sessions")
      }
      
      const session = sessionListResponse.data.find(s => s.id === args.session_id)
      
      if (!session) {
        throw new Error(`Session not found: ${args.session_id}`)
      }
      
      // Get all messages in the session
      const messagesResponse = await client.session.messages({
        path: { id: args.session_id }
      })
      
      if (!messagesResponse.data) {
        throw new Error("Failed to retrieve session messages")
      }
      
      const messages = messagesResponse.data
      const includeToolResults = args.include_tool_results === true
      
      // Format messages with detailed information
      const formattedMessages = messages.map((message, index) => {
        const messageData: any = {
          index: index,
          id: message.info.id,
          role: message.info.role,
          timestamp: message.info.time.created
        }
        
        // Add token information if available (assistant messages)
        if (message.info.role === 'assistant' && message.info.tokens) {
          const tokens = message.info.tokens
          const cacheRead = tokens.cache?.read || 0
          const cacheWrite = tokens.cache?.write || 0
          messageData.tokens = {
            input: tokens.input,
            output: tokens.output,
            cache_read: cacheRead,
            cache_write: cacheWrite,
            api_tokens: tokens.input + tokens.output,
            total_tokens: tokens.input + tokens.output + cacheRead + cacheWrite
          }
          messageData.cost = message.info.cost
        }
        
        // Extract parts with filtering for readability
        const parts = message.parts.map(part => {
          const partData: any = {
            id: part.id,
            type: part.type
          }
          
          // Handle different part types
          if (part.type === 'text') {
            partData.text = part.text
            partData.is_synthetic = part.synthetic || false
          } else if (part.type === 'tool') {
            partData.tool = part.tool
            partData.status = part.state.status
            // Note: input and result are not available in the ToolPart type
            // They would need to be accessed differently or might not be exposed
          } else if (part.type === 'file') {
            partData.filename = part.filename
            partData.mime = part.mime
            partData.url = part.url
          }
          
          return partData
        })
        
        // Filter out synthetic parts if not requested (these are tool result echoes)
        messageData.parts = includeToolResults 
          ? parts 
          : parts.filter(p => !(p.type === 'text' && p.is_synthetic))
        
        return messageData
      })
      
      // Build complete session export
      const exportData = {
        session: {
          id: session.id,
          title: session.title,
          directory: session.directory,
          created_at: session.time.created,
          updated_at: session.time.updated,
          has_parent: !!session.parentID,
          parent_id: session.parentID,
          version: session.version
        },
        summary: session.summary,
        messages: formattedMessages,
        statistics: {
          total_messages: formattedMessages.length,
          user_messages: formattedMessages.filter(m => m.role === 'user').length,
          assistant_messages: formattedMessages.filter(m => m.role === 'assistant').length,
          total_tool_uses: formattedMessages.reduce((sum, m) => {
            return sum + m.parts.filter((p: any) => p.type === 'tool').length
          }, 0),
          total_cost: formattedMessages.reduce((sum, m) => sum + (m.cost || 0), 0)
        }
      }
      
      server.close()
      
      return JSON.stringify(exportData, null, 2)
      
    } catch (error) {
      server.close()
      throw new Error(`Failed to export session: ${error.message}`)
    }
  }
})
