# Tasks: auto-update-opencode-plugin-pins

**Status**: approved; execution in progress

## Coverage Matrix

| Requirement | Tasks |
|---|---|
| `opencode-config` MODIFIED Requirement: Plugin Activation Scope | 1.1, 2.1 |
| `opencode-config` ADDED Requirement: Scheduled Plugin Pin Updates | 2.1, 2.2 |
| `opencode-config` ADDED Requirement: Dot-Owned Scheduler Deployment | 2.2, 3.1, 3.2 |
| `rfhold-mcp-config` MODIFIED Requirement: rfhold MCP Server Set | 1.1 |
| `rfhold-mcp-config` MODIFIED Requirement: Preview Endpoint Mapping | 1.1 |
| `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only Activation Scope | 1.1, 1.2 |
| `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only superspec Plugin | 1.1, 2.1 |
| `rfhold-mcp-config` MODIFIED Requirement: Cfaintl Plugin Skill Filtering | 1.1, 1.2 |
| `rfhold-mcp-config` MODIFIED Requirement: Org-Level Plugin List | 1.1, 2.1 |
| `rfhold-mcp-config` ADDED Requirement: Static Org Agent Directories | 1.1, 1.2 |

## AGENTS.md Notes

- No `AGENTS.md` files exist at the dot repo root, `docs/specs/`, or the affected spec domain directories.
- `/home/rfhold/dot/.config/opencode/AGENTS.md`: do not add `Co-authored-by` trailers; do not use emojis unless requested; keep comments terse; treat broken config as something to fix.

## Stage 1: Static Org Configuration

Wait for the results from prior tasks before starting dependent sub agent tasks.

### Task 1.1: Add static org AI tool configuration

- **Implements**: `opencode-config` MODIFIED Requirement: Plugin Activation Scope; `rfhold-mcp-config` MODIFIED Requirement: rfhold MCP Server Set; `rfhold-mcp-config` MODIFIED Requirement: Preview Endpoint Mapping; `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only Activation Scope; `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only superspec Plugin; `rfhold-mcp-config` MODIFIED Requirement: Cfaintl Plugin Skill Filtering; `rfhold-mcp-config` MODIFIED Requirement: Org-Level Plugin List; `rfhold-mcp-config` ADDED Requirement: Static Org Agent Directories
- **Depends on**: none
- **Files**: `opencode.jsonc`, `home/repos/rfhold/.envrc`, `home/repos/rfhold/.agents/AGENTS.md`, `home/repos/rfhold/.agents/CLAUDE.md`, `home/repos/rfhold/.agents/opencode.jsonc`, `home/repos/rfhold/.agents/.claude.json`, `home/repos/cfaintl/.envrc`, `home/repos/cfaintl/.agents/AGENTS.md`, `home/repos/cfaintl/.agents/CLAUDE.md`, `home/repos/cfaintl/.agents/opencode.jsonc`, `home/repos/cfaintl/.agents/.claude.json`
- **Approach**: Move org-specific OpenCode plugin delivery into checked-in dot content under `home/repos/<org>/`. Keep `superspec` in the dot project config, remove rfhold query plugins from the dot project config, add the canonical ordered rfhold plugin array to static `rfhold/.agents/opencode.jsonc` without a top-level `mcp` stanza, add static rfhold Claude MCP entries for `gitops`, `slack`, and `grafana` using the approved preview URLs and `type` value `http`, and add static cfaintl plugin configuration tracking `git+ssh://git@github.com/cfaintl/skills.git#main` with include filters exactly matching the prior allowlist. Preserve cfaintl npm registry env vars in static `.envrc` content.
- **Dispatch**: subagent

### Task 1.2: Replace generated org agents behavior with static links

