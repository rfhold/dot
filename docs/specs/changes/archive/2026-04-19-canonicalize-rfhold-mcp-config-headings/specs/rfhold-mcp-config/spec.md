# Delta: canonicalize-rfhold-mcp-config-headings / rfhold-mcp-config

## Change Overview

### Why

The `rfhold-mcp-config` stable spec predates the canonical superspec heading convention and uses `### REQ-NNN: <Name>` identifiers with `**Statement:**` / `**Acceptance Criteria:**` bullet bodies. The canonical convention (heading `### Requirement: <Name>`, body `#### Scenario:` with Given/When/Then) is a hard gate in `writing-specs` and `review-changes`. Any downstream delta targeting this domain either has to mirror the legacy format (which then propagates the non-canonical style) or fails review. This change normalizes the stable spec so future deltas can use the canonical form without ambiguity and so scenario-level validation is possible.

### Impact

Breaking changes:

- Every requirement heading in `docs/specs/rfhold-mcp-config/spec.md` is renamed from `REQ-NNN: <Name>` to `<Name>`. The name portion is preserved verbatim; only the numeric prefix is dropped.
- Every requirement body is rewritten from `**Statement:**` + `**Acceptance Criteria:**` bullets into `### Requirement:` with a normative RFC 2119 statement followed by `#### Scenario:` blocks using Given/When/Then.

Migration:

- Any in-flight delta under `docs/specs/changes/` that targets `rfhold-mcp-config` using the legacy `### REQ-NNN:` form MUST be rewritten to use the new canonical headings after this change merges.
- No runtime behavior is affected. `configure.py` code, generated `.envrc` / `opencode.jsonc` / `.claude.json` files, and MCP endpoints are unchanged.

Cross-change dependencies:

- `plugin-based-opencode` targets this domain using the legacy heading convention. It is blocked on this change and MUST be revised to canonical headings before review can approve it.

### Non-goals

- Changing any requirement's normative meaning. The statement and acceptance criteria are translated 1:1 into a canonical statement and equivalent scenarios.
- Adding, removing, or renumbering requirements. This change is purely a format normalization.
- Altering Contract Boundaries, Implementation Boundaries, Risks, Open Questions, or Goal/Scope prose in the stable spec.
- Modifying the `NFR-NNN` non-functional sections if they are preserved as-is. This delta treats them as out of scope; a follow-up change may canonicalize them separately.
- Changing any other domain's stable spec.

### Rollback

Revert the merge commit. The stable spec reverts to its prior `REQ-NNN` form, and any downstream delta still using the legacy form remains valid.

## RENAMED Requirements

- FROM: `REQ-001: rfhold MCP Server Set`
  TO: `rfhold MCP Server Set`
- FROM: `REQ-002: Preview Endpoint Mapping`
  TO: `Preview Endpoint Mapping`
- FROM: `REQ-003: rfhold-Only Activation Scope`
  TO: `rfhold-Only Activation Scope`
- FROM: `REQ-004: Remove Walter-Managed Local Installs`
  TO: `Remove Walter-Managed Local Installs`
- FROM: `REQ-005: rfhold-Only superspec Plugin`
  TO: `rfhold-Only superspec Plugin`
- FROM: `REQ-006: Per-Org Skills Whitelist`
  TO: `Per-Org Skills Whitelist`
- FROM: `REQ-007: Filtered Skills Directory Generation`
  TO: `Filtered Skills Directory Generation`
- FROM: `REQ-008: Preserve Legacy Skills Layout`
  TO: `Preserve Legacy Skills Layout`
- FROM: `REQ-009: Initial Skill Allowlists`
  TO: `Initial Skill Allowlists`
- FROM: `REQ-010: Org-Level Plugin List`
  TO: `Org-Level Plugin List`

## MODIFIED Requirements

### Requirement: rfhold MCP Server Set
The system MUST generate rfhold org AI configuration that exposes exactly three remote MCP servers named `gitops`, `slack`, and `grafana` and MUST NOT generate additional rfhold MCP servers alongside those three.

#### Scenario: OpenCode config emits the three servers
Given `ORG_SKILLS["rfhold"]["mcp_servers"]` declares `gitops`, `slack`, and `grafana`
When `configure.py` runs with the `skills` tag
Then `~/repos/rfhold/.agents/opencode.jsonc` MUST contain `gitops`, `slack`, and `grafana` keys under `mcp`
And no additional rfhold MCP servers MUST appear under `mcp`

#### Scenario: Claude config emits the three servers
Given `ORG_SKILLS["rfhold"]["mcp_servers"]` declares `gitops`, `slack`, and `grafana`
When `configure.py` writes `~/repos/rfhold/.agents/.claude.json`
Then the file MUST contain `gitops`, `slack`, and `grafana` keys under `mcpServers`

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
The system MUST activate the `superspec` OpenCode plugin only within `rfhold/*` repositories by listing it solely in rfhold org-local configuration.

#### Scenario: global config does not list superspec
Given the current global OpenCode configuration
When `~/.config/opencode/opencode.jsonc` is inspected
Then the `plugin` array MUST NOT contain `superspec`

#### Scenario: rfhold org config lists superspec
Given `configure.py` runs with the `skills` tag
When `~/repos/rfhold/.agents/opencode.jsonc` is generated
Then its `plugin` array MUST contain `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git`

