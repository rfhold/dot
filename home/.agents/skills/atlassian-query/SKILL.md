---
name: atlassian-query
description: Query and manage Atlassian Jira issues and Confluence pages. Use when working with Jira tickets, Confluence docs, or project management tasks. Trigger phrases: "jira", "confluence", "issue", "ticket", "sprint", "atlassian", "atlassian_query".
metadata:
  author: rfhold
  category: project-management
  source-repo: rfhold/waltr-atlassian
  last-commit: ebc6863
  last-updated: "2026-03-17"
---

# Atlassian Query Skill

> Last updated: 2026-03-17 | Source: [rfhold/waltr-atlassian](https://git.holdenitdown.net/rfhold/waltr-atlassian) @ `ebc6863`

Use `atlassian_query` to interact with Jira and Confluence. The `action` field selects the operation.

## Actions

### Jira Issues

| Action | Required fields | Optional fields | Notes |
|---|---|---|---|
| `issues.search` | `jql` | — | JQL search; returns key, summary, status, assignee, priority |
| `issues.get` | `issue_key` | — | Full issue detail including comments |
| `issues.create` | `project`, `issue_type`, `summary` | `description` | Creates a new Jira issue |
| `issues.update` | `issue_key` | `summary`, `description`, `assignee` | Updates issue fields; assignee is an account ID |
| `issues.transition` | `issue_key`, `status` | — | Moves issue to new status; auto-resolves transition ID |
| `issues.comment` | `issue_key`, `body` | — | Adds a comment to an issue |

### Confluence

| Action | Required fields | Notes |
|---|---|---|
| `confluence.search` | `cql` | CQL page search; returns title, space, URL, excerpt |

## Transition notes

`issues.transition` auto-fetches available transitions and matches by name (case-insensitive). If the status name does not match any available transition, the error response lists the valid options.

## CLI (`atlassian-query`)

The `atlassian-query` binary provides direct command-line access. Output is pretty-printed JSON.

```
atlassian-query issues.search <jql>
atlassian-query issues.get <key>
atlassian-query issues.create --project=<key> --type=<type> --summary=<s> [--description=<d>]
atlassian-query issues.update <key> [--summary=<s>] [--description=<d>] [--assignee=<account-id>]
atlassian-query issues.transition <key> <status-name>
atlassian-query issues.comment <key> <body>
atlassian-query confluence.search <cql>
```

Base URL: `https://preview-atlassian-query.holdenitdown.net`
