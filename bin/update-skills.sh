#!/bin/bash

set -eu

cd $HOME/dot

export PATH="$HOME/.bun/bin:$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
fi

REMOTE=0
ARGS=()
for arg in "$@"; do
    case "$arg" in
        --remote) REMOTE=1 ;;
        *) ARGS+=("$arg") ;;
    esac
done

if [[ "$REMOTE" == "1" ]]; then
    INVENTORY="inventory.py"
else
    INVENTORY="@local"
fi

DOTFILES_PULL=1 DOTFILES_TAGS=skills uv run pyinfra "$INVENTORY" configure.py ${ARGS[@]+"${ARGS[@]}"}
