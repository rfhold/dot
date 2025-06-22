# Dotfiles Configuration

An automated dotfiles management system using [PyInfra](https://pyinfra.com/) to configure development environments on macOS.

## Overview

This project automates the setup and configuration of a complete development environment, including:

- **Shell Configuration**: Fish shell with Starship prompt
- **Terminal Setup**: Alacritty terminal with tmux
- **Development Tools**: Go, Node.js, Bun, Neovim, and various CLI utilities
- **GUI Applications**: Slack, Spotify, Obsidian, and other productivity apps
- **Configuration Management**: Automated symlinking of dotfiles and config directories

## Features

- 🔗 **Automatic Symlinking**: Links configuration files from `.config/` and `home/` directories
- 📦 **Package Management**: Installs and manages Homebrew packages and casks
- 🛠️ **Development Environment**: Sets up complete toolchain for Go, JavaScript, and general development
- 🔐 **Security Tools**: Configures GPG and password management with commit signing
- ⚡ **Modern CLI Tools**: Includes ripgrep, fd, lazygit, k9s, and more
- 🎨 **Themed Environment**: TokyoNight color scheme for tmux and terminal

## Prerequisites

- macOS (tested on macOS 15.5)
- Python 3.13+
- [uv](https://docs.astral.sh/uv/) package manager

## Installation

1. Clone this repository to `~/dot`:
   ```bash
   git clone <repository-url> ~/dot
   cd ~/dot
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Run the configuration:
   ```bash
   uv run pyinfra @local configure.py
   ```

## What Gets Installed

### Development Tools
- **Languages**: Go, Node.js, Bun
- **Editors**: Neovim with vim-tmux-navigator integration
- **Version Control**: Git with GPG signing, Lazygit, GitHub CLI
- **Search & Navigation**: ripgrep, fd
- **Infrastructure**: Pulumi, k9s (Kubernetes)

### Terminal Environment
- **Shell**: Fish with Fisher plugin manager
- **Prompt**: Starship
- **Multiplexer**: tmux with TokyoNight theme and smart pane switching
- **Terminal**: Alacritty

### GUI Applications
- Slack (communication)
- Spotify (music)
- Obsidian (notes)
- Bitwarden (password manager)
- LinearMouse (mouse customization)

### Configuration Highlights

**Git Configuration**:
- GPG commit and tag signing enabled
- SSH URLs for GitHub/GitLab
- Custom global gitignore

**tmux Configuration**:
- TokyoNight color scheme
- Vim-tmux-navigator for seamless pane switching
- Custom status bar with session info and system details
- Smart Ctrl+C handling for ESP-IDF development

### Configuration Files

The system automatically symlinks:
- All files in `.config/` → `~/.config/`
- All files in `home/` → `~/`

This includes configurations for:
- Fish shell and functions
- Alacritty terminal
- tmux with custom theme
- Starship prompt
- k9s, lazygit, lazydocker
- Git with GPG signing

## Project Structure

```
.
├── .config/           # Application configurations
│   ├── alacritty/     # Terminal configuration
│   ├── fish/          # Shell configuration and functions
│   ├── k9s/           # Kubernetes TUI config
│   ├── lazygit/       # Git TUI config
│   ├── starship.toml  # Shell prompt config
│   └── ...
├── home/              # Home directory dotfiles
│   ├── .gitconfig     # Git with GPG signing
│   ├── .tmux.conf     # tmux with TokyoNight theme
│   └── .gitignore     # Global git ignore patterns
├── bin/               # Utility scripts
├── configure.py       # Main PyInfra configuration
├── pyproject.toml     # Python project configuration
└── README.md          # This file
```

## Key Features

### Smart Terminal Navigation
- Seamless switching between tmux panes and Vim splits using Ctrl+h/j/k/l
- Custom Ctrl+C handling for ESP-IDF development workflows

### Security & Git Integration
- Automatic GPG signing for commits and tags
- SSH URL rewriting for GitHub and GitLab
- Secure credential management with Bitwarden

### Modern Development Workflow
- Fish shell with intelligent completions
- Starship prompt with git status and environment info
- Integrated terminal multiplexing with tmux

## Customization

To customize the setup:

1. **Add/Remove Packages**: Edit the `brew.packages()` calls in `configure.py`
2. **Modify Configurations**: Update files in `.config/` and `home/` directories
3. **Add New Configurations**: Place new config files in appropriate directories
4. **Theme Changes**: Modify color schemes in tmux.conf and terminal configs

## Running

After initial setup, you can re-run the configuration anytime:

```bash
cd ~/dot
uv run pyinfra @local configure.py
```

This will:
- Update symlinks for any new configuration files
- Install any newly added packages
- Skip already-installed components

## Dependencies

- **PyInfra**: Infrastructure automation framework
- **Homebrew**: Package manager for macOS
- **uv**: Fast Python package manager

## License

This project is for personal use. Feel free to fork and adapt for your own dotfiles setup.