- **Implements**: `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only Activation Scope; `rfhold-mcp-config` MODIFIED Requirement: Cfaintl Plugin Skill Filtering; `rfhold-mcp-config` ADDED Requirement: Static Org Agent Directories
- **Depends on**: 1.1
- **Files**: `configure.py`
- **Approach**: Remove org-level skills repo clone, whitelist materialization, generated `AGENTS.md`, generated `CLAUDE.md`, generated `.envrc`, generated `opencode.jsonc`, and generated `.claude.json` writes from the `skills` tag path. Link checked-in `home/repos/<org>/` content into `~/repos/<org>/` through dot link behavior, and make the `.agents` path replace or back up a pre-existing real directory instead of recursively merging children. Keep any non-org global `home/.agents/skills` behavior unchanged.
- **Dispatch**: subagent

### Task 1.3: Add static configuration validation helper

- **Implements**: `opencode-config` MODIFIED Requirement: Plugin Activation Scope; `rfhold-mcp-config` MODIFIED Requirement: rfhold MCP Server Set; `rfhold-mcp-config` MODIFIED Requirement: Preview Endpoint Mapping; `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only superspec Plugin; `rfhold-mcp-config` MODIFIED Requirement: Cfaintl Plugin Skill Filtering; `rfhold-mcp-config` MODIFIED Requirement: Org-Level Plugin List; `rfhold-mcp-config` ADDED Requirement: Static Org Agent Directories
- **Depends on**: 1.1, 1.2
- **Files**: `scripts/validate-opencode-plugin-config.ts`
- **Approach**: Add a small Bun TypeScript validation helper that parses the dot-owned JSON/JSONC config files and asserts the static rfhold plugin order, absence of plugin-owned inline OpenCode MCP stanzas, rfhold Claude preview URLs, cfaintl `main` plugin reference, exact cfaintl include filter list, and absence of generated org-local `skills-src` or generated whitelist content in checked-in static org `.agents` directories. Do not add new Python automation.
- **Dispatch**: subagent

### Stage Verification

- **Commands**:
  ```bash
  git diff --check -- configure.py opencode.jsonc home/repos scripts/validate-opencode-plugin-config.ts docs/specs/changes/auto-update-opencode-plugin-pins
  bun run scripts/validate-opencode-plugin-config.ts
  ```
- **Expected outcome**: whitespace checks pass; the Bun validation helper exits 0 after confirming static org config, plugin scope, Claude preview MCP entries, cfaintl include filters, and static `.agents` link assumptions.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-06
- **Commands**:
  ```bash
  git diff --check -- configure.py opencode.jsonc home/repos scripts/validate-opencode-plugin-config.ts docs/specs/changes/auto-update-opencode-plugin-pins
  bun run scripts/validate-opencode-plugin-config.ts
  ```
- **Output**:
  ```text
  OpenCode plugin config validation passed.
  ```
- **Files changed (across the stage)**:
  - `configure.py`
  - `opencode.jsonc`
  - `home/repos/rfhold/.envrc`
  - `home/repos/rfhold/.agents/AGENTS.md`
  - `home/repos/rfhold/.agents/CLAUDE.md`
  - `home/repos/rfhold/.agents/opencode.jsonc`
  - `home/repos/rfhold/.agents/.claude.json`
  - `home/repos/cfaintl/.envrc`
  - `home/repos/cfaintl/.agents/AGENTS.md`
  - `home/repos/cfaintl/.agents/CLAUDE.md`
  - `home/repos/cfaintl/.agents/opencode.jsonc`
  - `home/repos/cfaintl/.agents/.claude.json`
  - `scripts/validate-opencode-plugin-config.ts`
  - `docs/specs/changes/auto-update-opencode-plugin-pins/tasks.md`
- **AGENTS.md notes applied**: no `Co-authored-by` trailers; no emojis; terse comments; broken config treated as in scope to fix.
- **Subagent statuses**:
  - Task 1.1: DONE
  - Task 1.2: DONE
  - Task 1.3: DONE

- [x] Stage 1 complete

---

## Stage 2: Pin Updater Pipeline

Wait for the results from prior tasks before starting dependent sub agent tasks.

