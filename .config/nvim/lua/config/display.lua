-- Show diagnostic text in buffer
vim.diagnostic.config({ virtual_text = true })

-- Configure diagnostic floating windows with borders
vim.diagnostic.config({
  float = {
    border = "rounded",  -- Options: "none", "single", "double", "rounded", "solid", "shadow"
    -- You can also customize other float options:
    -- header = "Diagnostics",
    -- source = "if_many",  -- Show source if multiple sources
    -- focusable = false,
  }
})

vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(
  vim.lsp.handlers.hover, {
    border = "rounded"
  }
)

vim.lsp.handlers["textDocument/signatureHelp"] = vim.lsp.with(
  vim.lsp.handlers.signature_help, {
    border = "rounded"
  }
)

