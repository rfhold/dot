---
name: gitea-tea
description: Using the tea CLI to interact with the Gitea instance at git.holdenitdown.net. Invoked when managing repositories, issues, pull requests, releases, labels, milestones, notifications, or branches on Gitea, or when performing git-forge operations beyond what gh provides.
---

# Gitea Tea CLI

Use this skill when interacting with the Gitea instance at `git.holdenitdown.net` via the `tea` command-line tool. Tea is the official CLI for Gitea/Forgejo servers, similar to GitHub's `gh` CLI.

## Environment

| Item | Value |
|---|---|
| Gitea instance | `https://git.holdenitdown.net` |
| User | `rfhold` |
| Auth token env var | `GITEA_ACCESS_TOKEN` |
| Token scopes | `write:repository`, `write:issue`, `write:package`, `write:notification`, `write:misc`, `write:activitypub`, `read:organization`, `read:user` |
| Tea binary | `tea` (Arch `extra` package, installed by `configure.py`) |
| Tea config | `~/.config/tea/` |

## Initial Login Setup

If tea is not yet logged in, configure it before first use:

```bash
tea login add \
  --name holdenitdown \
  --url https://git.holdenitdown.net \
  --token "$GITEA_ACCESS_TOKEN" \
  --no-version-check
```

Verify with:

```bash
tea whoami
```

Tea does **not** read environment variables for authentication. It stores credentials in `~/.config/tea/`. The login must be configured once per machine.

## Context Detection

When run inside a git repository whose remote points to `git.holdenitdown.net`, tea auto-detects the login and repo context. You can override with:

- `--login holdenitdown` -- select a specific login
- `--repo owner/repo` -- target a specific repository
- `--remote origin` -- detect context from a specific git remote

## Output Formatting

Tea supports machine-readable output via `--output` / `-o`:

| Format | Flag |
|---|---|
| Table (default) | `--output table` |
| JSON | `--output json` |
| YAML | `--output yaml` |
| CSV | `--output csv` |
| TSV | `--output tsv` |
| Simple | `--output simple` |

Use `--fields` / `-f` to select columns:

```bash
tea issues ls --output json --fields index,title,state,labels
```

When scripting or parsing output, always use `--output json`.

## Pagination

List commands support pagination:

```bash
tea issues ls --limit 50 --page 2
```

Default limit is 30 items per page.

## Command Reference

### Repositories

```bash
# List your repos
tea repos ls
tea repos ls --output json

# Search repos on the instance
tea repos search QUERY
tea repos search QUERY --owner rfhold

# Fork a repo
tea repos fork
tea repos fork --owner myorg

# Clone
tea clone owner/repo

# Delete (requires confirmation)
tea repos delete --name myrepo --owner rfhold --force
```

Available fields: `description`, `forks`, `id`, `name`, `owner`, `stars`, `ssh`, `updated`, `url`, `permission`, `type`

### Issues

```bash
# List issues
tea issues ls
tea issues ls --state closed
tea issues ls --state all
tea issues ls --labels "bug,urgent"
tea issues ls --milestones "v1.0"
tea issues ls --assignee rfhold
tea issues ls --keyword "search term"
tea issues ls --output json --fields index,title,state,labels,assignees

# Create an issue
tea issues create --title "Bug report" --description "Details"
tea issues create --title "Task" --labels "enhancement" --assignees "rfhold"
tea issues create --title "Task" --milestone "v2.0" --deadline "2025-12-31"

# Edit an issue
tea issues edit 42 --title "New title"
tea issues edit 42 --add-labels "priority:high"
tea issues edit 42 --remove-labels "wontfix"
tea issues edit 42 --add-assignees "rfhold"

# Close / Reopen
tea issues close 42
tea issues close 42 43 44          # close multiple
tea issues reopen 42

# Comment on an issue
tea comment 42 "Comment text"
```

Available fields: `index`, `state`, `kind`, `author`, `url`, `title`, `body`, `created`, `updated`, `deadline`, `assignees`, `milestone`, `labels`, `comments`

### Pull Requests

