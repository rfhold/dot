# rfhold MCP Configuration Delta Spec

## Change Overview

### Why
The current `configure.py` generator still reflects the partially-deferred state from the earlier plugin migration. For `rfhold`, it emits only the `superspec` plugin, still carries inline MCP source data for plugin-owned services, and does not yet make the org plugin list the practical source of truth for the full rfhold-scoped OpenCode plugin set.

The current cache-refresh helper is also still named `update-superspec.sh` and is scoped around refreshing one repository. That no longer matches the plugin-based OpenCode model, where operators sometimes need to clear OpenCode's cached packages broadly so the client re-downloads updated plugin packages.

### Impact
- **Breaking changes**: `configure.py` will no longer be allowed to emit a partial rfhold plugin list; the org plugin list must carry the full rfhold-scoped OpenCode plugin set in the documented order. The old `bin/update-superspec.sh` path will be replaced by `bin/update-oc-plugins.sh`.
- **Migration**: Update `ORG_SKILLS["rfhold"]["plugins"]` to the canonical rfhold plugin list, ensure generated `~/repos/rfhold/.agents/opencode.jsonc` reflects that list, rename the helper script to `bin/update-oc-plugins.sh`, and make the renamed helper clear OpenCode cached packages broadly instead of refreshing the superspec checkout.
- **Cross-change dependencies**: none

### Non-goals
- Moving global OpenCode plugin management into `configure.py`.
- Changing non-rfhold org plugin behavior.
- Changing the approved plugin package specifier format or plugin ownership model defined by the `opencode-config` domain.

### Rollback
Rollback is performed by reverting this delta before merge, or by reverting the merged behavior in `configure.py` and the helper script if the organization decides to manage rfhold plugins or OpenCode cache refresh differently. No persisted data migration is involved.

---

## MODIFIED Requirements

### Requirement: Org-Level Plugin List
The system MUST treat the org-level `plugins` list as the exclusive delivery path for rfhold MCP servers and rfhold-scoped skills, MUST emit the list verbatim into the generated org `opencode.jsonc`, and MUST NOT also emit an inline `mcp` stanza for any server owned by a listed plugin. The configured `ORG_SKILLS["rfhold"]["plugins"]` list MUST contain exactly these entries in this order: `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git`, `gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git`, `slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git`, `grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git`, `atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git`, `gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git`, `axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git`, `cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git`, `homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git`, and `walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git`.

#### Scenario: rfhold plugin array emitted verbatim
Given `ORG_SKILLS["rfhold"]["plugins"]` is a non-empty ordered list of plugin specifiers
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the generated file MUST contain a top-level `plugin` array whose entries equal the configured list in the same order
And each entry MUST use the `<name>@git+ssh://...` form

#### Scenario: plugin-owned MCP not duplicated inline
Given a plugin in `ORG_SKILLS["rfhold"]["plugins"]` registers an MCP server named `<name>`
When `configure.py` generates `~/repos/rfhold/.agents/opencode.jsonc`
Then the generated file MUST NOT contain `<name>` under a top-level `mcp` key

#### Scenario: rfhold plugin list contains the canonical entries in order
Given the current `ORG_SKILLS` definition
When `ORG_SKILLS["rfhold"]["plugins"]` is read
Then it MUST equal this ordered list: `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git`, `gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git`, `slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git`, `grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git`, `atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git`, `gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git`, `axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git`, `cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git`, `homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git`, and `walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git`

## ADDED Requirements

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
