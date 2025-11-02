import { tool } from "@opencode-ai/plugin"
import { createOpencode } from "@opencode-ai/sdk"

export default tool({
  description: "List OpenCode sessions with their IDs, titles, and metadata",
  args: {},
  async execute() {
    // Use port 0 to let the OS assign a random available port
    const { client, server } = await createOpencode({ port: 0 })
    
    try {
      // List sessions
      const response = await client.session.list({})
      
      if (!response.data) {
        throw new Error("Failed to retrieve sessions")
      }
      
      const sessions = response.data
      
      // Format session information
      const sessionList = sessions.map(session => ({
        id: session.id,
        title: session.title,
        created_at: session.time.created,
        updated_at: session.time.updated,
        directory: session.directory,
        has_parent: !!session.parentID,
        parent_id: session.parentID
      }))
      
      const result = {
        total: sessionList.length,
        sessions: sessionList
      }
      
      server.close()
      
      return JSON.stringify(result, null, 2)
      
    } catch (error) {
      server.close()
      throw new Error(`Failed to list sessions: ${error.message}`)
    }
  }
})
