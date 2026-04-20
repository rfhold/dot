---
feature: rfhold-mcp-config
title: rfhold MCP Configuration
status: draft
created: 2026-04-15
updated: 2026-04-19
last-change: plugin-based-opencode
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

### Requirement: rfhold MCP Server Set
The system MUST deliver the rfhold MCP server set (`gitops`, `slack`, `grafana`) through plugins listed in the org `plugin` array and MUST NOT emit an inline `mcp` stanza for those servers in `~/repos/rfhold/.agents/opencode.jsonc`.

#### Scenario: OpenCode MCP comes from plugins
Given the rfhold org plugin list includes the `gitops-query`, `slack-query`, and `grafana-query` plugins
When OpenCode starts in `~/repos/rfhold/`
Then the resolved MCP set MUST include `gitops`, `slack`, and `grafana`
And `~/repos/rfhold/.agents/opencode.jsonc` MUST NOT contain `gitops`, `slack`, or `grafana` under a top-level `mcp` key

#### Scenario: Claude Code retains inline MCP
Given Claude Code does not support OpenCode plugins
When `configure.py` generates `~/repos/rfhold/.agents/.claude.json`
Then the file MUST contain `gitops`, `slack`, and `grafana` entries under `mcpServers` with `"type": "http"` and the approved preview URLs

### Requirement: Preview Endpoint Mapping
The system MUST map each rfhold MCP server to the approved preview URL for its standalone query service.

#### Scenario: gitops preview endpoint
Given `ORG_SKILLS["rfhold"]["mcp_servers"]["gitops"]` is configured
When `configure.py` emits rfhold MCP configuration
Then the `gitops` server URL MUST be `https://preview-gitops-query.holdenitdown.net`

#### Scenario: slack preview endpoint
Given `ORG_SKILLS["rfhold"]["mcp_servers"]["slack"]` is configured
When `configure.py` emits rfhold MCP configuration
Then the `slack` server URL MUST be `https://preview-slack-query.holdenitdown.net`

#### Scenario: grafana preview endpoint
Given `ORG_SKILLS["rfhold"]["mcp_servers"]["grafana"]` is configured
When `configure.py` emits rfhold MCP configuration
Then the `grafana` server URL MUST be `https://preview-grafana-query.holdenitdown.net`

#### Scenario: OpenCode uses remote MCP shape
Given any of the three rfhold MCP servers
When that entry is emitted into `~/repos/rfhold/.agents/opencode.jsonc`
Then the entry MUST use `"type": "remote"`

#### Scenario: Claude uses HTTP MCP shape
Given any of the three rfhold MCP servers
When that entry is emitted into `~/repos/rfhold/.agents/.claude.json`
Then the entry MUST use `"type": "http"`

### Requirement: rfhold-Only Activation Scope
The system MUST keep rfhold MCP configuration active only within `rfhold/*` repositories and MUST NOT propagate those MCP entries to non-rfhold org configuration.

