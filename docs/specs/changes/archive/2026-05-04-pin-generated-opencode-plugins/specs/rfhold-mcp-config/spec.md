# Delta: pin-generated-opencode-plugins / rfhold-mcp-config

## Change Overview

### Why

`configure.py` is the source for generated rfhold org OpenCode config and still declares rfhold-hosted plugin packages with bare git URLs. Bare git URLs track the repository default branch, which violates the current rfhold OpenCode plugin distribution contract that plugin installs are pinned to an `opencode/vX.Y.Z` release tag.

### Impact

- **Breaking changes**: The generated rfhold org plugin list no longer accepts bare rfhold git plugin specifiers as conformant output.
- **Migration**: Pin every rfhold-hosted generated plugin specifier to `#opencode/v0.1.0` and publish matching `opencode/v0.1.0` tags for the additional plugin repositories.
- **Cross-change dependencies**: The common `opencode-plugin-authoring` spec already defines the canonical tag-pinned plugin specifier format.

### Non-goals

- Changing third-party npm-distributed OpenCode plugins.
- Editing archived historical dot spec changes.
- Changing plugin runtime behavior, MCP routing behavior, or generated non-rfhold org configuration.

### Rollback

Revert the `configure.py` plugin list and stable spec merge to the previous bare git specifiers. Published `opencode/v0.1.0` tags can remain because they do not affect branch-based installs.

---

## MODIFIED Requirements

### Requirement: rfhold-Only superspec Plugin
The system MUST treat `superspec` as one of several rfhold org-local plugins and MUST continue to list it in `~/repos/rfhold/.agents/opencode.jsonc`'s `plugin` array alongside the other rfhold plugins with an OpenCode release tag, while keeping it absent from global and non-rfhold org configuration.

#### Scenario: rfhold plugin array contains superspec alongside peers
Given `ORG_SKILLS["rfhold"]["plugins"]` lists multiple rfhold plugins including `superspec`
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the `plugin` array MUST contain `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v0.1.0`
And it MUST also contain each additional plugin entry listed in `ORG_SKILLS["rfhold"]["plugins"]`

#### Scenario: superspec absent from global and non-rfhold config
Given the current global OpenCode configuration and any non-rfhold org configuration
When `~/.config/opencode/opencode.jsonc` and the non-rfhold org `opencode.jsonc` are inspected
Then neither file's `plugin` array MUST contain `superspec`

### Requirement: Org-Level Plugin List
The system MUST treat the org-level `plugins` list as the exclusive delivery path for rfhold MCP servers and rfhold-scoped skills, MUST emit the list verbatim into the generated org `opencode.jsonc`, and MUST NOT also emit an inline `mcp` stanza for any server owned by a listed plugin. The configured `ORG_SKILLS["rfhold"]["plugins"]` list MUST contain exactly these entries in this order: `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v0.1.0`, `gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git#opencode/v0.1.0`, `slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git#opencode/v0.1.0`, `grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git#opencode/v0.1.0`, `atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git#opencode/v0.1.0`, `gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git#opencode/v0.1.0`, `axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git#opencode/v0.1.0`, `cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git#opencode/v0.1.0`, `homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git#opencode/v0.1.0`, and `walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git#opencode/v0.1.0`.

#### Scenario: rfhold plugin array emitted verbatim
Given `ORG_SKILLS["rfhold"]["plugins"]` is a non-empty ordered list of plugin specifiers
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the generated file MUST contain a top-level `plugin` array whose entries equal the configured list in the same order
And each rfhold git entry MUST use the `<name>@git+ssh://...#opencode/vX.Y.Z` form

#### Scenario: plugin-owned MCP not duplicated inline
Given a plugin in `ORG_SKILLS["rfhold"]["plugins"]` registers an MCP server named `<name>`
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the generated file MUST NOT contain `<name>` under a top-level `mcp` key

#### Scenario: rfhold plugin list contains the canonical entries in order
Given the current `ORG_SKILLS` definition
When `ORG_SKILLS["rfhold"]["plugins"]` is read
Then it MUST equal this ordered list: `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v0.1.0`, `gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git#opencode/v0.1.0`, `slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git#opencode/v0.1.0`, `grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git#opencode/v0.1.0`, `atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git#opencode/v0.1.0`, `gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git#opencode/v0.1.0`, `axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git#opencode/v0.1.0`, `cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git#opencode/v0.1.0`, `homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git#opencode/v0.1.0`, and `walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git#opencode/v0.1.0`
