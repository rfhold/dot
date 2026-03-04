---
name: waltr-component
description: Reference for creating, modifying, and maintaining Walter platform components (waltr-* repos). Use when creating a new waltr component from the template, adding MCP tools to an existing component, changing component registration type (skill vs mode), updating Tekton pipelines, Kubernetes manifests, or AGENTS.md in any waltr-* repo. Trigger phrases: "new waltr component", "add MCP tool", "waltr-research", "waltr-homeassistant", "waltr-slack", "waltr-opencode", "component registration", "waltr template".
metadata:
  author: rfhold
  category: platform
  source-repos: "rfhold/waltr-component, rfhold/waltr-homeassistant, rfhold/waltr-research, rfhold/waltr-slack, rfhold/waltr-opencode"
  last-commits: "waltr-component:efd83cc4 waltr-homeassistant:b350a151 waltr-research:8a86e27b waltr-slack:daf69e85 waltr-opencode:281cbc0e"
  last-updated: "2026-03-04"
---

# Walter Component Development Reference

> Last updated: 2026-03-04 | Sources: waltr-component `efd83cc4` · waltr-homeassistant `b350a151` · waltr-research `8a86e27b` · waltr-slack `daf69e85` · waltr-opencode `281cbc0e`

All Walter components follow the `waltr-component` template at `git.holdenitdown.net/rfhold/waltr-component`.

## Creating a New Component

Run `init.sh <component-id> [port]` in the template repo. This replaces all placeholder strings throughout files and renames directories:

| Placeholder | Example replacement |
|-------------|---------------------|
| `__COMPONENT_NAME__` | `myfeature-component` |
| `__COMPONENT_ID__` | `myfeature` |
| `__COMPONENT_DISPLAY__` | `My Feature` |
| `__MODULE_NAME__` | `myfeature` |
| `__PORT__` | `9844` |

### Next available port

Assign the next port after existing components:

| Component | Port |
|-----------|------|
| walterd | 9840 |
| research-component | 9841 |
| homeassistant-component | 9842 |
| slack-component | 9843 |
| *(next new component)* | 9844+ |

## Go Module Structure

```
<component-id>/
  main.go              # HTTP server, registration, MCP handler
  go.mod               # module: git.holdenitdown.net/rfhold/<component-id>
  Dockerfile
  manifests/
    base/<component-name>/
      deployment.yaml
      service.yaml      # (if needed)
      configmap.yaml
      kustomization.yaml
    overlays/
      walter/           # production
      walter-preview/   # staging
  .tekton/
    <component-name>-push.yaml
    <component-name>-tag.yaml   # (often same file with tag trigger)
  AGENTS.md             # AI coding instructions for this repo
  integration/          # integration test scenarios
```

## Key Go Dependency

```go
// go.mod
require git.holdenitdown.net/rfhold/walter/walterd v0.3.0
```

This provides the proto-generated gRPC client stubs and the component registration helpers.

## Component Registration Pattern

### Skill (adds tools to an agent, does not replace behavior)

```go
client.RegisterComponent(ctx, &v1.RegisterComponentRequest{
    ComponentId:   "myfeature",
    DisplayName:   "My Feature",
    ComponentUrl:  os.Getenv("COMPONENT_URL"),
    McpServers: &v1.McpServers{
        // Tools available on the support agent
        SupportTools: []*v1.McpServer{{
            Name: "myfeature-tools",
            Url:  os.Getenv("COMPONENT_URL") + "/mcp",
        }},
        // OR tools available on the supervisor agent
        SuperTools: []*v1.McpServer{{
            Name: "myfeature-super",
            Url:  os.Getenv("COMPONENT_URL") + "/mcp",
        }},
    },
    SkillPrompt: "This component provides ...",
})
```

### Mode (replaces support agent behavior entirely, with permission gating)

```go
client.RegisterComponent(ctx, &v1.RegisterComponentRequest{
    ComponentId:  "research",
    DisplayName:  "Research",
    ComponentUrl: os.Getenv("COMPONENT_URL"),
    Modes: []*v1.AgentMode{{
        AgentId:     "support",
        ModeId:      "research",
        DisplayName: "Research Mode",
        SystemPrompt: "You are a research assistant...",
        AllowedTools: []string{"support_web_search", "support_scrape_pages"},
        McpServers: []*v1.McpServer{{
            Name: "research-tools",
            Url:  os.Getenv("COMPONENT_URL") + "/mcp",
        }},
    }},
    // Also expose a tool on supervisor to invoke this mode
    McpServers: &v1.McpServers{
        SuperTools: []*v1.McpServer{{
            Name: "research-super",
            Url:  os.Getenv("COMPONENT_URL") + "/mcp/super",
        }},
    },
})
```

## Environment Variables (standard set)

