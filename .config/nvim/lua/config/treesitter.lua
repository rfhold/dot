-- Built-in Neovim treesitter configuration.
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "bash", "lua", "markdown", "go", "rust", "toml" },
  callback = function()
    vim.treesitter.start()
  end,
})

vim.opt.foldmethod = "expr"
vim.opt.foldexpr = "v:lua.vim.treesitter.foldexpr()"
vim.opt.foldlevel = 99
vim.opt.foldlevelstart = 99
