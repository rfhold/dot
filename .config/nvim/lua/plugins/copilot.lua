return {
  "zbirenbaum/copilot.lua",
  cmd = "Copilot",
  event = "InsertEnter",
  opts = {
    suggestion = {
      enabled = true,
      auto_trigger = true,
      debounce = 75,
      keymap = {
        accept = "<M-l>",
        accept_word = "<M-;>",
        accept_line = "<M-'>",
        next = "<M-]>",
        prev = "<M-[>",
        dismiss = "<C-]>",
      },
    },
    panel = { enabled = false },
    filetypes = {
      markdown = true,
      help = true,
      go = true,
      rust = true,
      typescript = true,
      javascript = true,
      yaml = true,
      json = true,
      toml = true,
      lua = true,
      vim = true,
      shell = true,
      python = true,
      ruby = true,
      php = true,
      html = true,
      css = true,
    },
  },
  config = function()
    require("copilot").setup({})
  end,
}
