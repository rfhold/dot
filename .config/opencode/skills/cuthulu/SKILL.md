---
name: cuthulu
description: Reference for the cuthulu multi-machine opencode session monitoring system (rfhold/cuthulu repo). Use when working on the cuthulu server, Cuthulu Tauri app, tmux-agent, or plugin; understanding how opencode instances register and report state; debugging session tracking; or deploying to the cuthulu namespace on pantheon. Trigger phrases: "cuthulu", "opencode session monitor", "cuthulu server", "cuthulu plugin", "session tracking across machines", "tmux agent".
metadata:
  author: rfhold
  category: tooling
  source-repo: rfhold/cuthulu
  last-commit: bc705d62
  last-updated: "2026-03-08"
---

# Cuthulu Reference

> Last updated: 2026-03-08 | Source: [rfhold/cuthulu](https://git.holdenitdown.net/rfhold/cuthulu) @ `bc705d62`

**cuthulu** is a hub-and-spoke system for monitoring and controlling opencode AI coding sessions across multiple machines.

Repo: `git.holdenitdown.net/rfhold/cuthulu`  
Go module root: `git.holdenitdown.net/rfhold/cuthulu` (workspace with `server/`, `cli/`, `tmux-agent/`, `proto/`)

## Architecture

```
opencode instance (machine A)          opencode instance (machine B)
        ↓ plugin (Unix socket)                 ↓ plugin (Unix socket)
        └───────── Cuthulu (Tauri desktop app) ┘
                     ↓ gRPC (port 9090)
                 cuthulu-server
                     ↑ Unix socket IPC
           cuthulu-tmux (tmux-agent binary)
                     ↑ tmux hooks
             tmux-plugin (TPM plugin)
```

- **plugin** — TypeScript/Bun opencode plugin running inside each opencode instance; connects to Cuthulu via Unix socket (newline-delimited JSON), relays session events; receives command frames back
- **app (Cuthulu)** — Tauri (Rust + SolidJS) desktop app; acts as local hub: accepts plugin connections via Unix socket, forwards state to server via gRPC, shows session status in system tray, sends OS notifications, embeds the tmux IPC daemon
- **server** — central Go server; receives state from Cuthulu instances via gRPC, persists in SQLite, exposes gRPC API for other clients
- **tmux-agent** — standalone `cuthulu-tmux` Go binary; client-side tmux bridge invoked by tmux hooks; communicates with the Cuthulu daemon via Unix socket IPC
- **tmux-plugin** — TPM plugin script that hooks tmux events to call `cuthulu-tmux`

## Deployment

- **Cluster:** `pantheon` (kubectl context)
- **Namespace:** `cuthulu`
- **Public URL:** `cuthulu.holdenitdown.net` (gRPC via HTTPRoute → Gateway API)
- **Image:** `cr.holdenitdown.net/rfhold/cuthulu-server:latest`

### Key Manifest Resources

| Resource | Details |
|----------|---------|
| Deployment | 1 replica; port 9090 (gRPC h2c); UID 65532; 512Mi/1CPU limits |
| PVC | `cuthulu-data`, 1Gi, mounted at `/data` for SQLite (`/data/cuthulu.db`) |
| Service | ClusterIP; port 9090 `appProtocol: kubernetes.io/h2c` |
| HTTPRoute | `cuthulu.holdenitdown.net` → port 9090; timeout `0s` for streaming gRPC |

### CI/CD

Single Tekton pipeline `.tekton/cuthulu-server-push.yaml`:
- Trigger: push to `main`, path filter: `server/**`, `manifests/**`
- Tasks: fetch → build-amd64 + build-arm64 (parallel) → multi-arch manifest → deploy to `cuthulu` namespace
- Node: pinned to `apollo` (nodeSelector)
- `max-keep-runs: "5"`

## Plugin

**Install path:** `~/.config/opencode/plugins/cuthulu.js`

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `CUTHULU_SOCKET_PATH` | `$XDG_RUNTIME_DIR/cuthulu-plugin.sock` (or `/tmp/cuthulu-plugin.sock`) | Unix socket path for the Cuthulu daemon |

**What it does:**
1. On load: connects to Cuthulu daemon via Unix socket, registers instance (ID, project directory, local opencode HTTP URL, hostname, tmux session/window/pane)
2. Forwards session lifecycle events to the daemon as they occur (newline-delimited JSON)
3. Receives command frames from the daemon and relays them to local opencode HTTP API:
   - `POST /session/{id}/prompt_async` — send a message
   - `POST /session/{id}/abort` — abort a session
   - `POST /session/{id}/permissions/{permId}` — respond to a permission request

## Server

**Go binary:** `cuthulu-server`

**Ports:**
- `9090` — gRPC API (ConnectRPC / h2c) for Cuthulu and CLI clients

**Database:** SQLite at `DB_PATH` (default: `~/.local/share/cuthulu/cuthulu.db`, production: `/data/cuthulu.db`)

**Health check:** `cuthulu-server -healthcheck` (exits 0 if healthy)

## Cuthulu (app/)

Tauri (Rust + SolidJS) desktop app. Replaced the old Go `tray/` and `tui/` binaries. Connects to the cuthulu gRPC server, shows session status in the system tray, sends OS notifications on status transitions. Embeds a Unix socket IPC daemon (in `src-tauri/src/tray.rs`) that receives tmux state updates from the `cuthulu-tmux` binary.

**Build/install:** `make install-app`  
**Distribute:** `make upload-app-release` (builds macOS `.tar.gz`, creates Forgejo release)

## tmux-agent (tmux-agent/)

**Go binary:** `cuthulu-tmux`

Subcommands: `connect`, `detach`, `notify`, `stub-window`, `status`

Invoked by tmux hooks (via `tmux-plugin`). Sends IPC messages over a Unix socket to the Cuthulu daemon, which aggregates tmux state and forwards it to the server.

**Build:** `make build-tmux-agent`  
**Install:** `make install-tmux-plugin` (also builds linux-amd64 variant)  
**Sign (macOS):** `make sign-tmux-agent`

## tmux-plugin (tmux-plugin/)

TPM plugin (`cuthulu-tmux.tmux`). Registers tmux hooks (`client-attached`, `session-created`, `session-closed`, `window-linked/unlinked/renamed`, `session-window-changed`, `client-session-changed`) that call `cuthulu-tmux`. Binds `prefix+R` to manually resync.

## Proto API

Defined in `proto/cuthulu.proto`. Key RPCs:
- `WatchInstances` — streaming list of connected opencode instances
- `WatchSessions` — streaming session state for an instance
- `SendMessage` — send a prompt to a session
- `AbortSession` — abort a running session
- `RespondPermission` — approve/deny a tool permission request
- `LaunchSession` — launch a new opencode session on a remote machine via tmux agent (partially scaffolded)