### Task 2.1: Implement OpenCode plugin pin updater

- **Implements**: `opencode-config` MODIFIED Requirement: Plugin Activation Scope; `opencode-config` ADDED Requirement: Scheduled Plugin Pin Updates; `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only superspec Plugin; `rfhold-mcp-config` MODIFIED Requirement: Org-Level Plugin List
- **Depends on**: Stage 1
- **Files**: `scripts/update-opencode-plugin-pins.ts`, `scripts/update-opencode-plugin-pins.test.ts`
- **Approach**: Add a Bun TypeScript updater that scans current dot-owned OpenCode config layers, including global, dot project, and static org `opencode.jsonc` files, while excluding archived specs and generated dependency folders. For rfhold `git+ssh` plugin specifiers pinned to `#opencode/v*`, query remote tags, parse semver from `opencode/vX.Y.Z`, replace each pin with the newest matching tag, and leave branch-tracked external plugin references such as cfaintl `#main` unchanged. Provide dry-run/no-push behavior for local verification, avoid empty commits when no files change, and add Bun tests covering latest-tag selection, unchanged current pins, cfaintl branch preservation, and multi-layer scanning. Do not add new Python automation.
- **Dispatch**: subagent

### Task 2.2: Add incoming PAC PipelineRun for direct main updates

- **Implements**: `opencode-config` ADDED Requirement: Scheduled Plugin Pin Updates; `opencode-config` ADDED Requirement: Dot-Owned Scheduler Deployment
- **Depends on**: 2.1
- **Files**: `.tekton/opencode-plugin-pin-update.yaml`
- **Approach**: Add an incoming-triggered PAC PipelineRun named `opencode-plugin-pin-update` with `on-event` including `incoming`, target branch `main`, and `max-keep-runs` set to `2`. Clone the dot repository at the PAC revision, run the Bun updater from Task 2.1, configure git credentials from `{{ git_auth_secret }}` without leaking tokens, commit changed pin files with a direct-to-main message, push to `main`, and exit successfully without an empty commit when the updater reports no changes.
- **Dispatch**: subagent

### Stage Verification

- **Commands**:
  ```bash
  git diff --check -- scripts/update-opencode-plugin-pins.ts scripts/update-opencode-plugin-pins.test.ts .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/auto-update-opencode-plugin-pins
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  rg -n 'pipelinesascode\.tekton\.dev/on-event: "\[incoming\]"' .tekton/opencode-plugin-pin-update.yaml
  rg -n 'metadata:[[:space:]]*$|name: opencode-plugin-pin-update|pipelinesascode\.tekton\.dev/max-keep-runs: "2"' .tekton/opencode-plugin-pin-update.yaml
  ```
- **Expected outcome**: whitespace checks pass; Bun updater tests pass, including dry-run no-modification coverage; local dry-run exits 0; PAC YAML contains the incoming trigger, expected PipelineRun name, and max-keep-runs annotation.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-06
- **Commands**:
  ```bash
  git diff --check -- scripts/update-opencode-plugin-pins.ts scripts/update-opencode-plugin-pins.test.ts .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/auto-update-opencode-plugin-pins
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  rg -n 'pipelinesascode\.tekton\.dev/on-event: "\[incoming\]"' .tekton/opencode-plugin-pin-update.yaml
  rg -n 'metadata:[[:space:]]*$|name: opencode-plugin-pin-update|pipelinesascode\.tekton\.dev/max-keep-runs: "2"' .tekton/opencode-plugin-pin-update.yaml
  ```