| Variable | Default | Required |
|----------|---------|----------|
| `WALTER_SERVER_URL` | — | Yes |
| `COMPONENT_URL` | `http://<component-name>:<PORT>` | Yes |
| `LISTEN_ADDR` | `:<PORT>` | No |
| `LOG_LEVEL` | `info` | No |

Component-specific secrets (API tokens, etc.) are mounted from K8s secrets, not ConfigMaps.

## Kubernetes Manifests

### Standard Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <component-name>
spec:
  replicas: 1
  strategy:
    type: Recreate
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
        runAsGroup: 65532
      containers:
        - name: <component-name>
          image: cr.holdenitdown.net/rfhold/<component-name>:latest
          ports:
            - containerPort: <PORT>
          resources:
            requests:
              memory: "64Mi"
              cpu: "50m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          envFrom:
            - configMapRef:
                name: <component-name>-config
          env:
            - name: <SECRET_VAR>
              valueFrom:
                secretKeyRef:
                  name: <component-name>-secrets
                  key: <key>
```

### ConfigMap (standard)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <component-name>-config
data:
  LISTEN_ADDR: ":<PORT>"
  COMPONENT_URL: "http://<component-name>:<PORT>"
  WALTER_SERVER_URL: "http://walterd:9840"
```

### Kustomize Overlays

- `overlays/walter/` — sets namespace `walter` on all resources
- `overlays/walter-preview/` — sets namespace `walter-preview` on all resources

Image tag is updated at deploy time via Tekton: `kustomize edit set image cr.holdenitdown.net/rfhold/<component-name>=cr.holdenitdown.net/rfhold/<component-name>:<revision>`

## Tekton Pipelines

Two pipeline files in `.tekton/`:

### Push pipeline (`<component-name>-push.yaml`)

Triggers on push to `main`, path filter: `**/*.go`, `go.mod`, `go.sum`, `Dockerfile`, `manifests/**`

Steps:
1. `fetch-repository` — inline git clone + checkout
2. `check-image` — `crane` checks if `cr.holdenitdown.net/rfhold/<component-name>:{{ revision }}` exists; result `exists=true` skips build
3. `build-amd64` + `build-arm64` — parallel BuildKit builds (when `check-image` result is `false`)
4. `manifest` — `manifest-tool` creates multi-arch manifest for `:<revision>` and `:latest`
5. `deploy-preview` — `kustomize edit set image` + `kubectl --context pantheon apply` to `walter-preview`, then `rollout status`

### Tag pipeline (`<component-name>-tag.yaml`)

Triggers on `refs/tags/v*`. Same build steps, deploys to `walter` (production) instead.

### Pipeline annotations

```yaml
annotations:
  pipelinesascode.tekton.dev/on-event: "[push]"
  pipelinesascode.tekton.dev/on-target-branch: "[main]"
  pipelinesascode.tekton.dev/max-keep-runs: "2"
  pipelinesascode.tekton.dev/on-path-change: "[**/*.go, go.mod, go.sum, Dockerfile, manifests/**]"
```

`max-keep-runs: "2"` is the current convention (not 5).

## AGENTS.md Convention

Each component repo has an `AGENTS.md` with:
1. Component purpose and architecture
2. Environment variable reference
3. MCP tool descriptions
4. A **Template Maintenance** section listing the template repo and instructions for syncing structural changes

## Existing Components

| Repo | Port | Tools | Registration |
|------|------|-------|--------------|
| `waltr-research` | 9841 | `web_search`, `scrape_pages`, `update_summary`, `research` | Mode (support) + SuperTool (supervisor) |
| `waltr-homeassistant` | 9842 | `ha_entity_status`, `ha_lights_temperature_status`, `ha_system_status`, `ha_light_control`, `ha_climate_control`, `ha_entity_control` | Skill (supervisor) |
| `waltr-slack` | 9843 | `slack_get_thread` | Skill (supervisor) |
| `waltr-opencode` | 4096 | — (is an agent, not a component) | Agent (ControlStream) |
| `waltr-git` | — | — | Empty placeholder |
| `waltr-grafana` | — | — | Empty placeholder |

## waltr-homeassistant Notes

- Home Assistant URL: `https://home.holdenitdown.net`
- Token: K8s secret `homeassistant-component-secret`, key `token`
- Loads exposed entities via HA WebSocket API on startup; refreshes every 5 minutes
- Only operates on entities the user has explicitly exposed in HA

## waltr-research Notes

- SearXNG: `https://searxng.holdenitdown.net`
- Firecrawl: `https://firecrawl.holdenitdown.net`
- The `research` SuperTool opens a `SessionStream` to walterd to delegate to support agent in research mode
- Streams progress via MCP progress notifications back to supervisor

## waltr-slack Notes

- Uses Slack user token (`xoxp-...`), not a bot token
- Token: K8s secret `slack-component-secrets`, key `SLACK_USER_TOKEN`
- Parses all Slack thread URL formats including private channels (`G` prefix) and DMs (`D` prefix)
