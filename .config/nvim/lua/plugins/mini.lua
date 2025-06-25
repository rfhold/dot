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

    require('mini.starter').setup()

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
      source = diff.gen_source.none(),
    })
    require("mini.icons").setup()
    require("mini.snippets").setup()

    require("mini.pairs").setup({
      -- In which modes mappings from this `config` should be created
      modes = { insert = true, command = false, terminal = false },

      -- Global mappings. Each right hand side should be a pair information, a
      -- table with at least these fields (see more in |MiniPairs.map|):
      -- - <action> - one of 'open', 'close', 'closeopen'.
      -- - <pair> - two character string for pair to be used.
      -- By default pair is not inserted after `\`, quotes are not recognized by
      -- <CR>, `'` does not insert pair after a letter.
      -- Only parts of tables can be tweaked (others will use these defaults).
      mappings = {
        ["("] = { action = "open", pair = "()", neigh_pattern = "[^\\]." },
        ["["] = { action = "open", pair = "[]", neigh_pattern = "[^\\]." },
        ["{"] = { action = "open", pair = "{}", neigh_pattern = "[^\\]." },

        [")"] = { action = "close", pair = "()", neigh_pattern = "[^\\]." },
        ["]"] = { action = "close", pair = "[]", neigh_pattern = "[^\\]." },
        ["}"] = { action = "close", pair = "{}", neigh_pattern = "[^\\]." },

        ['"'] = { action = "closeopen", pair = '""', neigh_pattern = "[^\\].", register = { cr = false } },
        ["'"] = { action = "closeopen", pair = "''", neigh_pattern = "[^%a\\].", register = { cr = false } },
        ["`"] = { action = "closeopen", pair = "``", neigh_pattern = "[^\\].", register = { cr = false } },
      },
    })

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
        base00 = '#1a1b26', -- Background
        base01 = '#1a1b26', -- Lighter background
        base02 = '#3a3b5a', -- Selection Background
        base03 = '#4a4b6a', -- Comments, Invisibles, Line Highlighting
        base04 = '#6a6b85', -- Dark Foreground (Used for status bars)
        base05 = '#c0caf5', -- Default Foreground, Caret, Delimiters, Operators
        base06 = '#abb2bf', -- Light Foreground (Not often used)
        base07 = '#e0e6ef', -- Light Background (Vars, Highlighted Code, Markdown Lists)
        base08 = '#f7768e', -- Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
        base09 = '#ff9e64', -- Integers, Boolean, Constants, XML Attributes, Markup Link Url
        base0A = '#e0af68', -- Classes, Constructors, Markup Bold, Search Text Background
        base0B = '#9ece6a', -- Strings, Inherited Class, Markup Code, Diff Added
        base0C = '#2ac3de', -- Support, Regular Expressions, Escape Characters, Markup Quotes
        base0D = '#7aa2f7', -- Functions, Methods, Attribute IDs, Headings
        base0E = '#bb9af7', -- Keywords, Storage, Selector, Markup Italic, Diff Changed
        base0F = '#cfc9ff', -- Deprecated, Opening/Closing Embedded Language Tags, Embedded Language Data
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
