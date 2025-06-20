#!/bin/bash

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Check if installation was successful
    if command -v brew &> /dev/null; then
        echo "Homebrew installed successfully."
    else
        echo "Homebrew installation failed."
        exit 1
    fi
else
    echo "Homebrew is already installed."
fi

# Update Homebrew
echo "Updating Homebrew..."
brew update

# Check if rustup is installed
if ! command -v rustup &> /dev/null; then
    echo "rustup not found. Installing rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # Source the cargo environment
    source "$HOME/.cargo/env"
    
    # Check if installation was successful
    if command -v rustup &> /dev/null; then
        echo "rustup installed successfully."
    else
        echo "rustup installation failed."
        exit 1
    fi
else
    echo "rustup is already installed."
fi

# Update to latest stable toolchain
echo "Updating to latest stable Rust toolchain..."
rustup update stable
rustup default stable

# Check if cargo is available
if ! command -v cargo &> /dev/null; then
    echo "cargo not found after rustup installation."
    exit 1
else
    echo "cargo is available."
fi

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv not found. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    
    # Check if installation was successful
    if command -v uv &> /dev/null; then
        echo "uv installed successfully."
    else
        echo "uv installation failed."
        exit 1
    fi
else
    echo "uv is already installed. Updating uv..."
		uv self update

		# Check if update was successful
		if [ $? -eq 0 ]; then
				echo "uv updated successfully."
		else
				echo "uv update failed."
				exit 1
		fi
fi

echo "Running installation script..."
$HOME/dot/bin/install.sh

# update all homebrew packages
echo "Updating Homebrew packages..."
brew upgrade
