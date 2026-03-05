#!/usr/bin/env bash

set -euo pipefail

DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}"
AUTH_FILE="$DATA_HOME/opencode/auth.json"
STASH_DIR="$DATA_HOME/opencode/auth-stashes/anthropic"
ACTIVE_FILE="$STASH_DIR/active"

usage() {
  cat <<'EOF'
Usage:
  oas.sh stash <name>    Save live anthropic auth to a named stash
  oas.sh swap <name>     Swap to stash, updating previous active stash first
  oas.sh list            List available anthropic stashes
  oas.sh status          Show active stash and live auth presence

Notes:
  - Only the .anthropic entry in auth.json is modified.
  - On swap, if an active stash is known, the current live token set is saved
    back to that stash before restoring the target stash.
EOF
}

err() {
  printf 'error: %s\n' "$*" >&2
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    err "required command not found: $1"
    exit 1
  }
}

validate_name() {
  local name="$1"
  [[ "$name" =~ ^[A-Za-z0-9._-]+$ ]] || {
    err "invalid stash name '$name' (allowed: letters, digits, ., _, -)"
    exit 1
  }
}

ensure_auth_file() {
  [[ -f "$AUTH_FILE" ]] || {
    err "auth file not found: $AUTH_FILE"
    exit 1
  }
  jq -e . "$AUTH_FILE" >/dev/null 2>&1 || {
    err "auth file is not valid JSON: $AUTH_FILE"
    exit 1
  }
}

ensure_stash_dir() {
  mkdir -p "$STASH_DIR"
  chmod 700 "$STASH_DIR" 2>/dev/null || true
}

stash_path() {
  local name="$1"
  printf '%s/%s.json\n' "$STASH_DIR" "$name"
}

get_active() {
  if [[ -f "$ACTIVE_FILE" ]]; then
    local current
    IFS= read -r current <"$ACTIVE_FILE" || true
    printf '%s\n' "$current"
  fi
}

set_active() {
  local name="$1"
  printf '%s\n' "$name" >"$ACTIVE_FILE"
  chmod 600 "$ACTIVE_FILE" 2>/dev/null || true
}

save_live_to_stash() {
  local name="$1"
  local out
  out="$(stash_path "$name")"

  jq -e '.anthropic | select(type == "object")' "$AUTH_FILE" >"$out" || {
    err "live auth has no object at .anthropic"
    rm -f "$out"
    exit 1
  }
  chmod 600 "$out" 2>/dev/null || true
}

restore_stash_to_live() {
  local name="$1"
  local in tmp
  in="$(stash_path "$name")"

  [[ -f "$in" ]] || {
    err "stash not found: $in"
    exit 1
  }

  jq -e . "$in" >/dev/null 2>&1 || {
    err "stash is not valid JSON: $in"
    exit 1
  }

  tmp="$(mktemp "$AUTH_FILE.tmp.XXXXXX")"
  jq --argjson anthropic "$(jq -c . "$in")" '.anthropic = $anthropic' "$AUTH_FILE" >"$tmp"
  chmod 600 "$tmp" 2>/dev/null || true
  mv "$tmp" "$AUTH_FILE"
}

cmd_stash() {
  local name="$1"
  validate_name "$name"
  ensure_auth_file
  ensure_stash_dir

  save_live_to_stash "$name"
  set_active "$name"

  printf 'stashed live anthropic auth to %s\n' "$(stash_path "$name")"
  printf 'active stash: %s\n' "$name"
}

cmd_swap() {
  local target="$1"
  local current

  validate_name "$target"
  ensure_auth_file
  ensure_stash_dir

  [[ -f "$(stash_path "$target")" ]] || {
    err "target stash does not exist: $target"
    exit 1
  }

  current="$(get_active || true)"

  if [[ -n "$current" && "$current" != "$target" ]]; then
    validate_name "$current"
    save_live_to_stash "$current"
    printf 'updated previous active stash: %s\n' "$current"
  fi

  restore_stash_to_live "$target"
  set_active "$target"

  printf 'swapped anthropic auth to stash: %s\n' "$target"
}

cmd_list() {
  local current f name
  current="$(get_active || true)"

  if [[ ! -d "$STASH_DIR" ]]; then
    printf 'no stashes\n'
    return 0
  fi

  shopt -s nullglob
  local files=("$STASH_DIR"/*.json)
  shopt -u nullglob

  if [[ ${#files[@]} -eq 0 ]]; then
    printf 'no stashes\n'
    return 0
  fi

  for f in "${files[@]}"; do
    name="$(basename "$f" .json)"
    if [[ "$name" == "$current" ]]; then
      printf '* %s\n' "$name"
    else
      printf '  %s\n' "$name"
    fi
  done
}

cmd_status() {
  local current
  current="$(get_active || true)"

  if [[ -n "$current" ]]; then
    printf 'active stash: %s\n' "$current"
  else
    printf 'active stash: (none)\n'
  fi

  if [[ -f "$AUTH_FILE" ]] && jq -e '.anthropic | type == "object"' "$AUTH_FILE" >/dev/null 2>&1; then
    printf 'live auth: anthropic entry present\n'
  else
    printf 'live auth: anthropic entry missing\n'
  fi
}

main() {
  require_cmd jq

  local cmd="${1:-}"
  case "$cmd" in
    stash)
      [[ $# -eq 2 ]] || {
        usage
        exit 1
      }
      cmd_stash "$2"
      ;;
    swap)
      [[ $# -eq 2 ]] || {
        usage
        exit 1
      }
      cmd_swap "$2"
      ;;
    list)
      [[ $# -eq 1 ]] || {
        usage
        exit 1
      }
      cmd_list
      ;;
    status)
      [[ $# -eq 1 ]] || {
        usage
        exit 1
      }
      cmd_status
      ;;
    -h|--help|help|"")
      usage
      ;;
    *)
      err "unknown command: $cmd"
      usage
      exit 1
      ;;
  esac
}

main "$@"
