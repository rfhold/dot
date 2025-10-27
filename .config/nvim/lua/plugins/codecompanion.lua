return {
  "olimorris/codecompanion.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-treesitter/nvim-treesitter",
  },
  opts = {
    adapters = {
      -- Custom OpenCode ACP adapter (uses model from ~/.config/opencode/config.json)
      acp = {
        opts = {
          show_defaults = true, -- Show built-in ACP agents (claude_code, etc.)
        },
        opencode = {
          name = "opencode",
          formatted_name = "OpenCode",
          type = "acp",
          roles = {
            llm = "assistant",
            user = "user",
          },
          opts = {
            vision = true,
          },

          -- Command to start OpenCode ACP server
          -- Model is configured in ~/.config/opencode/config.json
          -- Note: OpenCode ACP will use Neovim's current working directory automatically
          commands = {
            default = {
              "opencode",
              "acp",
            },
          },

          -- Defaults for the adapter
          defaults = {
            -- IMPORTANT: Force mcpServers to be JSON array, not object
            -- Using vim.empty_dict() would make it {}, but we need []
            -- Setting to vim.NIL or using setmetatable forces array encoding
            mcpServers = setmetatable({}, { __jsontype = "array" }),
            -- Increased timeout: OpenCode initialization can take 10-20 seconds
            timeout = 30000,
          },

          -- Environment variables (OpenCode uses auth from ~/.local/share/opencode/auth.json)
          env = {},

          parameters = {
            protocolVersion = 1,
            clientCapabilities = {
              fs = { readTextFile = true, writeTextFile = true },
            },
            clientInfo = {
              name = "CodeCompanion.nvim",
              version = "1.0.0",
            },
          },

          handlers = {
            setup = function(self)
              return true
            end,

            -- OpenCode handles auth via ~/.local/share/opencode/auth.json
            -- Returning true skips the authenticate RPC call
            auth = function(self)
              return true
            end,

            form_messages = function(self, messages, capabilities)
              local helpers = require("codecompanion.adapters.acp.helpers")
              return helpers.form_messages(self, messages, capabilities)
            end,

            on_exit = function(self, code)
            end,
          },
        },
      },

      -- Keep HTTP adapters available
      http = {
        opts = {
          show_defaults = true, -- Show Anthropic, OpenAI, etc.
        },
        -- Homelab Qwen3 Coder HTTP adapter (for inline strategy)
        qwen3_homelab = function()
          return require("codecompanion.adapters").extend("openai", {
            name = "qwen3_homelab",
            formatted_name = "Qwen3 Homelab",
            env = {
              url = "https://qwen3-coder.holdenitdown.net/v1",
              api_key = "dummy", -- OpenAI-compatible endpoints often don't require a real key
            },
            url = "${url}/chat/completions",
            headers = {
              ["Content-Type"] = "application/json",
            },
            schema = {
              model = {
                default = "Qwen/Qwen3-Coder-30B-A3B-Instruct-FP8",
              },
              temperature = {
                default = 0.7,
              },
              top_p = {
                default = 0.8,
              },
              repetition_penalty = {
                default = 1.05,
              },
            },
          })
        end,
      },
    },

    -- Default strategy configuration
    strategies = {
      chat = {
        adapter = "opencode", -- Use OpenCode ACP as default
      },
      -- Note: ACP adapters like OpenCode don't support the inline strategy
      -- Using homelab Qwen3 HTTP adapter for inline editing
      inline = {
        adapter = "qwen3_homelab",
      },
    },

    -- Display configuration
    display = {
      chat = {
        window = {
          layout = "vertical", -- or "horizontal", "float"
          width = 0.45,
          height = 0.85,
        },
      },
      diff = {
        provider = "mini_diff", -- Use mini.diff for displaying changes
      },
    },

    -- General options
    opts = {
      log_level = "DEBUG", -- Debug mode to troubleshoot ACP connection
    },
  },
}
