---
name: walter
description: Reference for the Walter AI agent platform (walterd, alt-agent, tauri-app, waltr-* components). Use when working on the walter repo, waltr-* component repos, understanding the session/agent/component architecture, writing or modifying walterd internals, working on the Tauri desktop app, debugging MCP tool registration, or deploying to the walter/walter-preview namespaces. Trigger phrases: "walter", "walterd", "alt-agent", "waltr", "session service", "agent service", "component registration", "MCP tool", "walter namespace".
metadata:
  author: rfhold
  category: platform
  source-repos: rfhold/walter
  last-commit: dd6d8bbc
  last-updated: "2026-03-04"
---

# Walter Platform Reference

> Last updated: 2026-03-04 | Source: [rfhold/walter](https://git.holdenitdown.net/rfhold/walter) @ `dd6d8bbc`

**Walter** (WALTR — Workflow Agent Layer for Tracking & Reporting) is a self-hosted AI assistant platform. `walterd` is the durable gRPC broker between user clients and AI agent workers.

## Architecture Overview

```
Clients (Tauri desktop, Android) ←→ walterd ←→ Agents (alt-agent, opencode-agent)
                                        ↕
                          Components (research, homeassistant, slack)
                                        ↕
                          MCP tool servers (/mcp/support/, /mcp/super/)
```

- **walterd** persists all session data; clients and agents can disconnect/reconnect with full replay
- **Agents** own the LLM loop; they connect via `AgentService.ControlStream`
- **Components** register via `ComponentService`; they provide MCP tools and/or modes

## Repository Layout (rfhold/walter)

| Path | Contents |
|------|----------|
| `walterd/` | Go backend daemon |
| `alt-agent/` | Go AI agent worker |
| `tauri-app/` | SolidJS + Rust desktop app |
| `walter-client/` | Rust UI business logic / gRPC client |
| `opencode-agent/` | TypeScript legacy agent (being replaced) |
| `proto/walter/v1/` | Protobuf service definitions |
| `manifests/overlays/production` | K8s production manifests (namespace: `walter`) |
| `manifests/overlays/preview` | K8s preview manifests (namespace: `walter-preview`) |

## gRPC Services (proto/walter/v1/)

| Service | Role |
|---------|------|
| `SessionService` | Client-facing bidirectional streaming (connect, send messages, receive parts) |
| `AgentService` | Agent-facing: `ControlStream` for registration/heartbeat, `SessionStream` for session content |
| `ComponentService` | External component registration (research, HA, slack) |
| `VoiceService` | Voice/audio pipeline |
| `RecordingService` | Meeting recording management |
| `BoardService` | Kanban task board |
| `BugReportService` | Bug reporting |
| `SearchService` | Full-text search (MeiliSearch) |
| `ConfigService` | Live configuration management |
| `IngestService` | Knowledge ingestion |
| `StorageService` | Storage abstraction |

Wire protocol: **ConnectRPC** over HTTP/2 with bidirectional streaming.

## walterd Internal Packages

| Package | Purpose |
|---------|---------|
| `agent/` | Agent registry, heartbeat/TTL |
| `board/` | Kanban boards |
| `component/` | External component lifecycle |
| `config/` | Live configuration |
| `indexer/` | MeiliSearch indexing |
| `knowledge/` | Knowledge base with Qwen3 embeddings |
| `mcp/support/` | MCP server for support agent |
| `mcp/super/` | MCP server for supervisor agent |
| `modes/` | Mode/prompt configuration |
| `namer/` | LLM-based session naming |
| `narrator/` | LLM-based voice status narration |
| `recording/` | Audio recording storage |
| `session/` | Session repository (storage + pub/sub) |
| `storage/` | OpenDAL storage abstraction |
| `summarizer/` | LLM-based session/recording summarization |
| `voice/` | Voice pipeline orchestration |
| `whisper/` | WhisperX transcription client |

## Deployment

### Kubernetes Namespaces (pantheon cluster)

| Namespace | Purpose |
|-----------|---------|
| `walter` | Production |
| `walter-preview` | Preview / staging |

### Services Running in `walter` / `walter-preview`

| Service | Image | Port | Role |
|---------|-------|------|------|
| `walterd` | `cr.holdenitdown.net/rfhold/walterd` | 9840 | Core daemon |
| `support-agent` | `cr.holdenitdown.net/rfhold/alt-agent` | — | Agent (AGENT_UID=support) |
| `supervisor-agent` | `cr.holdenitdown.net/rfhold/alt-agent` | — | Agent (AGENT_UID=supervisor) |
| `kokoro-service` | `cr.holdenitdown.net/rfhold/kokoro-service` | — | GPU TTS (CUDA, mars node) |
| `whisper-service` | `cr.holdenitdown.net/rfhold/whisper-service` | — | GPU STT (CUDA, mars node) |

Components (`research`, `homeassistant`, `slack`, `opencode-agent`) deploy in the same namespaces from their own repos.

### Public Endpoints

| URL | Purpose |
|-----|---------|
| `https://walter.holdenitdown.net` | walterd gRPC (production) |
| `https://preview-walter.holdenitdown.net` | walterd gRPC (preview) |
| `https://whisperx.holdenitdown.net` | WhisperX STT |
| `https://kokoro.holdenitdown.net` | Kokoro TTS |

### Storage (OpenDAL, S3-compatible)

- **Production:** buckets on `s3.pantheon.holdenitdown.net`
- **Preview:** separate buckets on `s3.pantheon.holdenitdown.net`
- **Local dev:** local filesystem via OpenDAL fs backend

### NATS

- In-cluster: `nats://nats.nats.svc:4222`
- Used for pub/sub coordination between walterd, agents, and components

## Component Architecture

Components are standalone Go services that:
1. Connect to walterd via `ComponentService.RegisterComponent` (gRPC)
2. Advertise MCP tool servers at a callback URL
3. Are assigned to agents as **skills** (additive tools) or **modes** (full behavior replacement)

### Component Port Assignments

| Component | Port | Namespace service name |
|-----------|------|------------------------|
| walterd | 9840 | `walterd` |
| research-component | 9841 | `research-component` |
| homeassistant-component | 9842 | `homeassistant-component` |
| slack-component | 9843 | `slack-component` |
| opencode-agent | 4096 | `opencode-agent` |

### MCP Endpoints on walterd

- Support agent tools: `http://walterd:9840/mcp/support/`
- Supervisor tools: `http://walterd:9840/mcp/super/`

### Component Registration Types

| Component | Registration | Target Agent |
|-----------|-------------|--------------|
| homeassistant | Skill | supervisor |
| research | Mode (support) + SuperTool | support + supervisor |
| slack | Skill | supervisor |
| opencode-agent | Agent (ControlStream) | — (is the agent) |

## CI/CD (Tekton PAC)

All services use the same two-pipeline pattern:

- **`*-push`**: push to `main` → check-image (skip if exists) → build amd64 + arm64 in parallel → multi-arch manifest → deploy to `walter-preview`
- **`*-tag`**: push `refs/tags/v*` → same build → deploy to `walter` (production)

**Image revision tag:** `{{ revision }}` (full commit SHA used as tag)

Kustomize pins the image tag at deploy time: `kustomize edit set image <image>=<image>:<tag>`.

## External Service Dependencies

| Service | URL | Purpose |
|---------|-----|---------|
| LiteLLM | `litellm.holdenitdown.net` | LLM gateway (narrator, namer, summarizer) |
| MeiliSearch | `meilisearch.holdenitdown.net` | Full-text search indexing |
| Qwen3-Embedding | `qwen3-embedding.holdenitdown.net` | Semantic embeddings for knowledge |
| SearXNG | `searxng.holdenitdown.net` | Web search (via research component) |
| Firecrawl | `firecrawl.holdenitdown.net` | Web scraping (via research component) |
| Home Assistant | `home.holdenitdown.net` (`172.16.1.10`) | Smart home (via HA component) |
| Telemetry | `telemetry.holdenitdown.net:4317` | OTLP traces/metrics/logs |

## LLM Configuration (default fast model)

`walterd` narrator/namer/summarizer defaults to Cerebras via LiteLLM: `cerebras/zai-org/zai-glm-4.7`

## Observability

All Go services export OpenTelemetry to `telemetry.holdenitdown.net:4317` (OTLP). Grafana at `grafana.holdenitdown.net`.

## Local Dev (docker-compose)

- `docker-compose.yml` — core stack: NATS, Grafana LGTM, walterd, support-agent, supervisor-agent
- `docker-compose.research.yml` — add research-component
- `docker-compose.homeassistant.yml` — add HA component

## Release / Versioning

`git-cliff` computes semver bumps from conventional commits. Tekton creates the tag, builds images, and deploys to production automatically on tag push.

## Android Client

APK built on tag push via Tekton, released to Forgejo, distributed via Obtainium (F-Droid-style). Uses the `android-keystore` secret in `pipelines-as-code` namespace.
