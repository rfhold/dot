import { tool } from "@opencode-ai/plugin"
import * as path from "path"
import * as fs from "fs/promises"

export default tool({
  description: "Programmatically execute another OpenCode tool by name with provided arguments. Use when you need to dynamically invoke tools or chain tool executions. Returns the output from the executed tool.",
  
  args: {
    toolName: tool.schema.string().describe(
      "Name of the tool file to execute (without .ts extension), located in .opencode/tool/ or .config/opencode/tool/ directories (e.g., 'echo_tool', 'execute_agent')"
    ),
    toolArgs: tool.schema.record(tool.schema.string(), tool.schema.any()).describe(
      "Arguments to pass to the tool as a key-value object. Must match the tool's expected argument schema (e.g., {message: 'hello'} for echo_tool)"
    ),
  },
  
  async execute(args, context) {
    const toolsDir = path.join(process.cwd(), '.config', 'opencode', 'tool')
    const toolPath = path.join(toolsDir, `${args.toolName}.ts`)
    
    try {
      // Verify the tool file exists before attempting import
      try {
        await fs.access(toolPath)
      } catch {
        // List available tools to help with debugging
        const availableTools = await fs.readdir(toolsDir)
        const tsTools = availableTools
          .filter(f => f.endsWith('.ts'))
          .map(f => f.replace('.ts', ''))
          .join(', ')
        
        throw new Error(
          `Tool '${args.toolName}' not found at ${toolPath}. Available tools: ${tsTools}`
        )
      }
      
      // Dynamically import the tool module
      // Using file:// protocol for cross-platform compatibility
      const toolModule = await import(`file://${toolPath}`)
      
      // Validate the imported module has a default export
      if (!toolModule.default) {
        throw new Error(
          `Tool '${args.toolName}' does not have a default export. Ensure the tool uses 'export default tool({...})'`
        )
      }
      
      const toolDefinition = toolModule.default
      
      // Validate the tool has an execute function
      if (typeof toolDefinition.execute !== 'function') {
        throw new Error(
          `Tool '${args.toolName}' does not have a valid execute function`
        )
      }
      
      // Validate the tool has an args schema
      if (!toolDefinition.args) {
        throw new Error(
          `Tool '${args.toolName}' does not have an args schema defined`
        )
      }
      
      // Validate toolArgs against the target tool's schema
      const argsSchema = tool.schema.object(toolDefinition.args)
      const validation = argsSchema.safeParse(args.toolArgs || {})
      
      if (!validation.success) {
        // Format validation errors with helpful context
        const errorDetails = validation.error.issues.map(err => {
          const path = err.path.join('.')
          return `  - ${path || 'root'}: ${err.message}`
        }).join('\n')
        
        // Show what was expected vs what was provided
        const expectedParams = Object.keys(toolDefinition.args)
        const providedParams = Object.keys(args.toolArgs || {})
        
        throw new Error(
          `Tool '${args.toolName}' parameter validation failed:\n` +
          `${errorDetails}\n\n` +
          `Expected parameters: ${expectedParams.join(', ')}\n` +
          `Provided parameters: ${providedParams.length > 0 ? providedParams.join(', ') : '(none)'}`
        )
      }
      
      // Create a mock ToolContext for the executed tool
      // Use the current context but mark it as coming from execute_tool
      const mockContext = {
        sessionID: context.sessionID || "execute_tool_session",
        messageID: context.messageID || "execute_tool_message",
        agent: `execute_tool->${args.toolName}`,
        abort: context.abort || new AbortController().signal,
      }
      
      // Execute the tool with validated arguments and mock context
      const result = await toolDefinition.execute(validation.data, mockContext)
      
      // Return the result (tools should return strings)
      return result
      
    } catch (error: any) {
      // Provide detailed error information
      if (error.message.includes('not found at')) {
        // Already a formatted "tool not found" error
        throw error
      } else if (error.code === 'ERR_MODULE_NOT_FOUND') {
        throw new Error(
          `Failed to import tool '${args.toolName}': Module dependencies not found. Error: ${error.message}`
        )
      } else if (error.message.includes('does not have')) {
        // Already a formatted validation error
        throw error
      } else {
        // Execution error from the tool itself
        throw new Error(
          `Tool '${args.toolName}' execution failed: ${error.message}`
        )
      }
    }
  }
})
