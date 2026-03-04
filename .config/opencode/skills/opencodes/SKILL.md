---
name: opencodes
description: Reference for the opencodes multi-machine opencode session monitoring system (rfhold/opencodes repo). Use when working on the opencodes server, TUI, tray app, or plugin; understanding how opencode instances register and report state; debugging session tracking; or deploying to the opencodes namespace on pantheon. Trigger phrases: "opencodes", "opencode session monitor", "opencode tray", "opencodes server", "opencodes plugin", "session tracking across machines".
metadata:
  author: rfhold
  category: tooling
  source-repo: rfhold/opencodes
  last-commit: a5fe1733
  last-updated: "2026-03-04"
---

# OpenCodes Reference

> Last updated: 2026-03-04 | Source: [rfhold/opencodes](https://git.holdenitdown.net/rfhold/opencodes) @ `a5fe1733`

**opencodes** is a hub-and-spoke system for monitoring and controlling opencode AI coding sessions across multiple machines.

Repo: `git.holdenitdown.net/rfhold/opencodes`  
Go module root: `github.com/rfhold/opencodes` (workspace with `server/`, `tui/`, `tray/`, `proto/`)

## Architecture

```
opencode instance (machine A)          opencode instance (machine B)
        ↓ plugin (WebSocket)                   ↓ plugin (WebSocket)
        └──────────────── opencodes-server ────┘
                            (port 9091 WS, 9090 gRPC)
                                    ↓ gRPC
                          TUI (Bubble Tea)  /  Tray (systray)
```

- **plugin** — TypeScript/Bun opencode plugin running inside each opencode instance; connects to server via WebSocket, relays commands back to local opencode HTTP API
- **server** — central Go server; accepts plugin connections, subscribes to each opencode instance's SSE stream, persists state in SQLite, exposes gRPC API
- **TUI** — Bubble Tea terminal UI; connects to gRPC API; split-pane view of instances + sessions; send messages, abort, respond to permission requests
- **tray** — macOS/Linux system tray (fyne/systray); connects to gRPC API; session status in menu bar; system notifications; can launch TUI

## Deployment

- **Cluster:** `pantheon` (kubectl context)
- **Namespace:** `opencodes`
- **Public URL:** `opencodes.holdenitdown.net` (gRPC via HTTPRoute → Gateway API)
- **Image:** `cr.holdenitdown.net/rfhold/opencodes-server:latest`

### Key Manifest Resources

| Resource | Details |
|----------|---------|
| Deployment | 1 replica; ports 9090 (gRPC h2c) and 9091 (WS); UID 65532; 512Mi/1CPU limits |
| PVC | `opencodes-data`, 1Gi, mounted at `/data` for SQLite (`/data/opencodes.db`) |
| Service | ClusterIP; port 9090 `appProtocol: kubernetes.io/h2c`, port 9091 WS |
| HTTPRoute | `opencodes.holdenitdown.net` → port 9090; timeout `0s` for streaming gRPC |

### CI/CD

Single Tekton pipeline `.tekton/opencodes-server-push.yaml`:
- Trigger: push to `main`, path filter: `server/**`, `manifests/**`
- Tasks: fetch → build-amd64 + build-arm64 (parallel) → multi-arch manifest → deploy to `opencodes` namespace
- Node: pinned to `apollo` (nodeSelector)
- `max-keep-runs: "5"`

## Plugin

**Install path:** `~/.config/opencode/plugins/opencodes.js`

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODES_SERVER_URL` | `ws://opencodes.local:9091` | WebSocket URL of the central server |

**What it does:**
1. On load: connects to server via WebSocket, registers instance (ID, project directory, local opencode HTTP URL)
2. Server subscribes to the local opencode SSE stream (`/event`) to track session lifecycle
3. Plugin receives command frames from server and relays them to local opencode HTTP API:
   - `POST /session/{id}/prompt_async` — send a message
   - `POST /session/{id}/abort` — abort a session
   - `POST /session/{id}/permissions/{permId}` — respond to a permission request

## Server

**Go binary:** `opencodes-server`

**Ports:**
- `9090` — gRPC API (ConnectRPC / h2c) for TUI and tray clients
- `9091` — WebSocket for plugin connections

**Database:** SQLite at `DB_PATH` (default: `~/.local/share/opencodes/opencodes.db`, production: `/data/opencodes.db`)

**Health check:** `opencodes-server -healthcheck` (exits 0 if healthy)

## TUI

Bubble Tea terminal UI. Connects to `localhost:9090` (hardcoded, no env var). Split-pane:
- Left: list of registered opencode instances
- Right: sessions for selected instance
- Actions: send message, abort session, respond to permission requests

## Tray

System tray app (macOS/Linux). Connects to `localhost:9090` (hardcoded). Shows session status in menu bar, sends OS notifications on status transitions. Launches TUI via `OPENCODES_TERMINAL` env var or falls back to `kitty`, `gnome-terminal`, `xterm`, or `open -a Terminal` on macOS.

## Proto API

Defined in `proto/opencodes.proto`. Key RPCs:
- `WatchInstances` — streaming list of connected opencode instances
- `WatchSessions` — streaming session state for an instance
- `SendMessage` — send a prompt to a session
- `AbortSession` — abort a running session
- `RespondPermission` — approve/deny a tool permission request
