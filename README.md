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

## Hyprland Desktop Environment (Arch Linux)

On Arch Linux bare metal systems, a complete Hyprland desktop environment is installed with the following components:

| Component     | Tool      | Description                      |
| ------------- | --------- | -------------------------------- |
| Compositor    | Hyprland  | Dynamic tiling Wayland compositor |
| Status Bar    | Waybar    | Customizable status bar          |
| Launcher      | Fuzzel    | Fast application launcher        |
| Notifications | Mako      | Lightweight notification daemon  |
| Wallpaper     | Hyprpaper | Wallpaper manager                |
| Lock Screen   | Hyprlock  | GPU-accelerated screen locker    |
| Idle Daemon   | Hypridle  | Idle management                  |
| File Manager  | Yazi      | Terminal-based file manager      |
| Terminal      | Ghostty   | GPU-accelerated terminal         |

### Hyprland Keybindings

#### Applications

| Keybind         | Action                           |
| --------------- | -------------------------------- |
| `SUPER + Return`  | Open terminal (Ghostty)          |
| `SUPER + D`       | Open application launcher        |
| `SUPER + E`       | Open file manager (Yazi)         |
| `SUPER + B`       | Open browser (Firefox)           |
| `SUPER + V`       | Open clipboard history           |

#### Window Management

| Keybind                 | Action                 |
| ----------------------- | ---------------------- |
| `SUPER + Q`               | Close window           |
| `SUPER + SHIFT + Q`       | Exit Hyprland          |
| `SUPER + F`               | Toggle fullscreen      |
| `SUPER + Space`           | Toggle floating        |
| `SUPER + P`               | Toggle pseudo-tile     |
| `SUPER + S`               | Toggle split direction |

#### Focus (Vim-style)

| Keybind     | Action       |
| ----------- | ------------ |
| `SUPER + H`   | Focus left   |
| `SUPER + J`   | Focus down   |
| `SUPER + K`   | Focus up     |
| `SUPER + L`   | Focus right  |

#### Move Windows

| Keybind           | Action      |
| ----------------- | ----------- |
| `SUPER + SHIFT + H` | Move left   |
| `SUPER + SHIFT + J` | Move down   |
| `SUPER + SHIFT + K` | Move up     |
| `SUPER + SHIFT + L` | Move right  |

#### Resize Windows

| Keybind          | Action        |
| ---------------- | ------------- |
| `SUPER + CTRL + H` | Shrink width  |
| `SUPER + CTRL + L` | Grow width    |
| `SUPER + CTRL + K` | Shrink height |
| `SUPER + CTRL + J` | Grow height   |

#### Workspaces

| Keybind             | Action                       |
| ------------------- | ---------------------------- |
| `SUPER + 1-9, 0`      | Switch to workspace 1-10     |
| `SUPER + SHIFT + 1-9` | Move window to workspace     |
| `SUPER + ]`           | Next workspace               |
| `SUPER + [`           | Previous workspace           |
| `SUPER + \``          | Toggle special workspace     |
| `SUPER + SHIFT + \``  | Move to special workspace    |

#### Screenshots

| Keybind               | Action                          |
| --------------------- | ------------------------------- |
| `Print`                 | Screenshot region to clipboard  |
| `SHIFT + Print`         | Screenshot screen to clipboard  |
| `SUPER + Print`         | Screenshot region to file       |
| `SUPER + SHIFT + Print` | Screenshot screen to file       |

#### System

| Keybind           | Action            |
| ----------------- | ----------------- |
| `SUPER + SHIFT + X` | Lock screen       |
| `SUPER + SHIFT + C` | Color picker      |

#### Media Keys

| Key                    | Action                 |
| ---------------------- | ---------------------- |
| `XF86AudioRaiseVolume`   | Volume up              |
| `XF86AudioLowerVolume`   | Volume down            |
| `XF86AudioMute`          | Toggle mute            |
| `XF86AudioMicMute`       | Toggle mic mute        |
| `XF86MonBrightnessUp`    | Brightness up          |
| `XF86MonBrightnessDown`  | Brightness down        |
| `XF86AudioPlay`          | Play/Pause media       |
| `XF86AudioNext`          | Next track             |
| `XF86AudioPrev`          | Previous track         |

#### Mouse Bindings

| Keybind                  | Action        |
| ------------------------ | ------------- |
| `SUPER + Left Click`       | Move window   |
| `SUPER + Right Click`      | Resize window |
| `SUPER + Scroll`           | Cycle workspaces |

### Hyprland Configuration Files

All configuration files are located in `~/.config/`:

| File                        | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `hypr/hyprland.conf`          | Main Hyprland configuration                 |
| `hypr/hyprpaper.conf`         | Wallpaper configuration                     |
| `hypr/hyprlock.conf`          | Lock screen appearance                      |
| `hypr/hypridle.conf`          | Idle timeout behavior                       |
| `waybar/config`               | Status bar modules and layout               |
| `waybar/style.css`            | Status bar styling (Aura theme)             |
| `fuzzel/fuzzel.ini`           | Application launcher settings               |
| `mako/config`                 | Notification daemon settings                |

### Setting a Wallpaper

Edit `~/.config/hypr/hyprpaper.conf` and uncomment/modify:

```conf
preload = ~/Pictures/Wallpapers/your-wallpaper.png
wallpaper = , ~/Pictures/Wallpapers/your-wallpaper.png
```

### Idle Behavior

The default idle configuration:
- **2.5 minutes**: Screen dims to 30%
- **5 minutes**: Screen locks
- **5.5 minutes**: Display turns off
- **30 minutes**: System suspends