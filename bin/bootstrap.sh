#!/bin/bash

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install_rustup() {
    "$SCRIPT_DIR/update-rust"
}

install_uv() {
    "$SCRIPT_DIR/update-uv"
}

install_bun() {
    if command -v bun &> /dev/null; then
        echo "bun found. Updating..."
        bun upgrade
    else
        echo "Installing bun..."
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
    fi
}

install_go() {
    "$SCRIPT_DIR/update-go"
}

clone_dotfiles() {
    if [[ ! -d "$HOME/dot" ]]; then
        echo "Cloning dotfiles..."
        git clone https://github.com/rfhold/dot "$HOME/dot"
    fi
}

# -----------------------------------------------------------------------------
# Distro-specific setup
# -----------------------------------------------------------------------------

install_aur_helper() {
    if command -v paru &> /dev/null; then
        echo "paru found."
        return
    fi

    echo "Installing paru..."
    local tmpdir
    tmpdir=$(mktemp -d)
    git clone https://aur.archlinux.org/paru.git "$tmpdir/paru"
    (cd "$tmpdir/paru" && makepkg -si --noconfirm)
    rm -rf "$tmpdir"
}

setup_alpine() {
    echo "Detected Alpine Linux"
    sudo apk update
    sudo apk add --no-cache \
        build-base \
        git \
        curl \
        python3 \
        py3-pip

    install_rustup
    install_uv
    install_go
    install_bun
}

setup_arch() {
    echo "Detected Arch Linux"
    sudo pacman -Syu --noconfirm
    sudo pacman -S --needed --noconfirm base-devel git
    install_rustup
    install_aur_helper
    install_uv
    install_go
    install_bun
}

setup_debian() {
    echo "Detected Debian/Ubuntu"
    sudo apt-get update
    sudo apt-get install -y \
        build-essential \
        git \
        curl \
        python3 \
        python3-pip \
        python3-venv

    install_rustup
    install_uv
    install_go
    install_bun
}

setup_macos() {
    echo "Detected macOS"

    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        # Add brew to PATH for this session
        if [[ "$(uname -m)" == "arm64" ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        else
            eval "$(/usr/local/bin/brew shellenv)"
        fi
    fi

    echo "Updating Homebrew..."
    brew update

    install_rustup
    install_uv
    install_go
    install_bun

    echo "Upgrading Homebrew packages..."
    brew upgrade
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

case "$(uname -s)" in
    Linux)
        if [[ -f /etc/arch-release ]]; then
            setup_arch
        elif [[ -f /etc/alpine-release ]]; then
            setup_alpine
        elif [[ -f /etc/debian_version ]]; then
            setup_debian
        else
            echo "Unsupported Linux distro"
            exit 1
        fi
        ;;
    Darwin)
        setup_macos
        ;;
    *)
        echo "Unsupported OS: $(uname -s)"
        exit 1
        ;;
esac

clone_dotfiles

echo "Running update script..."
"$HOME/dot/bin/update.sh" -y
