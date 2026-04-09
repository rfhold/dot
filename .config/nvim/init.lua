vim.opt.termguicolors = true

require("config.lazy")
require("config.keymap")
require("config.display")
require("config.treesitter")

-- system
vim.opt.clipboard = "unnamedplus"

-- spacing
vim.opt.list = true
vim.opt.listchars = { tab = "  ", trail = "·", nbsp = "+" }
vim.opt.expandtab = true
vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2
vim.opt.smartindent = true

-- display
-- line numbers
vim.wo.number = true