#### Scenario: non-rfhold org config does not list superspec
Given a non-rfhold org exists in `ORG_SKILLS`
When `configure.py` generates that org's configuration
Then the generated `opencode.jsonc` MUST NOT contain `superspec` in its `plugin` array

### Requirement: Per-Org Skills Whitelist
The system MUST support a per-org `skills_whitelist` entry in `ORG_SKILLS` that declares exactly which skill folder names are exposed to OpenCode.

#### Scenario: whitelist restricts visible skills
Given `ORG_SKILLS[<org>]["skills_whitelist"]` lists one or more skill folder names
When `configure.py` materializes `~/repos/<org>/.agents/skills/`
Then only the listed skill folders MUST be visible under `~/repos/<org>/.agents/skills/`

#### Scenario: non-allowlisted folder excluded
Given a skill folder exists in the source tree but is not in the allowlist
When `configure.py` materializes the curated skills directory
Then that skill folder MUST NOT appear under `~/repos/<org>/.agents/skills/`

#### Scenario: missing allowlisted folder tolerated
Given an allowlist entry references a skill folder that does not exist in the cloned source tree
When `configure.py` materializes the curated skills directory
Then the configuration run MUST complete without aborting
And the missing folder MUST be skipped silently

### Requirement: Filtered Skills Directory Generation
When a `skills_whitelist` is set for an org, the system MUST clone the skills repository into an internal source directory distinct from the curated tree and MUST expose only allowlisted skills through `.agents/skills/` via symlinks into the source tree.

#### Scenario: source tree cloned to dedicated directory
Given `ORG_SKILLS[<org>]` sets `skills_whitelist`
When `configure.py` clones the skills repository
Then the clone destination MUST be a directory distinct from `~/repos/<org>/.agents/skills`

#### Scenario: curated tree contains only allowlisted skills
Given `ORG_SKILLS[<org>]["skills_whitelist"]` lists a set of skill names
When `configure.py` materializes `~/repos/<org>/.agents/skills/`
Then every entry under that directory MUST correspond to an allowlisted skill
And each entry MUST be a symlink resolving to the matching skill folder inside the source tree

#### Scenario: reconciliation removes stale entries
Given a previously materialized curated tree contains a symlink for a skill that is no longer in the allowlist
When `configure.py` runs again
Then the stale symlink MUST be removed from `~/repos/<org>/.agents/skills/`

### Requirement: Preserve Legacy Skills Layout
When no `skills_whitelist` is set for an org, the system MUST preserve the existing skills-directory behavior and MUST NOT rewrite legacy clones into a curated tree.

#### Scenario: org without whitelist exposes full repo
Given `ORG_SKILLS[<org>]` does not set `skills_whitelist`
When `configure.py` materializes `~/repos/<org>/.agents/skills/`
Then the directory MUST expose the full repo tree (or the `skills_subdir` subtree when set) as before

#### Scenario: legacy org clone not rewritten
Given an org without `skills_whitelist` that previously had `.agents/skills` as a direct clone or symlink
When `configure.py` runs
Then the existing layout MUST NOT be rewritten into a curated tree

#### Scenario: removing whitelist restores legacy layout
Given an org previously had `skills_whitelist` set and then removes it
When `configure.py` runs after the removal
Then the org's `.agents/skills/` MUST return to the legacy layout on that run

### Requirement: Initial Skill Allowlists
The system MUST ship explicit initial `skills_whitelist` values for both `rfhold` and `cfaintl` and MUST NOT use wildcard or "all" shorthand in either allowlist.

#### Scenario: rfhold allowlist has exact entries
Given the current `ORG_SKILLS` definition
When `ORG_SKILLS["rfhold"]["skills_whitelist"]` is read
Then it MUST contain exactly: `axol-query`, `cuthulu-query`, `forgejo-tea`, `gitops-query`, `grafana-query`, `homelab`, `kubectl`, `tekton-pac`, `walter`, `waltr-component`

#### Scenario: cfaintl allowlist has exact entries
Given the current `ORG_SKILLS` definition
When `ORG_SKILLS["cfaintl"]["skills_whitelist"]` is read
Then it MUST contain exactly: `cfa-acronyms`, `cfaintl-environment`, `chikin-mcp`, `logql`, `promql`, `pulumi-go`, `traceql`, `brainstorming`, `code-review`, `execution`, `plan-review`, `review-changes`, `using-superspec`, `writing-specs`

#### Scenario: wildcard shorthand forbidden
Given an org's `skills_whitelist` is authored
When the value is inspected
Then it MUST NOT contain a wildcard value (such as `*` or `all`)

### Requirement: Org-Level Plugin List
The system MUST support an org-level `plugins` list inside `ORG_SKILLS` and MUST emit that list verbatim into the generated org `opencode.jsonc`.

#### Scenario: plugins list emitted in order
Given `ORG_SKILLS[<org>]["plugins"]` is a non-empty list of plugin specifiers
When `configure.py` generates `~/repos/<org>/.agents/opencode.jsonc`
Then the generated file MUST contain a top-level `plugin` array whose entries equal the configured list in the same order

#### Scenario: absent plugins key omits plugin array
Given `ORG_SKILLS[<org>]` does not define `plugins` (or defines it as empty)
When `configure.py` generates `~/repos/<org>/.agents/opencode.jsonc`
Then the generated file MUST NOT contain a top-level `plugin` key

#### Scenario: rfhold plugin entry present
Given the current `ORG_SKILLS` definition
When `ORG_SKILLS["rfhold"]["plugins"]` is read
Then it MUST contain `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git`
