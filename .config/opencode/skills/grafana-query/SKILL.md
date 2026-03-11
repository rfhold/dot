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

## CLI (`grafana-query`)

The `grafana-query` binary provides direct command-line access using `<resource>.<action>` syntax. Output is pretty-printed JSON.

```
grafana-query datasources.list
grafana-query alert-rules.list
grafana-query datasource-alert-rules.list <uid>

grafana-query promql.query <uid> <expr> [--time=<timestamp>]
grafana-query promql.query-range <uid> <expr> --start=<t> --end=<t> --step=<d>

grafana-query logql.query <uid> <expr> [--time=<timestamp>] [--limit=<n>]
grafana-query logql.query-range <uid> <expr> --start=<t> --end=<t> [--limit=<n>] [--direction=forward|backward]

grafana-query traceql.search <uid> <expr> [--limit=<n>] [--start=<t>] [--end=<t>]
grafana-query tempo.trace <uid> <traceID>

grafana-query dashboards.search [--query=<q>] [--tag=<t>] [--limit=<n>] [--page=<n>]
grafana-query dashboards.tags
grafana-query dashboards.get <uid>
grafana-query dashboards.panels <uid>
grafana-query dashboards.create --title=<title> [--uid=<uid>] [--folder=<folderUID>] [--message=<msg>] [--overwrite]
grafana-query dashboards.clone <sourceUID> --title=<title> [--uid=<uid>] [--folder=<folderUID>] [--message=<msg>]
grafana-query dashboards.patch <uid> [--file=<patch.json>] [--message=<msg>] [--overwrite]
grafana-query dashboards.versions <uid> [--limit=<n>] [--start=<n>]
grafana-query dashboards.version-get <uid> <version>
grafana-query dashboards.rollback <uid> <version> [--message=<msg>]

grafana-query panels.add <dashboardUID> [--file=<panel.json>] [--message=<msg>] [--overwrite]
grafana-query panels.update <dashboardUID> <panelID> [--file=<panel.json>] [--message=<msg>] [--overwrite]
grafana-query panels.remove <dashboardUID> <panelID> [--message=<msg>] [--overwrite]
grafana-query panels.render <dashboardUID> <panelID> [--width=<px>] [--height=<px>] [--from=<t>] [--to=<t>] [--theme=light|dark] [--tz=<tz>] [--var=<name>=<value>] [--out=<file.png>]
```

For `dashboards.patch`, `panels.add`, and `panels.update`, JSON is read from `--file=<path>` or stdin if `--file` is omitted.

`panels.render` outputs PNG bytes to stdout unless `--out` is specified.

