require("config.lazy")

vim.opt.clipboard = "unnamedplus"

-- Tab visualization and indentation settings
vim.opt.list = true
vim.opt.listchars = { tab = "  ", trail = "·", nbsp = "+" }
vim.opt.expandtab = true
vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2
vim.opt.smartindent = true

-- Format on save using LSP
vim.api.nvim_create_autocmd("BufWritePre", {
  callback = function()
    vim.lsp.buf.format({ async = false })
  end,
})
