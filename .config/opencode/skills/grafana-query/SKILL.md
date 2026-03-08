---
name: grafana-query
description: Query Grafana datasources, dashboards, alerts, and observability data. Use when asking about metrics, logs, traces, dashboards, panels, or alert rules in Grafana. Trigger phrases: "grafana", "dashboard", "panel", "datasource", "promql", "logql", "traceql", "tempo", "loki", "prometheus", "alert rule", "grafana_query".
metadata:
  author: rfhold
  category: observability
  source-repo: rfhold/waltr-grafana
---

# Grafana Query Skill

Use `grafana_query` to interact with Grafana. The `action` field selects the operation. An optional `jq` field applies a server-side filter to the result.

## Workflow

1. Call `datasources.list` to find datasource UIDs — you need the UID for all datasource-scoped actions.
2. Use the appropriate query action for the datasource type (Prometheus → promql, Loki → logql, Tempo → traceql/tempo).
3. Use `dashboards.search` or `dashboards.tags` to locate dashboards before fetching or editing.

## Actions

### Datasources

| Action | Required fields | Notes |
|---|---|---|
| `datasources.list` | — | Returns all datasources with their UIDs and types |
| `datasource-alert-rules.list` | `datasourceUID` | Prometheus-native recording/alert rules |
| `alert-rules.list` | — | Grafana provisioning alert rules |

### PromQL (Prometheus / Mimir)

| Action | Required | Optional |
|---|---|---|
| `promql.query` | `datasourceUID`, `expr` | `time` (RFC3339 or Unix) |
| `promql.query_range` | `datasourceUID`, `expr`, `start`, `end`, `step` | — |

`step` uses Prometheus duration syntax: `30s`, `5m`, `1h`.

### LogQL (Loki)

| Action | Required | Optional |
|---|---|---|
| `logql.query` | `datasourceUID`, `expr` | `time`, `limit` |
| `logql.query_range` | `datasourceUID`, `expr`, `start`, `end` | `limit`, `direction` (`forward`/`backward`) |

`direction` defaults to `backward` (newest first).

### TraceQL (Tempo)

| Action | Required | Optional |
|---|---|---|
| `traceql.search` | `datasourceUID`, `query` | `limit`, `start`, `end` |
| `tempo.trace` | `datasourceUID`, `traceID` | — |

### Dashboards

| Action | Required | Optional |
|---|---|---|
| `dashboards.search` | — | `query`, `tag`, `limit`, `page` |
| `dashboards.get` | `dashboardUID` | — |
| `dashboards.tags` | — | — |
| `dashboards.panels` | `dashboardUID` | — |
| `dashboards.create` | `title` | `newUID`, `folderUID`, `message`, `overwrite` |
| `dashboards.clone` | `dashboardUID`, `title` | `newUID`, `folderUID`, `message` |
| `dashboards.patch` | `dashboardUID`, `patch` | `message`, `overwrite` |
| `dashboards.versions` | `dashboardUID` | `limit`, `versionStart` |
| `dashboards.version_get` | `dashboardUID`, `version` | — |
| `dashboards.rollback` | `dashboardUID`, `version` | `message` |

`dashboards.panels` returns `[{id, title, type, datasourceUID, datasourceType, targets}]` — use this to find panel IDs before editing.

`dashboards.patch` does a deep merge, so you only need to send the fields you want to change.

### Panels

| Action | Required | Optional |
|---|---|---|
| `panels.add` | `dashboardUID`, `panel` | `message`, `overwrite` |
| `panels.update` | `dashboardUID`, `panelID`, `panel` | `message`, `overwrite` |
| `panels.remove` | `dashboardUID`, `panelID` | `message`, `overwrite` |
| `panels.render` | `dashboardUID`, `panelID` | `width`, `height`, `from`, `to`, `theme`, `tz`, `vars` |

`panel` is a Grafana panel JSON object.

## jq Filtering

Use the `jq` field to extract specific fields server-side and reduce response size:

```json
{ "action": "datasources.list", "jq": "[.[] | {uid, name, type}]" }
```

```json
{ "action": "promql.query", "datasourceUID": "abc", "expr": "up", "jq": ".data.result[].metric.job" }
```

```json
{ "action": "dashboards.panels", "dashboardUID": "xyz", "jq": "[.[] | select(.type == \"timeseries\")]" }
```

## CLI Mirror

The REST API at `/api/` mirrors all MCP actions for use from the CLI (`grafana-query` tool):

```
GET  /datasources
GET  /alert-rules
GET  /datasource-alert-rules/{uid}
GET  /promql/query/{uid}?expr=...&time=...
GET  /promql/query_range/{uid}?expr=...&start=...&end=...&step=...
GET  /logql/query/{uid}?expr=...&time=...&limit=...
GET  /logql/query_range/{uid}?expr=...&start=...&end=...&limit=...&direction=...
GET  /traceql/search/{uid}?query=...&limit=...&start=...&end=...
GET  /tempo/trace/{uid}/{traceID}
GET  /dashboards?query=...&tag=...
GET  /dashboards/tags
GET  /dashboards/{uid}
GET  /dashboards/{uid}/panels
GET  /dashboards/{uid}/versions
GET  /dashboards/{uid}/versions/{version}
POST /dashboards        (create)
POST /dashboards/clone  (clone)
POST /dashboards/patch  (patch)
POST /dashboards/rollback
GET  /panels/render/{uid}/{panelID}?width=...&height=...&from=...&to=...
POST /panels/add
POST /panels/update
POST /panels/remove
```

All responses are JSON. POST bodies mirror the MCP input fields.
