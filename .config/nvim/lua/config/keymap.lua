-- Basic LSP keybindings
vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, { desc = 'Code actions' })
vim.keymap.set('n', '<leader>cr', vim.lsp.buf.rename, { desc = 'Rename' })
vim.keymap.set('n', '<leader>gr', function() MiniExtra.pickers.lsp({ scope = 'references' }) end, { desc = 'Goto references' })
vim.keymap.set('n', '<leader>gi', function() MiniExtra.pickers.lsp({ scope = 'implementation' }) end, { desc = 'Goto implementation' })
vim.keymap.set('n', '<leader>gd', function() MiniExtra.pickers.lsp({ scope = 'definition' }) end, { desc = 'Goto definition' })

-- Additional useful LSP keybindings
vim.keymap.set('n', '<leader>gt', function() MiniExtra.pickers.lsp({ scope = 'type_definition' }) end, { desc = 'Goto type definition' })
vim.keymap.set('n', '<leader>gD', function() MiniExtra.pickers.lsp({ scope = 'declaration' }) end, { desc = 'Goto declaration' })
vim.keymap.set('n', '<leader>ds', function() MiniExtra.pickers.lsp({ scope = 'document_symbol' }) end, { desc = 'Document symbols' })
vim.keymap.set('n', '<leader>ws', function() MiniExtra.pickers.lsp({ scope = 'workspace_symbol' }) end, { desc = 'Workspace symbols' })

-- Diagnostic keybindings
vim.keymap.set('n', '<leader>dd', function() MiniExtra.pickers.diagnostic({ scope = 'current' }) end, { desc = 'Buffer diagnostics' })
vim.keymap.set('n', '<leader>dD', function() MiniExtra.pickers.diagnostic({ scope = 'all' }) end, { desc = 'All diagnostics' })
vim.keymap.set('n', '[d', vim.diagnostic.goto_prev, { desc = 'Previous diagnostic' })
vim.keymap.set('n', ']d', vim.diagnostic.goto_next, { desc = 'Next diagnostic' })
vim.keymap.set('n', '<leader>dl', vim.diagnostic.open_float, { desc = 'Line diagnostics' })

-- Other useful mini.extra pickers
vim.keymap.set('n', '<leader>fb', MiniExtra.pickers.buf_lines, { desc = 'Find in buffers' })
vim.keymap.set('n', '<leader>fh', MiniExtra.pickers.hl_groups, { desc = 'Find highlight groups' })
vim.keymap.set('n', '<leader>fk', MiniExtra.pickers.keymaps, { desc = 'Find keymaps' })
vim.keymap.set('n', '<leader>fo', MiniExtra.pickers.options, { desc = 'Find options' })
vim.keymap.set('n', '<leader>fc', MiniExtra.pickers.commands, { desc = 'Find commands' })
vim.keymap.set('n', '<leader>fm', MiniExtra.pickers.marks, { desc = 'Find marks' })
vim.keymap.set('n', '<leader>fr', MiniExtra.pickers.registers, { desc = 'Find registers' })
vim.keymap.set('n', '<leader>ft', MiniExtra.pickers.treesitter, { desc = 'Find treesitter nodes' })

-- Git pickers (if you use git)
vim.keymap.set('n', '<leader>gb', MiniExtra.pickers.git_branches, { desc = 'Git branches' })
vim.keymap.set('n', '<leader>gc', MiniExtra.pickers.git_commits, { desc = 'Git commits' })
vim.keymap.set('n', '<leader>gf', MiniExtra.pickers.git_files, { desc = 'Git files' })
vim.keymap.set('n', '<leader>gh', MiniExtra.pickers.git_hunks, { desc = 'Git hunks' })

-- History pickers
vim.keymap.set('n', '<leader>f:', function() MiniExtra.pickers.history({ scope = 'cmd' }) end, { desc = 'Command history' })
vim.keymap.set('n', '<leader>f/', function() MiniExtra.pickers.history({ scope = 'search' }) end, { desc = 'Search history' })

-- List pickers
vim.keymap.set('n', '<leader>lq', function() MiniExtra.pickers.list({ scope = 'quickfix' }) end, { desc = 'Quickfix list' })
vim.keymap.set('n', '<leader>ll', function() MiniExtra.pickers.list({ scope = 'location' }) end, { desc = 'Location list' })
vim.keymap.set('n', '<leader>lj', function() MiniExtra.pickers.list({ scope = 'jump' }) end, { desc = 'Jump list' })
vim.keymap.set('n', '<leader>lc', function() MiniExtra.pickers.list({ scope = 'change' }) end, { desc = 'Change list' })

-- File explorer
vim.keymap.set('n', '<leader>fe', MiniExtra.pickers.explorer, { desc = 'File explorer' })

-- Visit paths (if you use mini.visits)
vim.keymap.set('n', '<leader>fv', function()
  local ok, _ = pcall(require, 'mini.visits')
  if ok then
    MiniExtra.pickers.visit_paths()
  else
    vim.notify('mini.visits not installed', vim.log.levels.WARN)
  end
end, { desc = 'Visit paths' })

-- Additional LSP functionality without mini.extra
vim.keymap.set('n', 'K', vim.lsp.buf.hover, { desc = 'Hover documentation' })
vim.keymap.set('n', '<leader>sh', vim.lsp.buf.signature_help, { desc = 'Signature help' })
vim.keymap.set('i', '<C-k>', vim.lsp.buf.signature_help, { desc = 'Signature help' })

-- Format
vim.keymap.set({ 'n', 'v' }, '<leader>cf', vim.lsp.buf.format, { desc = 'Format' })

-- Action Palette (launch actions) - works in both normal and visual mode
vim.keymap.set({ "n", "v" }, "<C-a>", "<cmd>CodeCompanionActions<cr>", { noremap = true, silent = true, desc = "Action Palette" })

-- Chat Toggle - works in both normal and visual mode
vim.keymap.set({ "n", "v" }, "<leader>a", "<cmd>CodeCompanionChat Toggle<cr>", { noremap = true, silent = true, desc = "Chat Toggle" })

