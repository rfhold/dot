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
    local GO_VERSION="1.25.5"
    local GO_INSTALL_DIR="/usr/local/go"
    
    # Determine architecture
    local ARCH
    case "$(uname -m)" in
        x86_64) ARCH="amd64" ;;
        aarch64|arm64) ARCH="arm64" ;;
        *) echo "Unsupported architecture: $(uname -m)"; return 1 ;;
    esac
    
    # Determine OS
    local OS
    case "$(uname -s)" in
        Linux) OS="linux" ;;
        Darwin) OS="darwin" ;;
        *) echo "Unsupported OS: $(uname -s)"; return 1 ;;
    esac
    
    # Check if Go is already installed at the correct version
    if command -v go &> /dev/null; then
        local CURRENT_VERSION
        CURRENT_VERSION=$(go version | awk '{print $3}' | sed 's/go//')
        if [[ "$CURRENT_VERSION" == "$GO_VERSION" ]]; then
            echo "Go $GO_VERSION already installed."
            return 0
        fi
        echo "Go $CURRENT_VERSION found. Upgrading to $GO_VERSION..."
    else
        echo "Installing Go $GO_VERSION..."
    fi
    
    local TARBALL="go${GO_VERSION}.${OS}-${ARCH}.tar.gz"
    local URL="https://go.dev/dl/${TARBALL}"
    
    # Download and extract
    curl -fsSL "$URL" -o "/tmp/$TARBALL"
    sudo rm -rf "$GO_INSTALL_DIR"
    sudo tar -C /usr/local -xzf "/tmp/$TARBALL"
    rm "/tmp/$TARBALL"
    
    export PATH="$GO_INSTALL_DIR/bin:$PATH"
    echo "Go $GO_VERSION installed successfully."
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
    if command -v paru &> /dev/null || command -v yay &> /dev/null; then
        echo "AUR helper found."
        return
    fi

    echo "Installing yay..."
    local tmpdir
    tmpdir=$(mktemp -d)
    git clone https://aur.archlinux.org/yay.git "$tmpdir/yay"
    (cd "$tmpdir/yay" && makepkg -si --noconfirm)
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
