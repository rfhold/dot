if status is-interactive
    # Commands to run in interactive sessions can go here
end

# Fish shell configuration
set fish_greeting ""

# Connect to GPG agent
export GPG_TTY="$(tty)"
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
gpg-connect-agent /bye

# Load Homebrew environment
eval "$(/opt/homebrew/bin/brew shellenv)"

# Environment variables
export GOPATH="$HOME/go"
export GOPRIVATE="github.com/cfaintl"

export DOCKER_HOST="unix:///$HOME/.config/colima/default/docker.sock"
export TESTCONTAINERS_HOST_OVERRIDE="127.0.0.1"

export OLLAMA_API_BASE="https://ollama.holdenitdown.net"

export DOTDIR="$HOME/dot"

# PATH
export PATH="$PATH:/opt/homebrew/bin"
export PATH="$PATH:$GOPATH/bin"
export PATH="$PATH:$HOME/.local/bin"
export PATH="$PATH:$HOME/.cargo/bin"
export PATH="$PATH:$DOTDIR/bin"
 
# Clear line on CTRL + C
bind --preset \cC 'cancel-commandline'

starship init fish | source

