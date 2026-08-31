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
The system MUST deliver the rfhold OpenCode MCP server set (`gitops`, `slack`, `grafana`) through plugins listed in the static rfhold org `plugin` array and MUST NOT emit an inline `mcp` stanza for those servers in `~/repos/rfhold/.agents/opencode.jsonc`.

#### Scenario: OpenCode MCP comes from plugins
Given the rfhold org plugin list includes the `gitops-query`, `slack-query`, and `grafana-query` plugins
When OpenCode starts in `~/repos/rfhold/`
Then the resolved MCP set MUST include `gitops`, `slack`, and `grafana`
And `~/repos/rfhold/.agents/opencode.jsonc` MUST NOT contain `gitops`, `slack`, or `grafana` under a top-level `mcp` key

#### Scenario: Claude Code retains inline MCP
Given Claude Code does not support OpenCode plugins
When `~/repos/rfhold/.agents/.claude.json` is inspected
Then the file MUST contain `gitops`, `slack`, and `grafana` entries under `mcpServers` with `"type": "http"` and the approved preview URLs

### Requirement: Preview Endpoint Mapping
The system MUST map each rfhold MCP server to the approved preview URL in the static Claude Code org configuration.

#### Scenario: gitops preview endpoint
Given the static rfhold Claude Code MCP configuration contains a `gitops` server entry
When `~/repos/rfhold/.agents/.claude.json` is inspected
Then the `gitops` server URL MUST be `https://preview-gitops-query.holdenitdown.net`

#### Scenario: slack preview endpoint
Given the static rfhold Claude Code MCP configuration contains a `slack` server entry
When `~/repos/rfhold/.agents/.claude.json` is inspected
Then the `slack` server URL MUST be `https://preview-slack-query.holdenitdown.net`

#### Scenario: grafana preview endpoint
Given the static rfhold Claude Code MCP configuration contains a `grafana` server entry
When `~/repos/rfhold/.agents/.claude.json` is inspected
Then the `grafana` server URL MUST be `https://preview-grafana-query.holdenitdown.net`

#### Scenario: OpenCode uses remote MCP shape
Given any of the three rfhold MCP servers is resolved from its OpenCode plugin
When OpenCode starts in `~/repos/rfhold/`
Then the resolved MCP entry MUST use `"type": "remote"`

#### Scenario: Claude uses HTTP MCP shape
Given any of the three rfhold MCP servers is present in the static Claude Code org configuration
When that entry is inspected in `~/repos/rfhold/.agents/.claude.json`
Then the entry MUST use `"type": "http"`

### Requirement: rfhold-Only Activation Scope
The system MUST keep rfhold MCP configuration active only within `rfhold/*` repositories by pointing AI tool configuration environment variables at the static rfhold `.agents` symlink, and MUST NOT propagate those MCP entries to non-rfhold org configuration.

#### Scenario: envrc scopes AI tool config to rfhold
Given the rfhold org config has been linked from the dot repository
When `~/repos/rfhold/.envrc` is inspected
Then `.envrc` MUST set `CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, and `OPENCODE_CONFIG` to paths under `~/repos/rfhold/.agents`

#### Scenario: non-rfhold org config does not include rfhold MCP entries
Given a non-rfhold org has static org configuration linked from the dot repository
When that org's `opencode.jsonc` is inspected
Then the org `opencode.jsonc` MUST NOT contain `gitops`, `slack`, or `grafana` entries that originate from the rfhold MCP server set

### Requirement: Remove Walter-Managed Local Installs
The system MUST stop managing local installs for `walter`, `cuthulu`, `waltr-grafana`, and `waltr-gitops` and MUST NOT substitute local installs of `gitops-query`, `slack-query`, or `grafana-query` in their place. `SYSTEM_DEPS` MUST NOT retain app-specific dependencies for `walter` or `cuthulu`.

#### Scenario: Walter and Cuthulu removed from local app management
Given the current `configure.py` definition
When `MANAGED_APPS` and `SYSTEM_DEPS` are inspected
Then `walter` and `cuthulu` MUST NOT appear in either collection

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
The system MUST treat `superspec` as one of several rfhold org-local plugins and MUST continue to list it in `~/repos/rfhold/.agents/opencode.jsonc`'s `plugin` array alongside the other rfhold plugins with an OpenCode release tag, while keeping it absent from global and non-rfhold org configuration.

#### Scenario: rfhold plugin array contains superspec alongside peers
Given the static rfhold org `plugin` array lists multiple rfhold plugins including `superspec`
When `~/repos/rfhold/.agents/opencode.jsonc` is inspected
Then the `plugin` array MUST contain a `superspec` entry matching `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/vX.Y.Z`
And it MUST also contain each additional rfhold org plugin entry required by the static rfhold plugin list

#### Scenario: superspec absent from global and non-rfhold config
Given the current global OpenCode configuration and any non-rfhold org configuration
When `~/.config/opencode/opencode.jsonc` and the non-rfhold org `opencode.jsonc` are inspected
Then neither file's `plugin` array MUST contain `superspec`

### Requirement: Cfaintl Plugin Skill Filtering
The system MUST deliver cfaintl skills through the cfaintl skills OpenCode plugin tracking the `main` branch and MUST configure plugin skill filters so the exposed skill set equals the previously approved cfaintl allowlist.

#### Scenario: cfaintl plugin tracks main
Given the static cfaintl org OpenCode configuration is linked from the dot repository
When `~/repos/cfaintl/.agents/opencode.jsonc` is inspected
Then the `plugin` array MUST contain an entry targeting `git+ssh://git@github.com/cfaintl/skills.git#main`
And that entry MUST NOT use an `opencode/vX.Y.Z` tag reference

