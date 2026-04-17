---
feature: rfhold-mcp-config
title: rfhold MCP Configuration
status: draft
created: 2026-04-15
updated: 2026-04-17
---

# rfhold MCP Configuration

## Goal

Define how `configure.py` generates org-scoped AI tool configuration for `rfhold/*` repos so those repos rely on standalone preview MCP servers for GitOps, Slack, and Grafana instead of Walter-managed local installs, scope the `superspec` OpenCode plugin to rfhold only, and add a per-org shared-skill allowlist with filtered exposure so each org only surfaces curated skills.

## Scope

This spec covers the `configure.py` behavior that writes `~/repos/rfhold/.envrc`, `~/repos/rfhold/.agents/opencode.jsonc`, and `~/repos/rfhold/.agents/.claude.json`, the per-org skills directory generation, the managed app list relevant to the MCP configuration, and the global OpenCode config entry for the `superspec` plugin.

It includes:
- rfhold-only MCP server entries for `gitops`, `slack`, and `grafana`
- preview endpoint URLs for those servers
- removal of `waltr-grafana` and `waltr-gitops` from managed local installs
- rfhold-only activation of the `superspec` OpenCode plugin
- per-org `skills_whitelist` support in `ORG_SKILLS`
- filtered `.agents/skills/` directories derived from an internal source tree
- initial skill allowlists for `rfhold` and `cfaintl`

## Dependencies

- `gitops-query/docs/specs/gitops-query/spec.md`
- `grafana-query/docs/specs/grafana-query/spec.md`
- `slack-query/docs/specs/slack-query/spec.md`

## Non-Goals

- changing `cfaintl` org MCP server configuration
- introducing production MCP endpoints
- cloning or installing `gitops-query`, `slack-query`, or `grafana-query` locally
- deleting existing `~/repos/rfhold/waltr-grafana` or `~/repos/rfhold/waltr-gitops` working trees
- modifying Walter or query-server repo behavior
- publishing `superspec` to any public registry
- adding an OpenCode-native `permission.skill` allow/deny ruleset (filtered directory covers the requirement)

## Constraints

- Generated config MUST remain scoped to `~/repos/rfhold` so it is active only in `rfhold/*` repos.
- The configured remote MCP servers for `rfhold` MUST be named `gitops`, `slack`, and `grafana`.
- The configured URLs MUST use preview endpoints until an approved spec changes them.
- `configure.py` MUST stop managing local installs for `waltr-grafana` and `waltr-gitops`.
- `configure.py` MUST NOT add local managed installs for `gitops-query`, `slack-query`, or `grafana-query` as part of this change.
- Skill whitelisting MUST rely on OpenCode's existing skill discovery semantics (`.agents/skills/<name>/SKILL.md`) without introducing a new discovery path.
- Org-scoped `opencode.jsonc` MUST remain compatible with OpenCode's merge semantics so `plugin` entries accumulate across config layers.

## Requirements

### REQ-001: rfhold MCP Server Set

**Statement:** `configure.py` MUST generate rfhold org AI configuration that exposes exactly three remote MCP servers named `gitops`, `slack`, and `grafana`.

**Acceptance Criteria:**
- `~/repos/rfhold/.agents/opencode.jsonc` contains `gitops`, `slack`, and `grafana` under the `mcp` key.
- No additional rfhold MCP servers are generated alongside those three entries.
- When `~/repos/rfhold/.agents/.claude.json` is generated or updated, it contains matching `gitops`, `slack`, and `grafana` entries under `mcpServers`.

### REQ-002: Preview Endpoint Mapping

**Statement:** `configure.py` MUST map the rfhold MCP server set to the approved preview URLs for the standalone query services.

**Acceptance Criteria:**
- `gitops` resolves to `https://preview-gitops-query.holdenitdown.net`.
- `slack` resolves to `https://preview-slack-query.holdenitdown.net`.
- `grafana` resolves to `https://preview-grafana-query.holdenitdown.net`.
- OpenCode config uses the existing remote MCP shape with `"type": "remote"` for each configured server.
- Claude config uses the existing HTTP MCP shape with `"type": "http"` for each configured server.

### REQ-003: rfhold-Only Activation Scope

**Statement:** `configure.py` MUST keep the MCP configuration active only within `rfhold/*` repos.

