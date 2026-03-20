#!/bin/bash

set -eu

cd $HOME/dot

# Setup PATH for tools that install to user directories
# These may be installed by bootstrap.sh or previous runs
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# Add Homebrew to PATH if installed (Apple Silicon or Intel)
if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
fi

# Parse flags
UPGRADE=0
PULL=0
REMOTE=0
ARGS=()
for arg in "$@"; do
    case "$arg" in
        --upgrade) UPGRADE=1 ;;
        --pull) PULL=1 ;;
        --remote) REMOTE=1 ;;
        *) ARGS+=("$arg") ;;
    esac
done

if [[ "$REMOTE" == "1" ]]; then
    INVENTORY="inventory.py"
else
    INVENTORY="@local"
fi

DOTFILES_UPGRADE=$UPGRADE DOTFILES_PULL=$PULL uv run pyinfra "$INVENTORY" configure.py ${ARGS[@]+"${ARGS[@]}"}