#### Scenario: cfaintl include list has exact entries
Given the static cfaintl org OpenCode plugin configuration is inspected
When the cfaintl skills plugin include options are read
Then the include options MUST contain exactly: `cfa-acronyms`, `cfaintl-environment`, `chikin-mcp`, `logql`, `promql`, `pulumi-go`, `traceql`, `brainstorming`, `code-review`, `execution`, `plan-review`, `review-changes`, `using-superspec`, `writing-specs`

#### Scenario: cfaintl plugin exposes only included skills
Given OpenCode starts inside `~/repos/cfaintl/`
When the cfaintl skills plugin loads with the configured include options
Then the allowlisted cfaintl skills MUST be discoverable
And skills outside the configured include options MUST NOT be discoverable from the cfaintl skills plugin

#### Scenario: cfaintl skills are not materialized by configure.py
Given `configure.py` runs for org-level AI tool configuration
When it handles the cfaintl org
Then it MUST NOT clone `cfaintl/skills` into an org-local `skills-src` directory
And it MUST NOT materialize `~/repos/cfaintl/.agents/skills/` as a generated whitelist of symlinks

### Requirement: Org-Level Plugin List
The system MUST treat the org-level `plugins` list as the exclusive delivery path for rfhold MCP servers and rfhold-scoped skills, MUST store the list in the static rfhold org `opencode.jsonc`, and MUST NOT also emit an inline `mcp` stanza for any server owned by a listed plugin. The static rfhold plugin list MUST contain exactly these plugin identities in this order, each pinned to a current `opencode/vX.Y.Z` release tag: `superspec`, `gitops-query`, `slack-query`, `grafana-query`, `atlassian-query`, `gsuite-query`, `axol-query`, and `homelab`. It MUST NOT contain `cuthulu` or `walter`.

#### Scenario: rfhold plugin array stored statically
Given the static rfhold org OpenCode configuration is linked from the dot repository
When `~/repos/rfhold/.agents/opencode.jsonc` is inspected
Then the file MUST contain a top-level `plugin` array whose entries preserve the canonical rfhold plugin order
And each rfhold git entry MUST use the `<name>@git+ssh://git@git.holdenitdown.net/rfhold/<repo>.git#opencode/vX.Y.Z` form

#### Scenario: plugin-owned MCP not duplicated inline
Given a plugin in the static rfhold org `plugin` array registers an MCP server named `<name>`
When `~/repos/rfhold/.agents/opencode.jsonc` is inspected
Then the file MUST NOT contain `<name>` under a top-level `mcp` key

#### Scenario: rfhold plugin list contains the canonical entries in order
Given the static rfhold org OpenCode configuration is inspected
When the rfhold `plugin` array is read
Then the plugin identities MUST equal this ordered list: `superspec`, `gitops-query`, `slack-query`, `grafana-query`, `atlassian-query`, `gsuite-query`, `axol-query`, and `homelab`
And the plugin identities MUST NOT include `cuthulu` or `walter`

### Requirement: Static Org Agent Directories
The system MUST store org-scoped `.agents` directories as checked-in dot repository content and MUST make `configure.py` link `~/repos/<org>/.agents` to those static directories instead of generating or mutating their contents.

#### Scenario: Org agents directory linked from dot
Given the dot repository contains static org `.agents` content for an org
When `configure.py` applies dot-managed home and repo links
Then `~/repos/<org>/.agents` MUST resolve to the corresponding checked-in dot repository path
And the org `.agents` path MUST NOT be a configure.py-generated directory tree

#### Scenario: Existing generated directory replaced by symlink
Given `~/repos/<org>/.agents` exists as a real directory from a prior configure.py run
When `configure.py` applies the static org `.agents` link
Then the existing real directory MUST be replaced or backed up according to dot link behavior
And `~/repos/<org>/.agents` MUST become a symlink to the checked-in dot repository content
And `configure.py` MUST NOT recursively merge children into the existing real directory

#### Scenario: configure.py does not mutate static agents content
Given an org `.agents` directory is static dot repository content
When `configure.py` runs with the AI tool configuration tag
Then it MUST NOT write `opencode.jsonc`, `.claude.json`, or generated `skills/` entries inside `~/repos/<org>/.agents`
And any change to those org `.agents` files MUST be made by editing the dot repository content directly

### Requirement: OpenCode Plugin Cache Refresh Helper
The system MUST provide a helper script at `~/dot/bin/update-oc-plugins.sh` for forcing OpenCode to re-download cached plugin packages. That helper MUST remove cached package data under `~/.cache/opencode/packages/` instead of targeting only one named plugin package, and it MUST NOT update or pull plugin source repositories as part of that cache-refresh behavior.

#### Scenario: renamed helper exists at the generic plugin path
Given the dotfiles helper scripts are installed from the current repository
When the OpenCode plugin refresh helper is inspected
Then the helper MUST exist at `~/dot/bin/update-oc-plugins.sh`
And the workflow MUST NOT require `~/dot/bin/update-superspec.sh` as the canonical helper path

#### Scenario: helper clears cached packages broadly
Given OpenCode has cached plugin packages under `~/.cache/opencode/packages/`
When `~/dot/bin/update-oc-plugins.sh` runs
Then the helper MUST remove cached package data from `~/.cache/opencode/packages/`
And OpenCode MUST re-download plugin packages on the next load

#### Scenario: helper does not update plugin repositories directly
Given `~/dot/bin/update-oc-plugins.sh` runs
When the helper completes
Then it MUST NOT have performed a git pull, fetch, or checkout inside any plugin source repository
And it MAY print restart guidance after clearing the cache

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
