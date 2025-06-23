# Dotfiles

A comprehensive dotfiles management system using PyInfra for automated setup and configuration of macOS development environment.

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
- **Alacritty** - GPU-accelerated terminal
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
- **`edit-env`** - Create and edit encrypted environment variable groups using GPG encryption

### Environment Variable Management
- **`env-load`** - Fish function to load encrypted environment variables into your shell session
  - Includes aliases: `envl`, `envs`, `envls`
  - Provides tab completion for environment group names
  - Calls `env-select` internally to decrypt and load variables
- **`env-select`** - Decrypt and select environment variable groups from encrypted storage

These tools work together to provide secure, encrypted storage of sensitive environment variables with easy loading into shell sessions.

## Updating

Run `./bin/update.sh` anytime to:
- Update all package managers (Homebrew, rustup, uv)
- Re-run the deployment to catch any new configurations
- Upgrade all installed Homebrew packages

## Requirements

- macOS (tested on recent versions)
- Internet connection for downloading tools
- Admin privileges for some installations