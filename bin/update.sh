#!/bin/bash

set -eu

cd $HOME/dot

# Setup PATH for tools that install to user directories
# These may be installed by bootstrap.sh or previous runs
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# Parse flags
UPGRADE=0
PULL=0
ARGS=()
for arg in "$@"; do
    case "$arg" in
        --upgrade) UPGRADE=1 ;;
        --pull) PULL=1 ;;
        *) ARGS+=("$arg") ;;
    esac
done

# Pull latest changes if requested
if [[ "$PULL" == "1" ]]; then
    echo "Pulling latest dotfiles..."
    git pull --ff-only origin main
fi

DOTFILES_UPGRADE=$UPGRADE uv run pyinfra @local configure.py ${ARGS[@]+"${ARGS[@]}"}

