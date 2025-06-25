-- Basic LSP keybindings
vim.keymap.set('n', '<leader>ca', vim.lsp.buf.code_action, { desc = 'Code actions' })
vim.keymap.set('n', '<leader>cr', vim.lsp.buf.rename, { desc = 'Rename' })
-- vim.keymap.set('n', '<leader>gr', function() MiniExtra.pickers.lsp({ scope = 'references' }) end, { desc = 'Goto references' })
vim.keymap.set('n', '<leader>gr', '<cmd>Telescope lsp_references<cr>', { desc = 'Goto references' })
-- vim.keymap.set('n', '<leader>gi', function() MiniExtra.pickers.lsp({ scope = 'implementation' }) end, { desc = 'Goto implementation' })
vim.keymap.set('n', '<leader>gi', '<cmd>Telescope lsp_implementations<cr>', { desc = 'Goto implementation' })
-- vim.keymap.set('n', '<leader>gd', function() MiniExtra.pickers.lsp({ scope = 'definition' }) end, { desc = 'Goto definition' })
vim.keymap.set('n', '<leader>gd', '<cmd>Telescope lsp_definitions<cr>', { desc = 'Goto definition' })

-- Additional useful LSP keybindings
-- vim.keymap.set('n', '<leader>gt', function() MiniExtra.pickers.lsp({ scope = 'type_definition' }) end, { desc = 'Goto type definition' })
vim.keymap.set('n', '<leader>gt', '<cmd>Telescope lsp_type_definitions<cr>', { desc = 'Goto type definition' })
-- vim.keymap.set('n', '<leader>gD', function() MiniExtra.pickers.lsp({ scope = 'declaration' }) end, { desc = 'Goto declaration' })
vim.keymap.set('n', '<leader>gD', '<cmd>Telescope lsp_declarations<cr>', { desc = 'Goto declaration' })
-- vim.keymap.set('n', '<leader>ds', function() MiniExtra.pickers.lsp({ scope = 'document_symbol' }) end, { desc = 'Document symbols' })
vim.keymap.set('n', '<leader>ds', '<cmd>Telescope lsp_document_symbols<cr>', { desc = 'Document symbols' })
-- vim.keymap.set('n', '<leader>ws', function() MiniExtra.pickers.lsp({ scope = 'workspace_symbol' }) end, { desc = 'Workspace symbols' })
vim.keymap.set('n', '<leader>ws', '<cmd>Telescope lsp_workspace_symbols<cr>', { desc = 'Workspace symbols' })

-- Navigation
vim.keymap.set('n', '<leader>ff', '<cmd>Telescope find_files<cr>', { desc = 'Find files' })
vim.keymap.set('n', '<leader>fg', '<cmd>Telescope live_grep<cr>', { desc = 'Live grep' })
vim.keymap.set('n', '<leader>fb', '<cmd>Telescope buffers<cr>', { desc = 'Find buffers' })
vim.keymap.set('n', '<leader>fh', '<cmd>Telescope help_tags<cr>', { desc = 'Find help tags' })
vim.keymap.set('n', '<leader>fc', '<cmd>Telescope commands<cr>', { desc = 'Find commands' })
vim.keymap.set('n', '<leader>fk', '<cmd>Telescope keymaps<cr>', { desc = 'Find keymaps' })

-- open the file explorer with <leader>e
vim.keymap.set("n", "<leader>e", function()
    require("mini.files").open(vim.fn.expand("%:p:h"))
end, { desc = "Open file explorer" })

-- Diagnostic keybindings
vim.keymap.set('n', '<leader>dd', function() MiniExtra.pickers.diagnostic({ scope = 'current' }) end, { desc = 'Buffer diagnostics' })
-- vim.keymap.set('n', '<leader>dD', function() MiniExtra.pickers.diagnostic({ scope = 'all' }) end, { desc = 'All diagnostics' })
vim.keymap.set('n', '<leader>dD', '<cmd>Telescope diagnostics<cr>', { desc = 'All diagnostics' })
vim.keymap.set('n', '[d', vim.diagnostic.goto_prev, { desc = 'Previous diagnostic' })
vim.keymap.set('n', ']d', vim.diagnostic.goto_next, { desc = 'Next diagnostic' })
vim.keymap.set('n', '<leader>dl', vim.diagnostic.open_float, { desc = 'Line diagnostics' })

