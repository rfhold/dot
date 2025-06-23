return {
  {
    "mason-lspconfig.nvim",
    dependencies = {
      {
        "mason-org/mason.nvim",
        opts = {
          ui = {
            border = "rounded",
            icons = {
              package_installed = "✓",
              package_pending = "➜",
              package_uninstalled = "✗",
            },
          },
        }
      },
      "neovim/nvim-lspconfig",
    },
    opts = {
      ensure_installed = {
        "bashls",
        "gopls",
        "jsonls",
        "pyright",
        "sqlls",
        "ts_ls",
        "cssls",
        "yamlls",
        "lua_ls",
        "rust_analyzer",
      },
      automatic_enable = true,
    },
  },
}
