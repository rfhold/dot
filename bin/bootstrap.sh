#!/bin/bash

set -eu

install_rustup() {
    if command -v rustup &> /dev/null; then
        echo "rustup found. Updating..."
        rustup update stable
    else
        echo "Installing rustup..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
    fi
    rustup default stable
}

install_uv() {
    if command -v uv &> /dev/null; then
        echo "uv found. Updating..."
        uv self update
    else
        echo "Installing uv..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
    fi
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

install_paru() {
    if command -v paru &> /dev/null; then
        echo "paru found."
        return
    fi

    echo "Installing paru..."
    local tmpdir
    tmpdir=$(mktemp -d)
    git clone https://aur.archlinux.org/paru.git "$tmpdir/paru"
    (cd "$tmpdir/paru" && MAKEFLAGS="-j$(nproc)" makepkg -si --noconfirm --disable-sandbox)
    rm -rf "$tmpdir"
}

setup_arch() {
    echo "Detected Arch Linux"
    sudo pacman -Syu --noconfirm
    sudo pacman -S --needed --noconfirm base-devel git
    install_rustup
    install_paru
    install_uv
}

setup_macos() {
    echo "Detected macOS"

    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi

    echo "Updating Homebrew..."
    brew update

    install_rustup
    install_uv

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
"$HOME/dot/bin/update.sh"