#### Scenario: envrc scopes AI tool config to rfhold
Given `configure.py` runs with the `skills` tag
When `~/repos/rfhold/.envrc` is generated
Then `.envrc` MUST set `CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, and `OPENCODE_CONFIG` to paths under `~/repos/rfhold/.agents`

#### Scenario: non-rfhold org config does not include rfhold MCP entries
Given a non-rfhold org exists in `ORG_SKILLS`
When `configure.py` generates that org's configuration
Then the generated `opencode.jsonc` MUST NOT contain `gitops`, `slack`, or `grafana` entries that originate from the rfhold MCP server set

### Requirement: Remove Walter-Managed Local Installs
The system MUST stop managing local installs for `waltr-grafana` and `waltr-gitops` and MUST NOT substitute local installs of `gitops-query`, `slack-query`, or `grafana-query` in their place.

#### Scenario: waltr-grafana removed from MANAGED_APPS
Given the current `configure.py` definition
When `MANAGED_APPS` is inspected
Then `waltr-grafana` MUST NOT appear in `MANAGED_APPS`

#### Scenario: waltr-gitops removed from MANAGED_APPS
Given the current `configure.py` definition
When `MANAGED_APPS` is inspected
Then `waltr-gitops` MUST NOT appear in `MANAGED_APPS`

#### Scenario: query servers not added as managed apps
Given the current `configure.py` definition
When `MANAGED_APPS` is inspected
Then `gitops-query`, `slack-query`, and `grafana-query` MUST NOT appear in `MANAGED_APPS`

### Requirement: rfhold-Only superspec Plugin
The system MUST treat `superspec` as one of several rfhold org-local plugins and MUST continue to list it in `~/repos/rfhold/.agents/opencode.jsonc`'s `plugin` array alongside the other rfhold plugins, while keeping it absent from global and non-rfhold org configuration.

#### Scenario: rfhold plugin array contains superspec alongside peers
Given `ORG_SKILLS["rfhold"]["plugins"]` lists multiple rfhold plugins including `superspec`
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the `plugin` array MUST contain `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git`
And it MUST also contain each additional plugin entry listed in `ORG_SKILLS["rfhold"]["plugins"]`

#### Scenario: superspec absent from global and non-rfhold config
Given the current global OpenCode configuration and any non-rfhold org configuration
When `~/.config/opencode/opencode.jsonc` and the non-rfhold org `opencode.jsonc` are inspected
Then neither file's `plugin` array MUST contain `superspec`

### Requirement: Preserve Legacy Skills Layout
When an org declares `skills_whitelist` without using the plugin-delivery model (such as `cfaintl`), the system MUST preserve the filtered skills-directory behavior; when an org declares neither `skills_whitelist` nor plugin-delivered skills, the system MUST preserve the full-repo layout; the initial `cfaintl` allowlist MUST ship with exactly the documented set of entries; and missing allowlisted folders MUST be skipped without aborting.

#### Scenario: cfaintl retains filtered layout
Given `ORG_SKILLS["cfaintl"]` declares `skills_whitelist` and no `plugins` list owns those skills
When `configure.py` materializes `~/repos/cfaintl/.agents/skills/`
Then the directory MUST contain only symlinks to allowlisted skills inside the internal `skills-src/` source tree

#### Scenario: cfaintl allowlist has exact entries
Given the current `ORG_SKILLS` definition
When `ORG_SKILLS["cfaintl"]["skills_whitelist"]` is read
Then it MUST contain exactly: `cfa-acronyms`, `cfaintl-environment`, `chikin-mcp`, `logql`, `promql`, `pulumi-go`, `traceql`, `brainstorming`, `code-review`, `execution`, `plan-review`, `review-changes`, `using-superspec`, `writing-specs`

#### Scenario: org without whitelist or plugins exposes full repo
Given an org sets neither `skills_whitelist` nor `plugins`
When `configure.py` materializes that org's `.agents/skills/`
Then the directory MUST expose the full repo (or `skills_subdir` subtree when set) as before

#### Scenario: missing allowlisted folder tolerated
Given a `skills_whitelist` entry references a skill folder that does not exist in the cloned source tree
When `configure.py` materializes the curated skills directory
Then the configuration run MUST complete without aborting
And the missing folder MUST be skipped silently

### Requirement: Org-Level Plugin List
The system MUST treat the org-level `plugins` list as the exclusive delivery path for rfhold MCP servers and skills, MUST emit the list verbatim into the generated org `opencode.jsonc`, and MUST NOT also emit an inline `mcp` stanza for any server owned by a listed plugin.

#### Scenario: rfhold plugin array emitted verbatim
Given `ORG_SKILLS["rfhold"]["plugins"]` is a non-empty ordered list of plugin specifiers
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the generated file MUST contain a top-level `plugin` array whose entries equal the configured list in the same order
And each entry MUST use the `<name>@git+ssh://...` form

#### Scenario: plugin-owned MCP not duplicated inline
Given a plugin in `ORG_SKILLS["rfhold"]["plugins"]` registers an MCP server named `<name>`
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the generated file MUST NOT contain `<name>` under a top-level `mcp` key

#### Scenario: rfhold plugin list contains the required entries
Given the current `ORG_SKILLS` definition
When `ORG_SKILLS["rfhold"]["plugins"]` is read
Then it MUST contain `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git`
And it MUST contain one plugin entry per rfhold-owned MCP server or skill bundle declared by the `opencode-config` domain

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
