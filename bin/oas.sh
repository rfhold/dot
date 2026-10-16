#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  oas.sh swap [credential]                Switch Anthropic account (picker if omitted)
  oas.sh switch [integration] [credential] Switch an account using native OpenCode auth
  oas.sh list                             List integrations and saved accounts
  oas.sh status                           Alias for list

Requires OpenCode v2. Credentials are managed by OpenCode, not auth.json.
Legacy stash creation/restoration is unsupported; existing stash files are untouched.
Use `opencode auth login anthropic` to add an account, then swap by ID or label.
EOF
}

case "${1:-}" in
  -h|--help|help|"")
    usage
    exit 0
    ;;
  stash)
    printf '%s\n' 'error: legacy auth.json stashes are unsupported in OpenCode v2; use opencode auth login anthropic' >&2
    exit 1
    ;;
  swap)
    [[ $# -le 2 ]] || { usage >&2; exit 1; }
    shift
    set -- auth switch anthropic "$@"
    ;;
  switch)
    [[ $# -le 3 ]] || { usage >&2; exit 1; }
    shift
    set -- auth switch "$@"
    ;;
  list|status)
    [[ $# -eq 1 ]] || { usage >&2; exit 1; }
    set -- auth list
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac

exec opencode "$@"
