# Environment variables
export XDG_CONFIG_HOME="$HOME/.config"

export GOPATH="$HOME/go"
export GOPRIVATE="github.com/cfaintl"

export DOCKER_HOST="unix:///$HOME/.config/colima/default/docker.sock"
export TESTCONTAINERS_HOST_OVERRIDE="127.0.0.1"

export OLLAMA_API_BASE="https://ollama.holdenitdown.net"

export DOTDIR="$HOME/dot"

export RIPGREP_CONFIG_PATH=$HOME/.ripgreprc

export EDITOR=nvim
export KUBE_EDITOR=nvim

# PATH
export PATH="$PATH:/opt/homebrew/bin"
export PATH="$PATH:$GOPATH/bin"
export PATH="$PATH:$HOME/.local/bin"
export PATH="$PATH:$HOME/.cargo/bin"
export PATH="$PATH:$HOME/.bun/bin"
export PATH="$PATH:$DOTDIR/bin"