```bash
# List PRs
tea pulls ls
tea pr ls --state closed
tea pr ls --state all
tea pr ls --output json --fields index,title,state,author,mergeable

# Create a PR
tea pulls create --title "Feature X" --base main --head feature-branch
tea pr c --title "Fix" --base main --description "Details"
tea pr c --title "PR" --labels "review" --assignees "rfhold"

# Checkout a PR locally
tea pulls checkout 42
tea pr co 42

# Review / Approve / Reject
tea pulls approve 42
tea pulls reject 42

# Merge a PR
tea pulls merge 42                         # merge commit (default)
tea pulls merge 42 --style squash
tea pulls merge 42 --style rebase

# Close without merging
tea pulls close 42

# Clean up merged PR branch
tea pulls clean 42
```

Available fields: `index`, `state`, `author`, `url`, `title`, `body`, `mergeable`, `base`, `head`, `created`, `updated`, `labels`, `milestone`, `assignees`, `comments`

### Releases

```bash
# List releases
tea releases ls
tea releases ls --output json

# Create a release
tea releases create --tag v1.0.0 --title "Version 1.0.0"
tea releases create --tag v1.0.0 --title "Release" --note "Release notes"
tea releases create --tag v1.0.0 --title "Release" --note-file CHANGELOG.md
tea releases create --tag v1.0.0 --title "Release" --draft
tea releases create --tag v1.0.0 --title "Release" --prerelease
tea releases create --tag v1.0.0 --title "Release" --asset ./binary.tar.gz

# Edit a release
tea releases edit v1.0.0 --title "New Title" --note "Updated notes"

# Delete a release
tea releases delete v1.0.0 --confirm
tea releases delete v1.0.0 --confirm --delete-tag

# Manage assets
tea releases assets ls v1.0.0
tea releases assets create v1.0.0 ./file.tar.gz
tea releases assets delete v1.0.0 asset-name --confirm
```

### Labels

```bash
tea labels ls
tea labels ls --output json
tea labels create --name "bug" --color "#d73a4a"
tea labels create --name "enhancement" --color "#a2eeef" --description "New feature"
tea labels delete --id 1
```

### Milestones

```bash
tea milestones ls
tea ms ls --state closed --output json
tea ms ls --fields title,state,items_open,items_closed,duedate

tea ms create --title "v2.0" --description "Next major" --deadline "2025-12-31"
tea ms close "v2.0"
tea ms reopen "v2.0"
tea ms delete "v2.0"

# Manage issues within a milestone
tea ms issues "v2.0"
tea ms add "v2.0" 42
tea ms remove "v2.0" 42
```

### Branches

```bash
tea branches ls
tea branches ls --output json --fields name,protected,user-can-push
tea branches protect main
tea branches unprotect main
```

### Notifications

```bash
tea notifications ls
tea n ls --states "unread,pinned"
tea n ls --types "issue,pull"
tea n ls --mine                    # across all repos
tea n read                         # mark all as read
tea n read 123                     # mark specific
tea n pin 123
```

### Time Tracking

```bash
tea times ls
tea times ls --mine --total
tea times add ISSUE_INDEX DURATION
tea times delete TIME_ID
tea times reset ISSUE_INDEX
```

### Organizations

```bash
tea org ls
tea org ls --output json
```

### Utility

```bash
# Open current repo/issue in browser
tea open
tea open 42

# Show authenticated user
tea whoami

# Manage logins
tea login ls
tea login default holdenitdown
```

## Scripting Patterns

### JSON output for parsing

```bash
tea issues ls --output json | jq '.[].title'
tea repos ls -o json | jq '.[] | {name: .name, ssh: .ssh}'
```

### Target a specific repo without being in the directory

```bash
tea issues ls --login holdenitdown --repo rfhold/dot --output json
```

### Create an issue and capture the number

```bash
ISSUE=$(tea issues create --title "Title" --description "Body" --output json | jq -r '.index')
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `unknown command` | tea not installed | Run `configure.py` or install manually from `gitea.com/gitea/tea/releases` |
| `No login available` | No stored login | Run `tea login add` with the setup command above |
| `token does not have required scope` | Token missing permissions | Generate new token in Gitea with required scopes |
| `could not determine repo` | Not in a git repo with Gitea remote | Use `--repo owner/repo` flag explicitly |