-- Other useful mini.extra pickers
vim.keymap.set('n', '<leader>fo', MiniExtra.pickers.options, { desc = 'Find options' })
-- vim.keymap.set('n', '<leader>fm', MiniExtra.pickers.marks, { desc = 'Find marks' })
vim.keymap.set('n', '<leader>fm', "<cmd>Telescope marks<cr>", { desc = 'Find marks' })
vim.keymap.set('n', '<leader>fr', MiniExtra.pickers.registers, { desc = 'Find registers' })
-- vim.keymap.set('n', '<leader>ft', MiniExtra.pickers.treesitter, { desc = 'Find treesitter nodes' })
vim.keymap.set('n', '<leader>ft', "<cmd>Telescope treesitter<cr>", { desc = 'Find treesitter nodes' })

-- Git pickers (if you use git)
-- vim.keymap.set('n', '<leader>gb', MiniExtra.pickers.git_branches, { desc = 'Git branches' })
vim.keymap.set('n', '<leader>gb', '<cmd>Telescope git_branches<cr>', { desc = 'Git branches' })
-- vim.keymap.set('n', '<leader>gs', MiniExtra.pickers.git_status, { desc = 'Git status' })
vim.keymap.set('n', '<leader>gs', '<cmd>Telescope git_status<cr>', { desc = 'Git status' })
-- vim.keymap.set('n', '<leader>gl', MiniExtra.pickers.git_commits, { desc = 'Git log' })
vim.keymap.set('n', '<leader>gl', '<cmd>Telescope git_commits<cr>', { desc = 'Git log' })

-- History pickers
vim.keymap.set('n', '<leader>f:', function() MiniExtra.pickers.history({ scope = 'cmd' }) end, { desc = 'Command history' })
vim.keymap.set('n', '<leader>f/', function() MiniExtra.pickers.history({ scope = 'search' }) end, { desc = 'Search history' })

-- List pickers
-- vim.keymap.set('n', '<leader>lq', function() MiniExtra.pickers.list({ scope = 'quickfix' }) end, { desc = 'Quickfix list' })
vim.keymap.set('n', '<leader>lq', '<cmd>Telescope quickfix<cr>', { desc = 'Quickfix list' })
vim.keymap.set('n', '<leader>ll', function() MiniExtra.pickers.list({ scope = 'location' }) end, { desc = 'Location list' })
vim.keymap.set('n', '<leader>lj', function() MiniExtra.pickers.list({ scope = 'jump' }) end, { desc = 'Jump list' })
vim.keymap.set('n', '<leader>lc', function() MiniExtra.pickers.list({ scope = 'change' }) end, { desc = 'Change list' })

-- File explorer
vim.keymap.set('n', '<leader>fe', MiniExtra.pickers.explorer, { desc = 'File explorer' })

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

-- Lua code evaluation function
local function eval_lua_selection()
  -- Get visual selection
  local start_pos = vim.fn.getpos("'<")
  local end_pos = vim.fn.getpos("'>")
  local lines = vim.fn.getline(start_pos[2], end_pos[2])

  -- Handle partial line selection
  if #lines == 1 then
    lines[1] = string.sub(lines[1], start_pos[3], end_pos[3])
  elseif #lines > 1 then
    lines[1] = string.sub(lines[1], start_pos[3])
    lines[#lines] = string.sub(lines[#lines], 1, end_pos[3])
  end

  local code = table.concat(lines, '\n')

  -- Execute the code safely
  local func, err = loadstring(code)
  if func then
    local success, result = pcall(func)
    if success and result ~= nil then
      print(vim.inspect(result))
    elseif success then
      print("✓ Code executed successfully")
    else
      vim.notify("Runtime error: " .. tostring(result), vim.log.levels.ERROR)
    end
  else
    vim.notify("Syntax error: " .. tostring(err), vim.log.levels.ERROR)
  end
end

-- Lua evaluation keybind for visual mode
vim.keymap.set("v", "<leader>el", eval_lua_selection, { noremap = true, silent = true, desc = "Evaluate Lua selection" })

