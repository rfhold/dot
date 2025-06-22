return {
	{
		"mason-org/mason-lspconfig.nvim",
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
		dependencies = {
			{ "mason-org/mason.nvim", opts = {} },
			"neovim/nvim-lspconfig",
		},
	},
}