- **Output**:
  ```text
  bun test v1.3.11 (af24e281)

   6 pass
   0 fail
   15 expect() calls
  Ran 6 tests across 1 file. [122.00ms]
  .config/opencode/opencode.jsonc: re-search opencode/v0.1.0 -> opencode/v0.1.1
  .config/opencode/opencode.jsonc: rfhold-skills opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: superspec opencode/v0.1.0 -> opencode/v0.2.0
  home/repos/rfhold/.agents/opencode.jsonc: gitops-query opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: slack-query opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: grafana-query opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: atlassian-query opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: gsuite-query opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: cuthulu opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: homelab opencode/v0.1.0 -> opencode/v0.1.1
  home/repos/rfhold/.agents/opencode.jsonc: walter opencode/v0.1.0 -> opencode/v0.1.1
  opencode.jsonc: superspec opencode/v0.1.0 -> opencode/v0.2.0
  Dry run: no files changed.
  6:    pipelinesascode.tekton.dev/on-event: "[incoming]"
  3:metadata:
  4:  name: opencode-plugin-pin-update
  8:    pipelinesascode.tekton.dev/max-keep-runs: "2"
  ```
- **Files changed (across the stage)**:
  - `scripts/update-opencode-plugin-pins.ts`
  - `scripts/update-opencode-plugin-pins.test.ts`
  - `.tekton/opencode-plugin-pin-update.yaml`
  - `docs/specs/changes/auto-update-opencode-plugin-pins/tasks.md`
- **AGENTS.md notes applied**: no `Co-authored-by` trailers; no emojis; terse comments; broken config treated as in scope to fix.
- **Subagent statuses**:
  - Task 2.1: DONE; returned twice for archive-path and dangling-symlink discovery fixes before final verification.
  - Task 2.2: DONE

- [x] Stage 2 complete

---

## Stage 3: Scheduler Deployment

Batch execute tasks that can be run in parallel sub agents.

### Task 3.1: Add dot-owned Kustomize scheduler manifests

- **Implements**: `opencode-config` ADDED Requirement: Dot-Owned Scheduler Deployment
- **Depends on**: Stage 2
- **Files**: `deploy/opencode-plugin-pin-updater/kustomization.yaml`, `deploy/opencode-plugin-pin-updater/cronjob.yaml`
- **Approach**: Add Kustomize manifests for an hourly CronJob in the `pipelines-as-code` namespace on pantheon. The CronJob must run on schedule `0 * * * *`, read the existing `pac-incoming-secret` key `secret` from a mounted secret or environment reference, and POST to `https://pac.holdenitdown.net/incoming` with repository `pac-rfhold-dot`, branch `main`, PipelineRun `opencode-plugin-pin-update`, and the secret value. Keep ownership in dot and do not add homelab or Pulumi scheduler resources.
- **Dispatch**: subagent

### Task 3.2: Add main-push scheduler deploy PipelineRun

- **Implements**: `opencode-config` ADDED Requirement: Dot-Owned Scheduler Deployment
- **Depends on**: Stage 2
- **Files**: `.tekton/opencode-plugin-scheduler-deploy.yaml`
- **Approach**: Add a push-to-`main` PAC PipelineRun with path filters for the scheduler manifests and deploy pipeline file. The pipeline must clone dot, mount `tekton-cluster-kubeconfig`, set `KUBECONFIG`, and run `kubectl --context pantheon apply -k deploy/opencode-plugin-pin-updater` so scheduler changes are deployed into the `pipelines-as-code` namespace. Use `max-keep-runs` value `2` and do not rely on a deployment rollout because the resource is a CronJob.
- **Dispatch**: subagent

### Stage Verification

- **Commands**:
  ```bash
  git diff --check -- deploy/opencode-plugin-pin-updater .tekton/opencode-plugin-scheduler-deploy.yaml docs/specs/changes/auto-update-opencode-plugin-pins
  kubectl kustomize deploy/opencode-plugin-pin-updater >/tmp/dot-opencode-plugin-pin-updater.yaml
  rg -n 'kind: CronJob|namespace: pipelines-as-code|schedule: "0 \* \* \* \*"|pac-rfhold-dot|opencode-plugin-pin-update|pac-incoming-secret|https://pac\.holdenitdown\.net/incoming' /tmp/dot-opencode-plugin-pin-updater.yaml
  rg -n 'pipelinesascode\.tekton\.dev/on-event: "\[push\]"|pipelinesascode\.tekton\.dev/on-target-branch: "\[main\]"|kubectl --context pantheon apply -k deploy/opencode-plugin-pin-updater|pipelinesascode\.tekton\.dev/max-keep-runs: "2"' .tekton/opencode-plugin-scheduler-deploy.yaml
  bun run scripts/validate-opencode-plugin-config.ts
  ```
