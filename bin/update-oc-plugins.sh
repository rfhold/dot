#!/bin/bash

set -eu

CACHE_DIR="$HOME/.cache/opencode/packages"

if [[ -e "$CACHE_DIR" ]]; then
    echo "Clearing OpenCode plugin cache in $CACHE_DIR"
    rm -rf "$CACHE_DIR"
else
    echo "No OpenCode plugin cache found at $CACHE_DIR"
fi

cat <<'EOF'
OpenCode plugin cache cleared.
Restart OpenCode, then open a fresh session to re-download plugin packages.
EOF