**Acceptance Criteria:**
- `~/repos/rfhold/.envrc` continues to set `CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, and `OPENCODE_CONFIG` to paths under `~/repos/rfhold/.agents`.
- No equivalent `gitops`, `slack`, or `grafana` MCP entries are added to non-`rfhold` org configuration.
- Existing non-rfhold org MCP configuration remains unchanged.

### REQ-004: Remove Walter-Managed Local Installs

**Statement:** `configure.py` MUST stop managing local installs for `waltr-grafana` and `waltr-gitops`, and MUST rely on the remote MCP endpoints instead of replacement local query repo management.

**Acceptance Criteria:**
- `MANAGED_APPS` no longer includes `waltr-grafana`.
- `MANAGED_APPS` no longer includes `waltr-gitops`.
- `MANAGED_APPS` does not add `gitops-query`, `slack-query`, or `grafana-query`.
- The managed app flow no longer invokes install commands for the removed Walter repos.

### REQ-005: rfhold-Only superspec Plugin

**Statement:** The `superspec` OpenCode plugin MUST be activated only within `rfhold/*` repos.

**Acceptance Criteria:**
- `~/.config/opencode/opencode.jsonc` does not list `superspec` in its `plugin` array.
- `~/repos/rfhold/.agents/opencode.jsonc` lists `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git` in its `plugin` array.
- No non-rfhold org config includes `superspec` in its `plugin` array.
- Running OpenCode inside a `rfhold/*` repo resolves `superspec` via OpenCode's plugin merge behavior across global and org-local config.

### REQ-006: Per-Org Skills Whitelist

**Statement:** `configure.py` MUST support a per-org `skills_whitelist` entry inside `ORG_SKILLS` that declares which skill folder names are exposed to OpenCode.

**Acceptance Criteria:**
- `ORG_SKILLS[<org>]["skills_whitelist"]` accepts a list of skill folder names.
- When `skills_whitelist` is set, only the listed skill folders SHALL be visible under `~/repos/<org>/.agents/skills/`.
- Skill folders not present in `skills_whitelist` MUST NOT appear under `~/repos/<org>/.agents/skills/`.
- Skill folders listed in `skills_whitelist` but missing from the cloned source tree MUST be skipped without aborting configuration.

### REQ-007: Filtered Skills Directory Generation

**Statement:** When a `skills_whitelist` is set for an org, `configure.py` MUST clone the skills repo into an internal source directory and MUST expose the allowlisted skills through a curated `.agents/skills/` tree.

**Acceptance Criteria:**
- The skills repo clone destination MUST be a directory distinct from `.agents/skills` (for example `.agents/skills-src`).
- `.agents/skills/` MUST contain only entries corresponding to allowlisted skills.
- Each allowlisted entry MUST be a symlink that resolves to the matching skill folder inside the source tree (honoring the existing `skills_subdir` setting when present).
- Re-running configuration MUST reconcile the curated tree with the current `skills_whitelist` without leaving stale entries that are no longer listed.

### REQ-008: Preserve Legacy Skills Layout

**Statement:** When no `skills_whitelist` is set for an org, `configure.py` MUST preserve the existing skills directory behavior.

**Acceptance Criteria:**
- Orgs without `skills_whitelist` continue to expose the full repo (or the `skills_subdir` subtree when set) under `.agents/skills/`.
- Existing `.agents/skills` symlinks or clones for legacy orgs are not rewritten into a curated tree.
- Removing `skills_whitelist` from an org's configuration restores legacy behavior on the next run.

### REQ-009: Initial Skill Allowlists

**Statement:** `configure.py` MUST ship initial `skills_whitelist` values for both `rfhold` and `cfaintl`.

**Acceptance Criteria:**
- The `rfhold` allowlist contains exactly: `axol-query`, `cuthulu-query`, `forgejo-tea`, `gitops-query`, `grafana-query`, `homelab`, `kubectl`, `tekton-pac`, `walter`, `waltr-component`.
- The `cfaintl` allowlist contains exactly: `cfa-acronyms`, `cfaintl-environment`, `chikin-mcp`, `logql`, `promql`, `pulumi-go`, `traceql`, `brainstorming`, `code-review`, `execution`, `plan-review`, `review-changes`, `using-superspec`, `writing-specs`.
- Allowlist entries MUST be listed explicitly; wildcard or "all" shorthand MUST NOT be used.

### REQ-010: Org-Level Plugin List

**Statement:** `ORG_SKILLS` MUST support an org-level `plugins` list that `configure.py` emits into the generated org `opencode.jsonc`.

**Acceptance Criteria:**
- `ORG_SKILLS[<org>]["plugins"]` accepts a list of OpenCode plugin specifiers.
- When `plugins` is present, generated `opencode.jsonc` contains a `plugin` array with the same entries in the same order.
- When `plugins` is absent or empty, generated `opencode.jsonc` MUST NOT include a `plugin` key.
- The rfhold entry MUST list `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git` in its `plugins` list.

## Non-Functional Requirements

### NFR-001: Declarative Org Configuration

**Statement:** The rfhold MCP configuration SHOULD remain declarative so generated files stay a direct reflection of `ORG_SKILLS` source data.

**Acceptance Criteria:**
- The rfhold server names and URLs are defined in `ORG_SKILLS["rfhold"]["mcp_servers"]`.
- Generated file content is derived from the existing org configuration generation flow rather than one-off special cases.
- Updating endpoint URLs requires changing org configuration data rather than introducing new generation paths.

### NFR-002: Declarative Skill and Plugin Control

**Statement:** Skill whitelisting and plugin activation SHOULD be data-driven from `ORG_SKILLS` and MUST NOT introduce ad hoc shell heuristics for parsing skills repos.

**Acceptance Criteria:**
- Allowlist and plugin changes are made by editing `ORG_SKILLS` entries only.
- Generation logic relies on standard filesystem primitives (directory listing, symlink creation) rather than parsing skill metadata.
- Adding a new skill to an existing org requires only an `ORG_SKILLS` edit.

## Contract Boundaries

- external MCP boundary: `https://preview-gitops-query.holdenitdown.net`, `https://preview-slack-query.holdenitdown.net`, and `https://preview-grafana-query.holdenitdown.net`
- generated config boundary: `~/repos/rfhold/.envrc`, `~/repos/rfhold/.agents/opencode.jsonc`, and `~/repos/rfhold/.agents/.claude.json`
- org boundary: `rfhold` configuration is isolated from `cfaintl` and any other org-specific AI configuration
- plugin boundary: the OpenCode plugin merge contract (global `plugin` entries concatenate with org-local `plugin` entries) governs rfhold-only `superspec` activation
- skill discovery boundary: OpenCode discovers skills from `.agents/skills/<name>/SKILL.md`, including through symlinks

## Implementation Boundaries

- `ORG_SKILLS["rfhold"]` is the source of truth for the rfhold MCP server list, allowlist, and plugins.
- `ORG_SKILLS["cfaintl"]` owns the cfaintl allowlist; its MCP server set is unchanged.
- `MANAGED_APPS` governs only local repo clone and install behavior.
- The existing `has_tag("skills")` generation flow remains responsible for deriving rfhold AI tool config files and now also owns the curated skills directory and org-level plugin emission.
- Global `~/.config/opencode/opencode.jsonc` owns only plugins that should apply to all repos; rfhold-specific plugins live under `ORG_SKILLS["rfhold"]["plugins"]`.
- This change does not introduce local runtime management for the standalone query services.

## Risks

- Preview endpoints may exist before their service behavior is fully ready.
- Existing local `waltr-grafana` and `waltr-gitops` directories may remain present and create operator confusion even after they become unmanaged.
- `.claude.json` generation continues to replace `mcpServers` as a whole, which can overwrite unrelated manual MCP edits in that file.
- Removing `superspec` from global config removes it from non-rfhold contexts (including this dotfiles repo itself) until explicitly re-added elsewhere.
- Filtered skills directory changes the on-disk layout for orgs that previously exposed the whole repo; consumers that depend on the raw structure under `.agents/skills` must switch to the source tree.
- Stale symlinks from a prior run may accumulate if reconciliation is incomplete.

## Open Questions

- Q1: Resolved. `superspec` is also enabled inside the dotfiles repo (`~/dot`) via a project-level `opencode.jsonc` that lists it in `plugin`.
- Q2: Resolved. `cfaintl` skills clone tracks the `rfh/superspec` branch so the new superspec-style skills are available for the allowlist to activate. `ORG_SKILLS` gains an optional `branch` key consumed by `git.repo`.
- Q3: Resolved. The curated `.agents/skills/` reconciliation step actively deletes symlinks that are no longer in the allowlist; real directories are left untouched.