- **Expected outcome**: whitespace check passes; Kustomize renders the scheduler CronJob; rendered YAML contains hourly PAC incoming trigger details; deploy PipelineRun contains the main push trigger and pantheon `kubectl apply -k` command; static config validation still passes.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-06
- **Commands**:
  ```bash
  git diff --check -- deploy/opencode-plugin-pin-updater .tekton/opencode-plugin-scheduler-deploy.yaml docs/specs/changes/auto-update-opencode-plugin-pins
  kubectl kustomize deploy/opencode-plugin-pin-updater >/tmp/dot-opencode-plugin-pin-updater.yaml
  rg -n 'kind: CronJob|namespace: pipelines-as-code|schedule: "0 \* \* \* \*"|pac-rfhold-dot|opencode-plugin-pin-update|pac-incoming-secret|https://pac\.holdenitdown\.net/incoming' /tmp/dot-opencode-plugin-pin-updater.yaml
  rg -n 'pipelinesascode\.tekton\.dev/on-event: "\[push\]"|pipelinesascode\.tekton\.dev/on-target-branch: "\[main\]"|kubectl --context pantheon apply -k deploy/opencode-plugin-pin-updater|pipelinesascode\.tekton\.dev/max-keep-runs: "2"' .tekton/opencode-plugin-scheduler-deploy.yaml
  bun run scripts/validate-opencode-plugin-config.ts
  rg -n 'schedule: 0 \* \* \* \*' /tmp/dot-opencode-plugin-pin-updater.yaml
  ```
- **Output**:
  ```text
  2:kind: CronJob
  4:  name: opencode-plugin-pin-updater
  5:  namespace: pipelines-as-code
  21:                --data "{\"repository\":\"pac-rfhold-dot\",\"branch\":\"main\",\"pipelinerun\":\"opencode-plugin-pin-update\",\"secret\":\"${PAC_INCOMING_SECRET}\"}" \
  22:                https://pac.holdenitdown.net/incoming
  28:                  name: pac-incoming-secret
  6:    pipelinesascode.tekton.dev/on-event: "[push]"
  7:    pipelinesascode.tekton.dev/on-target-branch: "[main]"
  9:    pipelinesascode.tekton.dev/max-keep-runs: "2"
  58:                kubectl --context pantheon apply -k deploy/opencode-plugin-pin-updater
  OpenCode plugin config validation passed.
  33:  schedule: 0 * * * *
  ```
- **Files changed (across the stage)**:
  - `deploy/opencode-plugin-pin-updater/kustomization.yaml`
  - `deploy/opencode-plugin-pin-updater/cronjob.yaml`
  - `.tekton/opencode-plugin-scheduler-deploy.yaml`
  - `docs/specs/changes/auto-update-opencode-plugin-pins/tasks.md`
- **AGENTS.md notes applied**: no `Co-authored-by` trailers; no emojis; terse comments; broken config treated as in scope to fix.
- **Subagent statuses**:
  - Task 3.1: DONE; returned once for PAC incoming payload field correction from `pipelineRun` to `pipelinerun`.
  - Task 3.2: DONE

- [x] Stage 3 complete

---

## Follow-ups

- After the final stage verification passes, execution should inspect the new scheduler deploy PipelineRun after a push or manual PAC dispatch and record whether the CronJob applied successfully. If cluster access is unavailable during execution, record that as residual verification risk in the Evidence block.

## Review Summary

### CRITICAL

- None.

### WARNING

- None.

### SUGGESTION

- None.

## Approval

- Approved by user message: `proceed`.
