return {
  "ravitemer/mcphub.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  build = "bundled_build.lua", -- Bundles `mcp-hub` binary along with the neovim plugin
  config = function()
    require("mcphub").setup({
      use_bundled_binary = true,                             -- Use local `mcp-hub` binary
      auto_approve = false,                                  -- Auto approve mcp tool calls
      auto_toggle_mcp_servers = true,                        -- Let LLMs start and stop MCP servers automatically

      config = vim.fn.expand("~/.config/.mcphub/servers.json"), -- Config file path

      native_servers = {},                                   -- add your native servers here
      extensions = {
        codecompanion = {
          show_result_in_chat = true,                               -- Show tool results in chat
          make_vars = true,                                         -- Create chat variables from resources
          make_slash_commands = true,                               -- make /slash_commands from MCP server prompts
        },
      },
    })
  end,
}
