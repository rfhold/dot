# Container Dev Environment

A portable dev environment built from dotfiles, designed for remote access and AI-assisted development.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Kubernetes Cluster                         │
│  ┌───────────────────────────────────────┐  │
│  │  opencode namespace                   │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  dot container                  │  │  │
│  │  │  - SSH server (port 22)         │  │  │
│  │  │  - opencode web UI              │  │  │
│  │  │  - full dev toolchain           │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## How It Works

### 1. Dotfiles as Code

PyInfra (`configure.py`) declaratively defines the dev environment:
- Fish shell + Fisher plugins
- Neovim, starship, lazygit
- Language runtimes (Go, Rust, Bun, Node via nvm.fish)
- Docker CLI with compose/buildx plugins

### 2. Container Build

The Dockerfile:
1. Starts from `debian:bookworm-slim`
2. Creates user, installs base deps
3. Copies dotfiles and runs `bootstrap.sh`
4. Bootstrap installs runtimes then runs PyInfra
5. Exposes SSH and runs `entrypoint.sh`

Result: A container image with your full dev setup baked in.

### 3. Remote Access

The container runs in Kubernetes with:
- **SSH**: Direct shell access
- **opencode web**: Browser-based AI coding assistant

### 4. Sandbox Script

`bin/sandbox` spawns isolated containers for opencode to experiment in:

```bash
sandbox              # Interactive shell
sandbox <command>    # Run command in container
```

Mounts:
- Current directory at same path
- `~/.local/share/opencode` for session persistence

This lets opencode run untrusted code, install packages, and make changes without affecting the host.

## Key Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Container image definition |
| `bin/bootstrap.sh` | Runtime installation + PyInfra execution |
| `bin/entrypoint.sh` | Starts SSH, then exec's CMD |
| `bin/sandbox` | Spawns isolated dev containers |
| `configure.py` | PyInfra dev environment definition |

## Usage

Build and push:
```bash
./bin/build --push
```

Deploy to cluster:
```bash
kubectl rollout restart deployment -n opencode opencode
```

Local sandbox:
```bash
./bin/sandbox
```
