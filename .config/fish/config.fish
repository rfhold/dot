if status is-interactive
    # Commands to run in interactive sessions can go here
end

# Fish shell configuration
set fish_greeting ""

# Load Homebrew environment (macOS only)
if test (uname) = "Darwin"
    eval "$(/opt/homebrew/bin/brew shellenv)"
end

# GPG and SSH agent configuration
# Use GPG agent for SSH if available and configured, otherwise use system SSH agent
set -gx GPG_TTY (tty)

if command -q gpgconf; and test -S (gpgconf --list-dirs agent-ssh-socket 2>/dev/null)
    # GPG agent is available, use it for SSH
    set -gx SSH_AUTH_SOCK (gpgconf --list-dirs agent-ssh-socket)
    gpgconf --launch gpg-agent 2>/dev/null
    # Update agent's TTY to current terminal for pinentry
    gpg-connect-agent updatestartuptty /bye 2>/dev/null
else if test -z "$SSH_AUTH_SOCK"
    # No GPG agent, fall back to system SSH agent
    if test -S "$HOME/.ssh/agent.sock"
        set -gx SSH_AUTH_SOCK "$HOME/.ssh/agent.sock"
    else if test -S "/run/user/(id -u)/ssh-agent.socket"
        set -gx SSH_AUTH_SOCK "/run/user/(id -u)/ssh-agent.socket"
    end
end

# Clear line on CTRL + C
bind --preset \cC 'cancel-commandline'

# Aliases
# Container engine detection - prefer podman, fall back to docker
if command -q podman
    set -gx CONTAINER_ENGINE podman
    alias docker='podman'
else if command -q docker
    set -gx CONTAINER_ENGINE docker
end

starship init fish | source

# LM Studio CLI (macOS only)
if test (uname) = "Darwin"; and test -d "$HOME/.lmstudio/bin"
    set -gx PATH $PATH "$HOME/.lmstudio/bin"
end

# Fix opencode on musl/Alpine - npm wrapper doesn't detect musl correctly
# OPENCODE_BIN_PATH is checked first in the wrapper, bypassing broken detection
if test -f /etc/alpine-release
    set -l arch (uname -m | string replace 'aarch64' 'arm64' | string replace 'x86_64' 'x64')
    set -l musl_bin "$HOME/.bun/install/global/node_modules/opencode-linux-$arch-musl/bin/opencode"
    if test -x "$musl_bin"
        set -gx OPENCODE_BIN_PATH "$musl_bin"
    end
end

# Source runtime environment (container entrypoint vars like OPENCODE_SERVER_PASSWORD)
if test -f "$HOME/.env.runtime"
    while read -l line
        # Skip comments and empty lines
        if string match -qr '^#' -- $line; or test -z "$line"
            continue
        end
        # Parse export VAR="value" format
        if string match -qr '^export ' -- $line
            set -l assignment (string replace 'export ' '' -- $line)
            set -l var_name (string split -m1 '=' -- $assignment)[1]
            set -l var_value (string split -m1 '=' -- $assignment)[2]
            # Strip surrounding quotes
            set var_value (string trim -c '"' -- $var_value)
            set -gx $var_name $var_value
        end
    end < "$HOME/.env.runtime"
end

