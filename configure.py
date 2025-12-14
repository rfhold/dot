from pyinfra.context import host
from pyinfra.operations import files, brew, pacman, git
from pyinfra.facts.files import FindFiles, FindDirectories
from pyinfra.facts.server import Home, Os
from pyinfra_fisher import operations as fisher

# -----------------------------------------------------------------------------
# Package definitions
# -----------------------------------------------------------------------------

PACKAGES = {
    "unwanted": {
        "brew": ["rust", "rustup", "uv"],
        "pacman": ["rust", "rustup", "uv"],
    },
    "dev": {
        "brew": ["go", "bun", "zig"],
        "pacman": ["go", "zig"],  # bun via AUR or npm
    },
    "gpg": {
        "brew": ["gnupg", "pinentry-mac"],
        "pacman": ["gnupg", "pinentry"],
    },
    "terminal": {
        "brew": ["fish", "starship", "fisher", "tmux", "neovim", "ripgrep", "fd", "fzf", "gum"],
        "pacman": ["fish", "starship", "fisher", "tmux", "neovim", "ripgrep", "fd", "fzf", "gum"],
    },
    "tools": {
        "brew": ["k9s", "pulumi", "gh", "lazygit", "lazydocker", "argon2"],
        "pacman": ["k9s", "github-cli", "lazygit", "lazydocker", "argon2"],  # pulumi via AUR
    },
}

CASKS = ["ghostty", "slack", "spotify", "obsidian", "linearmouse", "bitwarden"]

BREW_TAPS = ["oven-sh/bun", "pulumi/tap"]

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def link_config_dir(source, target):
    paths = host.get_fact(FindFiles, path=source, maxdepth=1)
    paths.extend(host.get_fact(FindDirectories, path=source, maxdepth=1))

    for path in paths:
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


def install_packages(name, key, present=True):
    pkgs = PACKAGES.get(key, {}).get(pkg_manager)
    if not pkgs:
        return

    if pkg_manager == "brew":
        brew.packages(name=name, packages=pkgs, present=present)
    elif pkg_manager == "pacman":
        pacman.packages(name=name, packages=pkgs, present=present, _sudo=True)


# -----------------------------------------------------------------------------
# Detect OS and package manager
# -----------------------------------------------------------------------------

os_name = host.get_fact(Os)

if os_name == "Darwin":
    pkg_manager = "brew"
elif os_name == "Linux":
    pkg_manager = "pacman"  # Assuming Arch
else:
    raise Exception(f"Unsupported OS: {os_name}")

home = host.get_fact(Home)

# -----------------------------------------------------------------------------
# Symlink configs
# -----------------------------------------------------------------------------

link_config_dir(f"{home}/dot/.config", f"{home}/.config")
link_config_dir(f"{home}/dot/home", home)

# -----------------------------------------------------------------------------
# Package management
# -----------------------------------------------------------------------------

install_packages("Remove unwanted packages", "unwanted", present=False)

# Brew taps (macOS only)
if pkg_manager == "brew":
    for tap in BREW_TAPS:
        brew.tap(name=f"Add {tap} tap", src=tap)

install_packages("Install dev packages", "dev")
install_packages("Install GPG packages", "gpg")
install_packages("Install terminal packages", "terminal")
install_packages("Install tools", "tools")

# GUI apps (macOS only)
if pkg_manager == "brew":
    brew.casks(name="Install GUI applications", casks=CASKS)

# -----------------------------------------------------------------------------
# Tmux Plugin Manager (TPM)
# -----------------------------------------------------------------------------

files.directory(
    name="Ensure tmux plugins directory exists",
    path=f"{home}/.tmux/plugins",
    present=True,
)

git.repo(
    name="Clone Tmux Plugin Manager (TPM)",
    src="https://github.com/tmux-plugins/tpm",
    dest=f"{home}/.tmux/plugins/tpm",
)

# -----------------------------------------------------------------------------
# Fish plugins
# -----------------------------------------------------------------------------

fisher.packages(
    name="Install Fish plugins",
    packages=[
        "jorgebucaran/fisher",
        "realiserad/fish-ai",
    ],
    present=True,
)
