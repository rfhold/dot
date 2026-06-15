-- Show diagnostic text in buffer
vim.diagnostic.config({ virtual_text = true })

-- Configure diagnostic floating windows with borders
vim.o.winborder = "rounded"

vim.diagnostic.config({
  float = {
    -- You can also customize other float options:
    -- header = "Diagnostics",
    -- source = "if_many",  -- Show source if multiple sources
    -- focusable = false,
  }
})
