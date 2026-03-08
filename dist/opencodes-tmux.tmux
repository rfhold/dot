#!/usr/bin/env bash
# opencodes-tmux — TPM plugin for tmux session bridging via opencodes
#
# Manages tmux hooks for:
# - Pushing local tmux state to the opencodes server (via tray's embedded daemon)
# - Auto-connecting stub windows when selected
# - Detaching remote sessions when switching away

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Locate the binary: check PATH first, then plugin's bin/ directory.
if command -v opencodes-tmux &>/dev/null; then
    BINARY="opencodes-tmux"
else
    BINARY="${CURRENT_DIR}/bin/opencodes-tmux"
    if [[ ! -x "$BINARY" ]]; then
        tmux display-message "opencodes-tmux: binary not found"
        return 0 2>/dev/null || exit 0
    fi
fi

# Register hooks for state change notifications.
# These trigger the tray's embedded daemon to push state to the server immediately.
tmux set-hook -g client-attached "run-shell -b '$BINARY notify'"
tmux set-hook -g session-created "run-shell -b '$BINARY notify'"
tmux set-hook -g session-closed "run-shell -b '$BINARY notify'"
tmux set-hook -g window-linked "run-shell -b '$BINARY notify'"
tmux set-hook -g window-unlinked "run-shell -b '$BINARY notify'"
tmux set-hook -g window-renamed "run-shell -b '$BINARY notify'"

# Register hooks for stub window activation and remote session management.
tmux set-hook -g session-window-changed \
    "run-shell -b '$BINARY connect #{session_name} #{window_name}'"
tmux set-hook -g client-session-changed \
    "run-shell -b '$BINARY connect #{session_name} #{window_name}' ; if-shell -F '#{client_last_session}' 'run-shell -b \"$BINARY detach #{session_name} #{client_last_session}\"'"

# Manual resync binding (prefix + R).
tmux bind-key R run-shell "$BINARY notify --reset" \; display-message "Remote sessions synced"
