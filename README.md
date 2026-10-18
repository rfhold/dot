# Dotfiles

A comprehensive dotfiles management system using PyInfra for automated setup and configuration of macOS and Arch Linux development environments.

## Overview

This repository contains dotfiles and configuration management for a complete development environment setup. It automates the installation and configuration of development tools, shell environments, and applications using PyInfra deployment automation.

## Quick Start

```bash
./bin/update.sh
```

This single command will:
1. Install Homebrew (if not present)
2. Install rustup (if not present) 
3. Install uv Python package manager (if not present)
4. Run the PyInfra deployment to configure your system

## How It Works

### Installation Process

1. **`/bin/update.sh`** - Bootstrap script that:
   - Installs Homebrew package manager
   - Installs rustup (Rust toolchain manager)
   - Installs uv (fast Python package manager)
   - Calls the install script

2. **`/bin/install.sh`** - Runs the PyInfra deployment:
   ```bash
   uv run pyinfra @local configure.py
   ```

3. **`configure.py`** - PyInfra deployment script that:
   - Links `.config/` directory to `~/.config/`
   - Links `home/` directory contents to `~/`
   - Installs and configures all development tools

### Directory Structure

- `.config/` - Configuration files that get linked to `~/.config/`
- `home/` - Files that get linked to your home directory (`~`)
- `bin/` - Installation and update scripts
- `configure.py` - PyInfra deployment configuration

## Installed Tools

### Development Tools
- **Go** - Programming language
- **Bun** - JavaScript runtime
- **Rust** (via rustup) - Systems programming language

### Terminal & Shell
- **Fish** - Modern shell with autocompletion
- **Starship** - Cross-shell prompt
- **Fisher** - Fish plugin manager
- **Tmux** - Terminal multiplexer
  - **TPM** (Tmux Plugin Manager) - Auto-installed for plugin management
  - **tmux-fzf** - Fuzzy finder for sessions, windows, panes (prefix + Ctrl-f)

### Text Editor
- **Neovim** - Modern Vim-based editor with full configuration

### CLI Utilities
- **ripgrep** - Fast text search
- **fd** - Fast file finder
- **fzf** - Fuzzy finder
- **gum** - Glamorous shell scripts

### Developer Tools
- **K9s** - Kubernetes TUI
- **Pulumi** - Infrastructure as Code
- **GitHub CLI** - GitHub command line
- **Lazygit** - Git TUI
- **Lazydocker** - Docker TUI

### Security & GPG
- **GnuPG** - Encryption and signing
- **pinentry-mac** - macOS GPG passphrase entry

### Applications (GUI)
- **Alacritty** - GPU-accelerated terminal (built from pinned upstream source on macOS because the Homebrew cask is disabled)
- **Slack** - Team communication
- **Spotify** - Music streaming
- **Obsidian** - Note-taking and knowledge management
- **LinearMouse** - Mouse customization
- **Bitwarden** - Password manager

## Configuration

All tools come pre-configured through the linked configuration directories:

- **Neovim**: Full IDE setup with LSP, plugins, and keybindings
- **Fish**: Shell configuration with aliases and functions  
- **Tmux**: Terminal multiplexer configuration
- **Git**: Version control settings
- **And more**: All configurations are automatically linked and ready to use

## Additional Tools

This dotfiles system includes several custom utilities for configuration and environment management:

### Configuration Management
- **`adopt-dot`** - Interactive tool to adopt existing config files from `~` or `~/.config` into your dotfiles repository
- **`edit-env`** - Create and edit environment variable groups in OpenBao KV

### Development Cleanup

Run `./bin/dev-clean` for an interactive, size-sorted cleanup list. Go 1.25.5 or newer builds a cached binary on first use.
The launcher works from any directory. `./bin/dev-clean --help` lists options without a scan or cleanup.

