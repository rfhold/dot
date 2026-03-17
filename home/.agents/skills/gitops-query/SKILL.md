---
name: gitops-query
description: Query CI runs, pull requests, issues, and repositories across GitHub, Gitea/Forgejo, and Tekton. Use when asking about CI pipeline runs, PR status, issues, or repo listings. Trigger phrases: "gitops", "CI run", "pipeline run", "pull request", "PR status", "gitops_query", "runs.list", "prs.list".
metadata:
  author: rfhold
  category: gitops
  source-repo: rfhold/waltr-gitops
  last-commit: 726803e
  last-updated: "2026-03-17"
---

# GitOps Query Skill

> Last updated: 2026-03-17 | Source: [rfhold/waltr-gitops](https://git.holdenitdown.net/rfhold/waltr-gitops) @ `726803e`

Use `gitops_query` to query CI runs, pull requests, issues, and repositories across GitHub, Gitea/Forgejo, and Tekton. The `action` field selects the operation.

## Workflow

1. Call `orgs.list` to discover available org IDs — you need the `org` field for all other actions.
2. Call `repos.list` to enumerate repositories within an org.
3. Use resource-specific actions (`runs.*`, `prs.*`, `issues.*`) with the `org` and optional `repo` fields.

## Note on `org`

The `org` field is the organization/namespace identifier configured in the gitops component. For Tekton it maps to the Kubernetes namespace. Use `orgs.list` to find valid values.

## Actions

### Orgs & Repos

| Action | Required | Optional |
|---|---|---|
| `orgs.list` | — | — |
| `repos.list` | `org` | — |

### Runs

| Action | Required | Optional |
|---|---|---|
| `runs.list` | `org`, `repo` | `status` (queued/in_progress/completed), `branch`, `workflow` |
| `runs.get` | `org`, `repo`, `runID` | — |
| `runs.jobs` | `org`, `repo`, `runID` | — |
| `runs.logs` | `org`, `repo`, `runID` | `jobID` |
| `runs.wait` | `org`, `repo`, `runID` | `timeout` (int, seconds, default 300) |
| `runs.rerun` | `org`, `repo`, `runID` | — |
| `runs.cancel` | `org`, `repo`, `runID` | — |

`runs.logs` returns plain text log output. All other actions return JSON.

`runs.rerun` and `runs.cancel` return `{"status": "rerun triggered"}` / `{"status": "cancel triggered"}` on success.

### Pipelines

| Action | Required | Optional |
|---|---|---|
| `pipelines.list` | `org` | `repo` (required for GitHub/Gitea; ignored for Tekton) |
| `pipelines.dispatch` | `org`, `repo`, `workflow` | `ref` (branch/tag/SHA), `params` (key/value map) |

### PRs

| Action | Required | Optional |
|---|---|---|
| `prs.list` | `org` | `repo`, `state` (open/closed/all), `author` |
| `prs.get` | `org`, `repo`, `prNumber` (int) | — |
| `prs.runs` | `org`, `repo`, `prNumber` (int) | — |

When `repo` is omitted, `prs.list` fans out across all repos in the org and returns a merged list. Use `author` to filter by PR author username (e.g. `"author": "rfhold"`).

### Issues

| Action | Required | Optional |
|---|---|---|
| `issues.list` | `org` | `repo`, `state` (open/closed/all), `labels` (comma-separated), `author` |
| `issues.get` | `org`, `repo`, `issueNumber` (int) | — |

When `repo` is omitted, `issues.list` fans out across all repos in the org and returns a merged list. Use `author` to filter by issue author username.

## CLI (`gitops-query`)

The `gitops-query` binary provides direct command-line access using `<resource>.<action>` dotted syntax. Output is pretty-printed JSON except `runs.logs` which outputs plain text.

```
gitops-query orgs.list
gitops-query repos.list <org>

gitops-query runs.list <org> <repo> [--status=<status>] [--branch=<branch>] [--workflow=<workflow>]
gitops-query runs.get <org> <repo> <runID>
gitops-query runs.jobs <org> <repo> <runID>
gitops-query runs.logs <org> <repo> <runID> [--job=<jobID>]
gitops-query runs.wait <org> <repo> <runID> [--timeout=<secs>]
gitops-query runs.rerun <org> <repo> <runID>
gitops-query runs.cancel <org> <repo> <runID>

gitops-query pipelines.list <org> [<repo>]
gitops-query pipelines.dispatch <org> <repo> <workflow> [--ref=<branch>] [--param=key=value ...]

gitops-query prs.list <org> [<repo>] [--state=open|closed|all] [--author=<username>]
gitops-query prs.get <org> <repo> <number>
gitops-query prs.runs <org> <repo> <number>

gitops-query issues.list <org> [<repo>] [--state=open|closed|all] [--labels=label1,label2] [--author=<username>]
gitops-query issues.get <org> <repo> <number>
```

## MCP/JSON Examples

```json
{"action": "pipelines.list", "org": "tekton"}
{"action": "pipelines.list", "org": "rfhold", "repo": "waltr-gitops"}
{"action": "pipelines.dispatch", "org": "rfhold", "repo": "waltr-gitops", "workflow": "ci.yml", "ref": "main"}
{"action": "pipelines.dispatch", "org": "tekton", "repo": "waltr-gitops", "workflow": "build-push", "ref": "main", "params": {"imageTag": "v1.2.3"}}
```
