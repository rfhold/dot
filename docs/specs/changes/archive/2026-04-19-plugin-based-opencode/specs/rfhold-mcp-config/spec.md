# Delta: plugin-based-opencode / rfhold-mcp-config

This delta targets the `rfhold-mcp-config` stable spec AFTER the `canonicalize-rfhold-mcp-config-headings` change has merged. All requirement headings are therefore expected in canonical `### Requirement: <Name>` form, not the legacy `### REQ-NNN: <Name>` form.

## REMOVED Requirements

### Requirement: Per-Org Skills Whitelist
**Reason**: Skill delivery moves from filesystem whitelisting to plugin installation. Every rfhold skill is delivered by the plugin that owns the capability (a query-server plugin, a service plugin, or the `rfhold-skills` plugin). Allowlist authority is retained for legacy orgs that do not ship plugins via the REMOVED operation's companion requirements in the `opencode-config` domain (see `Plugin-Delivered Skills Supersede Filesystem Whitelist`).
**Migration**: Remove `skills_whitelist` from `ORG_SKILLS["rfhold"]`. Delete `~/repos/rfhold/.agents/skills/` and `~/repos/rfhold/.agents/skills-src/`. Re-run `configure.py` with the `skills` tag; rfhold skills load via plugins registered in the org `plugin` array.

### Requirement: Filtered Skills Directory Generation
**Reason**: With rfhold skills delivered via plugins, `configure.py` no longer produces a curated `.agents/skills/` tree or an internal skills-src clone for rfhold. The filtered generation flow continues to apply to orgs that still use `skills_whitelist` (such as `cfaintl`); the rfhold-specific obligation is removed.
**Migration**: Delete any leftover `~/repos/rfhold/.agents/skills/` and `~/repos/rfhold/.agents/skills-src/` directories. For orgs that still declare `skills_whitelist`, the filtered generation behavior is preserved under the MODIFIED `Preserve Legacy Skills Layout` requirement.

### Requirement: Initial Skill Allowlists
**Reason**: Bundling the rfhold and cfaintl allowlists in a single requirement becomes malformed once rfhold drops its allowlist. Responsibility for the cfaintl allowlist is absorbed into the MODIFIED `Preserve Legacy Skills Layout` requirement so it continues to ship exactly as today.
**Migration**: Delete rfhold entries from any `skills_whitelist` constants in `configure.py`. Preserve the cfaintl allowlist verbatim; its exact contents are enumerated in the MODIFIED `Preserve Legacy Skills Layout` requirement.

## MODIFIED Requirements

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
