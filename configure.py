from pyinfra.context import host
from pyinfra.operations import files, brew
from pyinfra.facts.files import FindFiles, FindDirectories
from pyinfra.facts.server import Home

def link_config_dir(source, target):
    paths = host.get_fact(FindFiles, path=source, maxdepth=1)
    paths.extend(host.get_fact(FindDirectories, path=source, maxdepth=1))

    for path in paths:
        # filter out the source directory itself
        if path == source:
            continue

        dst = path.replace(source, "", 1).lstrip("/")
        files.link(
            name=f"Link {target}/{dst}",
            path=f"{target}/{dst}",
            target=f"{source}/{dst}",
            force=True,
            force_backup=True,
        )

home = host.get_fact(Home)

link_config_dir(f"{home}/dot/.config", f"{home}/.config")
link_config_dir(f"{home}/dot/home", home)

brew.packages(
    name="Remove unwanted packages",
    packages=[
        "rust", # Managed by rustup
        "rustup", # Installed via the install script
        "uv", # Installed via the install script
    ],
    present=False,
)

brew.tap(
    name="Add oven-sh/bun tap",
    src="oven-sh/bun", # bun
)

brew.packages(
    name="Install dev packages",
    packages=[
        "go",
        "bun", # JavaScript runtime
    ],
)

brew.packages(
    name="Install GPG packages",
    packages=[
        "gnupg", # GPG
        "pinentry-mac", # GPG passphrase entry
    ],
)

brew.packages(
    name="Install terminal packages",
    packages=[
        "fish", # shell
        "starship", # shell prompt
        "fisher", # fish plugin manager
        "tmux", # terminal multiplexer
        "neovim", # text editor
        "ripgrep", # search tool
        "gum", # shell scripts
    ],
)

brew.tap(
    name="Add pulumi/tap tap",
    src="pulumi/tap", # pulumi
)

brew.packages(
    name="Install tools",
    packages=[
        "k9s", # Kubernetes TUI
        "pulumi", # IaC
        "gh", # GitHub CLI
        "lazygit", # Git TUI
        "lazydocker", # Docker TUI
    ],
)

brew.casks(
    name="Install GUI applications",
    casks=[
        "alacritty", # terminal
        "slack", # communication tool
        "spotify", # music streaming
        "obsidian", # note-taking app
        "linearmouse", # mouse customization
        "bitwarden", # password manager
    ],
)