- Default search roots: `~/repos` and this checkout. Add roots with repeatable `--root /path` options.
- Discovery includes registered Git worktrees outside those roots and nested Cargo/JavaScript projects.
- No target starts selected. Space toggles a target; `a` selects filtered targets; `n` clears the selection.
- `/` filters; arrows navigate; `p` previews commands; `r` refreshes and clears the selection.
- `w` shows all scan warnings.
- Teal marks focus and selection; amber marks warnings. Red marks destructive actions and confirmation.
- The list aligns size, type, and project columns. Short paths use `~` or this checkout's name.
- The focused-target panel shows the path and cleanup command. `d` opens full details; arrows scroll long paths and commands.
- The selection summary combines known logical bytes and a separate count for unknown sizes.
- The scan indicator animates until discovery completes. Cleanup reports the active target and completed count, one target at a time.
- Small panes use a compact layout; `?` shows all keys and the full size summary.
- If the pane cannot show review text and confirmation controls, cleanup stays blocked until you enlarge it.
- Set `NO_COLOR` for plain text; focus and selection retain text markers.
- Enter opens the final review. Type `CLEAN` to execute, or press Escape to return.
- Cargo uses `cargo clean` for each distinct target directory, including shared or external targets shown in the review.
- Selected `node_modules` directories permit direct deletion. Path checks reject symlink ancestors and protected directories.
- Global operations use `pnpm store prune`, `bun pm cache rm`, and `go clean -cache`. Go modules remain intact.
- Docker removes all stopped containers, unused images, build cache, and unused volumes, **including named volumes**.
  Docker preserves containers that run and their referenced resources. Cleanup can delete local databases and test data.
  The review shows the Docker context or `DOCKER_HOST`, endpoint, and TLS settings.
  Docker cleanup requires the exact phrase `DELETE DOCKER DATA`.
  Commands retain the initial endpoint selection; a context definition change blocks further cleanup until refresh.
- Ctrl+C cancels the active subprocess group. Completed operations have no undo.

Scans run asynchronously and report unavailable tools or daemons as warnings.
Cargo discovery uses offline, locked metadata; unresolved projects produce warnings instead of dependency downloads.
Sizes and recovered-space estimates use logical file bytes, not exact free disk space.
Shared files, hard links, and concurrent writes affect accuracy.
Docker's pre-clean estimate sums the reclaimable categories from `docker system df` at the pinned destination,
with a 15-second timeout. Shared image layers and build-cache accounting can overlap, so this is approximate,
not a promise of free disk space. If the estimate is unavailable or incomplete, the Docker size stays unknown
and the scan shows a warning. Docker recovery after cleanup still reports an unknown size.

### Environment Variable Management
- **`envl`** - Fish function to load OpenBao environment variables into your shell session
  - Includes related commands: `envs` and `envls`
  - Provides tab completion for environment group names
  - Calls `env-select` internally to fetch and load variables
- **`env-select`** - Fetch and select environment variable groups from OpenBao KV

These tools use OpenBao OIDC authentication and load secrets from the `kv/env` namespace.

## Tmux Plugin Manager

TPM (Tmux Plugin Manager) is automatically installed by the dotfiles. On first setup, you'll need to install the configured plugins:

1. Start tmux: `tmux`
2. Press `prefix + I` (capital i) to install plugins
3. Use `prefix + Ctrl-f` to launch the tmux-fzf fuzzy finder for sessions/windows/panes

### tmux-fzf Features

Press `prefix + Ctrl-f` to access:
- **Session switching** - Fuzzy find across all tmux sessions
- **Window switching** - Jump to any window in any session
- **Pane switching** - Navigate to any pane
- **Additional tools** - Commands, keybindings, clipboard, and process management

## Updating

Run `./bin/update.sh` anytime to:
- Update all package managers (Homebrew, rustup, uv)
- Re-run the deployment to catch any new configurations
- Upgrade all installed Homebrew packages
- Update TPM and tmux plugins (run `prefix + U` in tmux)

## Requirements

- macOS (tested on recent versions) or Arch Linux
- Internet connection for downloading tools
- Admin privileges for some installations
