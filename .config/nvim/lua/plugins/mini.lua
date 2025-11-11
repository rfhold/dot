return {
  "echasnovski/mini.nvim",
  config = function()
    -- Better Around/Inside textobjects
    --
    -- Examples:
    --  - va)  - [V]isually select [A]round [)]paren
    --  - yinq - [Y]ank [I]nside [N]ext [']quote
    --  - ci'  - [C]hange [I]nside [']quote
    require("mini.ai").setup({ n_lines = 500 })

    -- Add/delete/replace surroundings (brackets, quotes, etc.)
    --
    -- - saiw) - [S]urround [A]dd [I]nner [W]ord [)]Paren
    -- - sd'   - [S]urround [D]elete [']quotes
    -- - sr)'  - [S]urround [R]eplace [)] [']
    require("mini.surround").setup()

    -- Comment toggling
    require("mini.comment").setup({
      options = {
        ignore_blank_line = true,
      },
    })

    local starter = require('mini.starter')

    -- Custom git status section
    local function git_status_section()
      return function()
        local handle = io.popen('git status --porcelain 2>/dev/null')
        if not handle then return {} end

        -- Get diff stats for line changes (unstaged changes)
        local diff_handle = io.popen('git diff --numstat 2>/dev/null')
        local diff_stats = {}
        if diff_handle then
          for line in diff_handle:lines() do
            local added, deleted, file = line:match("(%d+)%s+(%d+)%s+(.+)")
            if added and deleted and file then
              diff_stats[file] = { added = tonumber(added), deleted = tonumber(deleted) }
            end
          end
          diff_handle:close()
        end

        -- Get staged changes diff stats
        local staged_handle = io.popen('git diff --cached --numstat 2>/dev/null')
        if staged_handle then
          for line in staged_handle:lines() do
            local added, deleted, file = line:match("(%d+)%s+(%d+)%s+(.+)")
            if added and deleted and file then
              if diff_stats[file] then
                diff_stats[file].added = diff_stats[file].added + tonumber(added)
                diff_stats[file].deleted = diff_stats[file].deleted + tonumber(deleted)
              else
                diff_stats[file] = { added = tonumber(added), deleted = tonumber(deleted) }
              end
            end
          end
          staged_handle:close()
        end

        local files = {}
        for line in handle:lines() do
          if #files >= 10 then break end -- Limit to 10 files

          local status = line:sub(1, 2)
          local file = line:sub(4)

          local status_icon = ""
          -- Check the exact status codes
          if status == " M" or status == "MM" or status == "AM" or status == "M " then
            status_icon = "~"
          elseif status == "A " or status == "AM" then
            status_icon = "+"
          elseif status == "D " or status == "MD" then
            status_icon = "-"
          elseif status == "R " then
            status_icon = "→"
          elseif status == "??" then
            status_icon = "?"
          elseif status == "!!" then
            status_icon = "!"
          else
            status_icon = status:sub(2, 2) -- Fallback to second character
          end

          -- Handle renamed files
          if status:match('R') then
            local parts = {}
            for part in file:gmatch("[^%s]+") do
              table.insert(parts, part)
            end
            file = parts[2] or parts[1] or file
          end

          -- Add line change info if available
          local line_info = ""
          if diff_stats[file] then
            local stats = diff_stats[file]
            if stats.added > 0 or stats.deleted > 0 then
              line_info = string.format(" (+%d/-%d)", stats.added, stats.deleted)
            end
          end

          table.insert(files, {
            name = status_icon .. " " .. file .. line_info,
            action = "e " .. file,
            section = "Git Status"
          })
        end
        handle:close()
        return files
      end
    end

    starter.setup({
      evaluate_single = true,
      items = {
        starter.sections.builtin_actions(),
        starter.sections.recent_files(10, true),
        git_status_section(),
      },
      content_hooks = {
        starter.gen_hook.adding_bullet(),
        starter.gen_hook.indexing('all', { 'Builtin actions', 'Git Status' }),
        starter.gen_hook.padding(3, 2),
      },
    })

    -- Highlight patterns in code
    -- Examples:
    --  - Highlight standalone 'FIXME', 'HACK', 'TODO', 'NOTE'
    --	- Highlight hex color strings (`#rrggbb`) using that color

    local hipatterns = require("mini.hipatterns")

    hipatterns.setup({
      highlighters = {
        -- Highlight standalone 'FIXME', 'HACK', 'TODO', 'NOTE'
        fixme = { pattern = "%f[%w]()FIXME()%f[%W]", group = "MiniHipatternsFixme" },
        hack = { pattern = "%f[%w]()HACK()%f[%W]", group = "MiniHipatternsHack" },
        todo = { pattern = "%f[%w]()TODO()%f[%W]", group = "MiniHipatternsTodo" },
        note = { pattern = "%f[%w]()NOTE()%f[%W]", group = "MiniHipatternsNote" },

        -- Highlight hex color strings (`#rrggbb`) using that color
        hex_color = hipatterns.gen_highlighter.hex_color(),
      },
    })

    require("mini.git").setup()
    local diff = require("mini.diff")
    diff.setup({
      -- Disabled by default
      -- source = diff.gen_source.none(),
    })
    require("mini.icons").setup()
    require("mini.snippets").setup()

    -- require("mini.pairs").setup({
    --   -- In which modes mappings from this `config` should be created
    --   modes = { insert = true, command = false, terminal = false },

    --   -- Global mappings. Each right hand side should be a pair information, a
    --   -- table with at least these fields (see more in |MiniPairs.map|):
    --   -- - <action> - one of 'open', 'close', 'closeopen'.
    --   -- - <pair> - two character string for pair to be used.
    --   -- By default pair is not inserted after `\`, quotes are not recognized by
    --   -- <CR>, `'` does not insert pair after a letter.
    --   -- Only parts of tables can be tweaked (others will use these defaults).
    --   mappings = {
    --     ["("] = { action = "open", pair = "()", neigh_pattern = "[^\\]." },
    --     ["["] = { action = "open", pair = "[]", neigh_pattern = "[^\\]." },
    --     ["{"] = { action = "open", pair = "{}", neigh_pattern = "[^\\]." },

    --     [")"] = { action = "close", pair = "()", neigh_pattern = "[^\\]." },
    --     ["]"] = { action = "close", pair = "[]", neigh_pattern = "[^\\]." },
    --     ["}"] = { action = "close", pair = "{}", neigh_pattern = "[^\\]." },

    --     ['"'] = { action = "closeopen", pair = '""', neigh_pattern = "[^\\].", register = { cr = false } },
    --     ["'"] = { action = "closeopen", pair = "''", neigh_pattern = "[^%a\\].", register = { cr = false } },
    --     ["`"] = { action = "closeopen", pair = "``", neigh_pattern = "[^\\].", register = { cr = false } },
    --   },
    -- })

    require("mini.cursorword").setup({
      delay = 100,
    })

    require("mini.statusline").setup()

    require("mini.tabline").setup()

    local MiniPick = require("mini.pick")
    MiniPick.setup()

    -- Override vim.ui.select to use mini.pick
    vim.ui.select = MiniPick.ui_select

    require('mini.extra').setup()

    require("mini.files").setup({
      -- Customization of shown content
      content = {
        -- Predicate for which file system entries to show
        filter = nil,
        -- What prefix to show to the left of file system entry
        prefix = nil,
        -- In which order to show file system entries
        sort = nil,
      },

      -- Module mappings created only inside explorer.
      -- Use `''` (empty string) to not create one.
      mappings = {
        close = "q",
        go_in = "l",
        go_in_plus = "L",
        go_out = "h",
        go_out_plus = "H",
        mark_goto = "'",
        mark_set = "m",
        reset = "<BS>",
        reveal_cwd = "@",
        show_help = "g?",
        synchronize = "=",
        trim_left = "<",
        trim_right = ">",
      },

      -- General options
      options = {
        -- Whether to delete permanently or move into module-specific trash
        permanent_delete = false,
        -- Whether to use for editing directories
        use_as_default_explorer = true,
      },

      -- Customization of explorer windows
      windows = {
        -- Maximum number of windows to show side by side
        max_number = math.huge,
        -- Whether to show preview of file/directory under cursor
        preview = false,
        -- Width of focused window
        width_focus = 50,
        -- Width of non-focused window
        width_nofocus = 15,
        -- Width of preview window
        width_preview = 25,
      },
    })

    require("mini.completion").setup({
      window = {
        info = { border = 'single' },      -- Set border style for info float
        signature = { border = 'single' }, -- Set border for signature help
      }
    })

    require('mini.base16').setup({
      palette = {
        base00 = '#121212', -- Background
        base01 = '#121212', -- Lighter background (match main bg for line numbers)
        base02 = '#1f2937', -- Selection Background (dark gray)
        base03 = '#6b7280', -- Comments, Invisibles, Line Highlighting (medium gray)
        base04 = '#9ca3af', -- Dark Foreground (Used for status bars)
        base05 = '#d1d5db', -- Default Foreground, Caret, Delimiters, Operators (light gray)
        base06 = '#e5e7eb', -- Light Foreground
        base07 = '#f3f4f6', -- Light Background (Vars, Highlighted Code, Markdown Lists)
        base08 = '#f88a8a', -- Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted (light red)
        base09 = '#f472b6', -- Integers, Boolean, Constants, XML Attributes, Markup Link Url (hot pink)
        base0A = '#fbbf24', -- Classes, Constructors, Markup Bold, Search Text Background (yellow)
        base0B = '#6ee7b7', -- Strings, Inherited Class, Markup Code, Diff Added (emerald/green)
        base0C = '#c084fc', -- Support, Regular Expressions, Escape Characters, Markup Quotes (purple)
        base0D = '#7dd3fc', -- Functions, Methods, Attribute IDs, Headings (cyan)
        base0E = '#a78bfa', -- Keywords, Storage, Selector, Markup Italic, Diff Changed (purple)
        base0F = '#9ca3af', -- Deprecated, Opening/Closing Embedded Language Tags, Embedded Language Data (gray)
      },
      plugins = {
        default = true,
      },
    })
    vim.g.colors_name = 'minischeme'

    local MiniNotify = require("mini.notify")
    MiniNotify.setup()

    vim.notify = require('mini.notify').make_notify({ ERROR = { duration = 10000 } })

    local miniclue = require("mini.clue")
    miniclue.setup({
      triggers = {
        -- Leader triggers
        { mode = "n", keys = "<Leader>" },
        { mode = "x", keys = "<Leader>" },

        -- Built-in completion
        { mode = "i", keys = "<C-x>" },

        -- `g` key
        { mode = "n", keys = "g" },
        { mode = "x", keys = "g" },

        -- Marks
        { mode = "n", keys = "'" },
        { mode = "n", keys = "`" },
        { mode = "x", keys = "'" },
        { mode = "x", keys = "`" },

        -- Registers
        { mode = "n", keys = '"' },
        { mode = "x", keys = '"' },
        { mode = "i", keys = "<C-r>" },
        { mode = "c", keys = "<C-r>" },

        -- Window commands
        { mode = "n", keys = "<C-w>" },

        -- Navigation
        { mode = "n", keys = "[" },
        { mode = "n", keys = "]" },

        -- `z` key
        { mode = "n", keys = "z" },
        { mode = "x", keys = "z" },
      },

      clues = {
        -- Enhance this by adding descriptions for <Leader> mapping groups
        miniclue.gen_clues.builtin_completion(),
        miniclue.gen_clues.g(),
        miniclue.gen_clues.marks(),
        miniclue.gen_clues.registers(),
        miniclue.gen_clues.windows(),
        miniclue.gen_clues.z(),

      },
    })
  end,
}
