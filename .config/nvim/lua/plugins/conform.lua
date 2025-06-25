return {
  'stevearc/conform.nvim',
  opts = {
    formatters_by_ft = {
      javascript = { "prettierd", "prettier", stop_after_first = true },
    },
    format_after_save = {
      -- These options will be passed to conform.format()
      timeout_ms = 500,
      lsp_format = "fallback",
    },
  },
}
