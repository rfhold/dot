#!/usr/bin/env sh

set -eu

STATE_DIR="${XDG_RUNTIME_DIR:-/tmp}"
STATE_FILE="${STATE_DIR}/hypridle-inhibit"

status_json() {
    if [ -f "${STATE_FILE}" ]; then
        printf '%s\n' '{"text":"󰅶 AWAKE","class":"enabled","tooltip":"Stay awake enabled\nLock, dim, display-off, and suspend are paused"}'
    else
        printf '%s\n' '{"text":"󰾪 IDLE","class":"disabled","tooltip":"Stay awake disabled\nNormal idle behavior is active"}'
    fi
}

toggle_state() {
    if [ -f "${STATE_FILE}" ]; then
        rm -f "${STATE_FILE}"
        if ! pgrep -x hypridle >/dev/null 2>&1; then
            hyprctl dispatch exec "hypridle" >/dev/null 2>&1 || true
        fi
    else
        : > "${STATE_FILE}"
        pkill hypridle 2>/dev/null || true
        hyprctl dispatch dpms on >/dev/null 2>&1 || true
        brightnessctl -r >/dev/null 2>&1 || true
    fi

    pkill -RTMIN+8 waybar 2>/dev/null || true
}

case "${1:-status}" in
    status)
        status_json
        ;;
    toggle)
        toggle_state
        ;;
    *)
        printf '%s\n' "Usage: $0 [status|toggle]" >&2
        exit 1
        ;;
esac
