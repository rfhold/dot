#!/bin/bash

set -eu

REPO_DIR="$HOME/repos/rfhold/superspec"
CACHE_DIR="$HOME/.cache/opencode/packages/superspec@git+ssh:"

if [[ -d "$REPO_DIR/.git" ]]; then
    echo "Updating superspec repo in $REPO_DIR"
    git -C "$REPO_DIR" pull --ff-only
else
    echo "No local superspec repo found at $REPO_DIR; skipping git pull" >&2
fi

if [[ -e "$CACHE_DIR" ]]; then
    echo "Clearing cached superspec package in $CACHE_DIR"
    rm -rf "$CACHE_DIR"
else
    echo "No cached superspec package found at $CACHE_DIR"
fi

cat <<'EOF'
Superspec cache cleared.
Restart OpenCode, then open a fresh session to load the latest superspec plugin.
EOF
