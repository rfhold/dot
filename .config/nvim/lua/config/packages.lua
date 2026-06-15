vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

vim.pack.add({
  { src = "https://github.com/stevearc/conform.nvim" },
  { src = "https://github.com/alexghergh/nvim-tmux-navigation" },
  { src = "https://github.com/OXY2DEV/markview.nvim" },
  { src = "https://github.com/echasnovski/mini.nvim" },
  { src = "https://github.com/nvim-lua/plenary.nvim" },
  { src = "https://github.com/nvim-telescope/telescope.nvim", version = "0.1.x" },
}, { load = true, confirm = false })

require("conform").setup({
  formatters_by_ft = {
    javascript = { "prettierd", "prettier", stop_after_first = true },
  },
  format_after_save = {
    timeout_ms = 500,
    lsp_format = "fallback",
  },
})

vim.lsp.enable({
  "bashls",
  "buf_ls",
  "clangd",
  "cssls",
  "dockerls",
  "gopls",
  "jsonls",
  "lua_ls",
  "pyright",
  "rust_analyzer",
  "sqlls",
  "ts_ls",
  "yamlls",
})

local nvim_tmux_nav = require("nvim-tmux-navigation")
nvim_tmux_nav.setup({
  disable_when_zoomed = true,
})
vim.keymap.set("n", "<C-h>", nvim_tmux_nav.NvimTmuxNavigateLeft)
vim.keymap.set("n", "<C-j>", nvim_tmux_nav.NvimTmuxNavigateDown)
vim.keymap.set("n", "<C-k>", nvim_tmux_nav.NvimTmuxNavigateUp)
vim.keymap.set("n", "<C-l>", nvim_tmux_nav.NvimTmuxNavigateRight)
vim.keymap.set("n", "<C-\\>", nvim_tmux_nav.NvimTmuxNavigateLastActive)
vim.keymap.set("n", "<C-Space>", nvim_tmux_nav.NvimTmuxNavigateNext)

require("markview").setup({
  preview = {
    filetypes = { "markdown", "codecompanion" },
    ignore_buftypes = {},
  },
})

require("plugins.mini").config()
