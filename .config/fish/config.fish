if status is-interactive
    # Commands to run in interactive sessions can go here
end

# Fish shell configuration
set fish_greeting ""

# Load Homebrew environment (macOS only)
if test (uname) = "Darwin"
    eval "$(/opt/homebrew/bin/brew shellenv)"
end

# Connect to GPG agent
export GPG_TTY="$(tty)"
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
gpg-connect-agent /bye

# Clear line on CTRL + C
bind --preset \cC 'cancel-commandline'

starship init fish | source

# LM Studio CLI (macOS only)
if test (uname) = "Darwin"; and test -d "$HOME/.lmstudio/bin"
    set -gx PATH $PATH "$HOME/.lmstudio/bin"
end

