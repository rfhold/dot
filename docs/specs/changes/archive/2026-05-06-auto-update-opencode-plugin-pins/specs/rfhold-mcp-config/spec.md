# rfhold MCP Configuration Delta Spec

Delta spec at `docs/specs/changes/auto-update-opencode-plugin-pins/specs/rfhold-mcp-config/spec.md`. Declares operations against the stable spec. Merged wholesale by `code-review`.

Change overview lives in `docs/specs/changes/auto-update-opencode-plugin-pins/specs/opencode-config/spec.md`.

## RENAMED Requirements

- FROM: `Preserve Legacy Skills Layout`
  TO: `Cfaintl Plugin Skill Filtering`

## MODIFIED Requirements

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

The system MUST treat the org-level `plugins` list as the exclusive delivery path for rfhold MCP servers and rfhold-scoped skills, MUST store the list in the static rfhold org `opencode.jsonc`, and MUST NOT also emit an inline `mcp` stanza for any server owned by a listed plugin. The static rfhold plugin list MUST contain exactly these plugin identities in this order, each pinned to a current `opencode/vX.Y.Z` release tag: `superspec`, `gitops-query`, `slack-query`, `grafana-query`, `atlassian-query`, `gsuite-query`, `axol-query`, `cuthulu`, `homelab`, and `walter`.

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
Then the plugin identities MUST equal this ordered list: `superspec`, `gitops-query`, `slack-query`, `grafana-query`, `atlassian-query`, `gsuite-query`, `axol-query`, `cuthulu`, `homelab`, and `walter`

## ADDED Requirements

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
