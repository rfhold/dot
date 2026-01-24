# Environment variables
export XDG_CONFIG_HOME="$HOME/.config"

export GOPATH="$HOME/go"
export GOPRIVATE="github.com/cfaintl"

export OLLAMA_API_BASE="https://ollama.holdenitdown.net"

export DOTDIR="$HOME/dot"

export RIPGREP_CONFIG_PATH=$HOME/.ripgreprc

export EDITOR=nvim
export KUBE_EDITOR=nvim

export OPENCODE_API=https://opencode-api.holdenitdown.net

# PATH
if test (uname) = "Darwin"
    export PATH="$PATH:/opt/homebrew/bin"
end
export PATH="$PATH:/usr/local/go/bin"
export PATH="$PATH:$GOPATH/bin"
export PATH="$PATH:$HOME/.local/bin"
export PATH="$PATH:$HOME/.cargo/bin"
export PATH="$PATH:$HOME/.bun/bin"
export PATH="$PATH:$DOTDIR/bin"

