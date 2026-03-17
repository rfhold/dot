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
3. Use resource-specific actions (`runs.*`, `prs.*`, `issues.*`) with the `org` and `repo` fields.

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

### PRs

| Action | Required | Optional |
|---|---|---|
| `prs.list` | `org`, `repo` | `state` (open/closed/all) |
| `prs.get` | `org`, `repo`, `prNumber` (int) | — |
| `prs.runs` | `org`, `repo`, `prNumber` (int) | — |

### Issues

| Action | Required | Optional |
|---|---|---|
| `issues.list` | `org`, `repo` | `state` (open/closed/all), `labels` (comma-separated) |
| `issues.get` | `org`, `repo`, `issueNumber` (int) | — |

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

gitops-query prs.list <org> <repo> [--state=open|closed|all]
gitops-query prs.get <org> <repo> <number>
gitops-query prs.runs <org> <repo> <number>

gitops-query issues.list <org> <repo> [--state=open|closed|all] [--labels=label1,label2]
gitops-query issues.get <org> <repo> <number>
```
