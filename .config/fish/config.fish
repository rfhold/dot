if status is-interactive
    # Commands to run in interactive sessions can go here
end

# Fish shell configuration
set fish_greeting ""

# Load Homebrew environment
eval "$(/opt/homebrew/bin/brew shellenv)"

# Connect to GPG agent
export GPG_TTY="$(tty)"
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
gpg-connect-agent /bye

# Clear line on CTRL + C
bind --preset \cC 'cancel-commandline'

starship init fish | source

