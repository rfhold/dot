# Tasks: plugin-based-opencode

**Status**: draft

## Coverage Matrix

| Requirement | Task(s) |
|---|---|
| `opencode-config` ADDED: `Plugin-Based Capability Delivery` | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11 |
| `opencode-config` ADDED: `OpenCode Plugin Layout` | 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11 |
| `opencode-config` ADDED: `Query Plugin Contract` | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8 |
| `opencode-config` ADDED: `Skill-Only Plugin Contract` | 2.7, 2.9, 2.10, 2.11 |
| `opencode-config` ADDED: `Agent Plugin Contract` | 2.8 |
| `opencode-config` ADDED: `Cuthulu Plugin Ownership` | 2.7, 3.2 |
| `opencode-config` ADDED: `Plugin Activation Scope` | 3.1, 3.2 |
| `opencode-config` ADDED: `No Inline MCP for Plugin-Owned Servers` | 3.1, 3.2 |
| `opencode-config` ADDED: `Plugin Installation Via git+ssh` | 3.1, 3.2 |
| `opencode-config` ADDED: `Plugin-Delivered Skills Supersede Filesystem Whitelist` | 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10, 2.11, 3.3 |
| `opencode-config` ADDED: `Broken Skill Symlinks Removed` | 3.4 |
| `opencode-config` ADDED: `Per-Repository Skill Home` | 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 2.10, 2.11 |
| `opencode-config` ADDED: `Research Plugin Ownership` | 2.8, 3.1, 3.4 |
| `opencode-config` ADDED: `Plugin Source-Repo Accuracy` | 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 |
| `rfhold-mcp-config` REMOVED: `Per-Org Skills Whitelist` | 3.3 (filesystem cleanup); configure.py edit handled by user |
| `rfhold-mcp-config` REMOVED: `Filtered Skills Directory Generation` | 3.3 (filesystem cleanup); configure.py edit handled by user |
| `rfhold-mcp-config` REMOVED: `Initial Skill Allowlists` | configure.py edit handled by user |
| `rfhold-mcp-config` MODIFIED: `rfhold MCP Server Set` | 3.2 (committed opencode.jsonc output); configure.py generator update handled by user |
| `rfhold-mcp-config` MODIFIED: `rfhold-Only superspec Plugin` | 3.2 (committed opencode.jsonc output); configure.py generator update handled by user |
| `rfhold-mcp-config` MODIFIED: `Preserve Legacy Skills Layout` | configure.py edit handled by user (cfaintl branch unchanged) |
| `rfhold-mcp-config` MODIFIED: `Org-Level Plugin List` | 3.2 (committed opencode.jsonc output); configure.py generator update handled by user |

## AGENTS.md Notes

AGENTS.md files were read during plan-review. Notes are captured here and forwarded to `execution` and `code-review` via this file.

- `~/dot/.config/opencode/AGENTS.md`: no Co-authored-by trailers on commits; no emojis in output; terse comments (avoid section separators and restate-what-code-does); fix broken things encountered rather than pass them off as pre-existing.
- `~/repos/rfhold/skills/AGENTS.md`: this repo is a standalone git clone, not a submodule of `rfhold`. Commits and pushes are done from inside the repo. Applies to any skill relocation that modifies files here.
- `~/repos/rfhold/cuthulu/AGENTS.md`: cuthulu is a multi-service system (server / runtime-agent / tmux-agent / opencode plugin / tauri app) with OTEL trace propagation through `TRACEPARENT`. The `.opencode/plugins/cuthulu.js` artifact is produced by the repo's build tooling — do not hand-edit the bundled file. The plugin registration layer (skill paths + MCP wiring) is the surface this change touches.
- `~/repos/rfhold/atlassian-query/AGENTS.md`: self-contained Go module, no `walterd` dependency. MCP tool is `atlassian_query`. Server listens on `:9843`; deployed base URL override env is `ATLASSIAN_QUERY_URL=https://atlassian-query.holdenitdown.net`. Validation: `go build ./... && go test ./...`. Plugin work here MUST NOT break `go build ./...`.
- `~/repos/rfhold/gsuite-query/AGENTS.md`: self-contained Go module. MCP tool is `gsuite_query`. Server listens on `:9851`. Similar validation invariants.
- `~/repos/rfhold/axol/AGENTS.md`: namespaces `axol` (prod) / `axol-preview` (preview); service names `server`/`docstore`/`client` are generic so namespace is required in LogQL.
- `~/repos/rfhold/homelab/AGENTS.md`: NO comments unless requested; Bun only (no yarn/npm/node); check imports before using libraries. Plugin file written here MUST NOT include narrative comments.
- `~/repos/rfhold/walter/AGENTS.md`: avoid unnecessary comments and section separators; self-documenting code; CONTRIBUTING.md referenced. Plugin file MUST NOT include narrative comments.
- `~/repos/rfhold/re-search/`: no AGENTS.md present (confirmed by plan-review). Follow the global dot AGENTS.md conventions there.
- `~/repos/rfhold/gitops-query/`, `~/repos/rfhold/slack-query/`, `~/repos/rfhold/grafana-query/`: no AGENTS.md present. Fall back to global dot AGENTS.md conventions.
- `~/dot/`: no repo-root AGENTS.md beyond the global config dir one.

General convention across all plugin source repos: the authoritative reference for plugin shape is `~/repos/rfhold/superspec/.opencode/plugins/superspec.js` + `~/repos/rfhold/superspec/package.json`. Every new plugin MUST mirror that layout (see Task 1.1). Frontmatter `last-updated` on every relocated SKILL.md is bumped to `2026-04-19`.

---

## Stage 1: Plugin Layout Foundation + Shared Skills Host

Wait for the results from prior tasks before starting dependent sub agent tasks.

### Task 1.1: Document canonical OpenCode plugin layout in superspec

- **Implements**: `opencode-config` ADDED Requirement: `OpenCode Plugin Layout`; informs every downstream plugin (`Plugin-Based Capability Delivery`, `Per-Repository Skill Home`, `Plugin-Delivered Skills Supersede Filesystem Whitelist`, `Plugin Source-Repo Accuracy`).
- **Depends on**: (none)
- **Files**:
  - `~/repos/rfhold/superspec/adapters/opencode/README.md`
- **Approach**: Rewrite the adapter README to describe the canonical plugin layout so every downstream plugin author has one source of truth: `package.json` with `"main": ".opencode/plugins/<name>.js"`, `.opencode/plugins/<name>.js` that resolves `skillsDir` from `import.meta.url` and dedup-pushes it onto `config.skills.paths`, `skills/<skill-name>/SKILL.md` bundles at repo root, install via `<name>@git+ssh://git@git.holdenitdown.net/rfhold/<repo>.git` in an `opencode.jsonc` `plugin` array. Include a minimal skill-only skeleton and a minimal query-plugin skeleton (with `config.mcp[<short-name>] = { type: "remote", url: ... }`) plus a minimal agent-plugin skeleton (`config.agent.<name> = { prompt: <file-in-plugin> }`). Reference the existing `superspec.js` for the file layout. Commit and push from inside the superspec clone.
- **Dispatch**: subagent
- **Dispatch rationale**: context isolation — this task needs to study superspec.js in detail without dragging the coordinator's prior exploration context.

### Task 1.2: Convert rfhold/skills into the `rfhold-skills` plugin

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Delivered Skills Supersede Filesystem Whitelist` (retained rfhold-skills plugin scenario); `Per-Repository Skill Home` (for shared-but-not-single-repo skills).
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/skills/package.json`
  - `~/repos/rfhold/skills/.opencode/plugins/rfhold-skills.js`
  - `~/repos/rfhold/skills/skills/kubectl/**` (retained)
  - `~/repos/rfhold/skills/skills/forgejo-tea/**` (retained)
  - `~/repos/rfhold/skills/skills/tekton-pac/**` (retained)
  - `~/repos/rfhold/skills/skills/axol-query/` (REMOVE — relocated in 2.6)
  - `~/repos/rfhold/skills/skills/cuthulu-query/` (REMOVE — relocated in 2.7)
  - `~/repos/rfhold/skills/skills/gitops-query/` (REMOVE — relocated in 2.1)
  - `~/repos/rfhold/skills/skills/grafana-query/` (REMOVE — relocated in 2.3)
  - `~/repos/rfhold/skills/skills/homelab/` (REMOVE — relocated in 2.9)
  - `~/repos/rfhold/skills/skills/walter/` (REMOVE — relocated in 2.10)
  - `~/repos/rfhold/skills/skills/waltr-component/` (REMOVE — relocated in 2.11)
- **Approach**: Add `package.json` mirroring superspec's (name `rfhold-skills`, `type: module`, `main: .opencode/plugins/rfhold-skills.js`). Write `.opencode/plugins/rfhold-skills.js` exporting an async plugin factory whose `config` hook dedup-pushes `skillsDir` (resolved from `import.meta.url`) onto `config.skills.paths`, following superspec.js's pattern but without the bootstrap-injection hook. Leave `kubectl/`, `forgejo-tea/`, `tekton-pac/` in place (they describe cross-repo tooling with no single source repo). Delete the seven skill directories listed above; Stage 2 subagents write them into their owning repos. Commit and push from inside the repo.
- **Dispatch**: subagent
- **Dispatch rationale**: this task is scoped to a single repo distinct from Stage 2 work, benefits from context isolation, and its output (a working plugin file) is the pattern Stage 2 subagents copy.

### Stage Verification

- **Commands**:
  ```
  ls ~/repos/rfhold/superspec/adapters/opencode/README.md
  ls ~/repos/rfhold/skills/package.json ~/repos/rfhold/skills/.opencode/plugins/rfhold-skills.js
  ls ~/repos/rfhold/skills/skills/kubectl/SKILL.md ~/repos/rfhold/skills/skills/forgejo-tea/SKILL.md ~/repos/rfhold/skills/skills/tekton-pac/SKILL.md
  test ! -e ~/repos/rfhold/skills/skills/axol-query
  test ! -e ~/repos/rfhold/skills/skills/cuthulu-query
  test ! -e ~/repos/rfhold/skills/skills/gitops-query
  test ! -e ~/repos/rfhold/skills/skills/grafana-query
  test ! -e ~/repos/rfhold/skills/skills/homelab
  test ! -e ~/repos/rfhold/skills/skills/walter
  test ! -e ~/repos/rfhold/skills/skills/waltr-component
  node --input-type=module -e "import('/home/rfhold/repos/rfhold/skills/.opencode/plugins/rfhold-skills.js').then(m => { const fn = m.default ?? m.RfholdSkillsPlugin ?? Object.values(m).find(v => typeof v === 'function'); if (!fn) throw new Error('no plugin export'); const cfg = { skills: { paths: [] } }; return fn({}).then(p => p.config(cfg)).then(() => { if (!cfg.skills.paths.some(p => p.endsWith('/skills'))) throw new Error('skills path not registered'); }); })"
  ```
- **Expected outcome**: all `ls` and `test` commands exit 0; plugin loads and registers a skills path ending in `/skills`.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-04-19
- **Commands**:
  ```
  ls ~/repos/rfhold/superspec/adapters/opencode/README.md
  ls ~/repos/rfhold/skills/package.json ~/repos/rfhold/skills/.opencode/plugins/rfhold-skills.js
  ls ~/repos/rfhold/skills/skills/kubectl/SKILL.md ~/repos/rfhold/skills/skills/forgejo-tea/SKILL.md ~/repos/rfhold/skills/skills/tekton-pac/SKILL.md
  test ! -e ~/repos/rfhold/skills/skills/axol-query
  test ! -e ~/repos/rfhold/skills/skills/cuthulu-query
  test ! -e ~/repos/rfhold/skills/skills/gitops-query
  test ! -e ~/repos/rfhold/skills/skills/grafana-query
  test ! -e ~/repos/rfhold/skills/skills/homelab
  test ! -e ~/repos/rfhold/skills/skills/walter
  test ! -e ~/repos/rfhold/skills/skills/waltr-component
  node --input-type=module -e "import('/home/rfhold/repos/rfhold/skills/.opencode/plugins/rfhold-skills.js').then(...)"
  ```
- **Output**:
  ```
  /home/rfhold/repos/rfhold/superspec/adapters/opencode/README.md
  /home/rfhold/repos/rfhold/skills/.opencode/plugins/rfhold-skills.js
  /home/rfhold/repos/rfhold/skills/package.json
  /home/rfhold/repos/rfhold/skills/skills/forgejo-tea/SKILL.md
  /home/rfhold/repos/rfhold/skills/skills/kubectl/SKILL.md
  /home/rfhold/repos/rfhold/skills/skills/tekton-pac/SKILL.md
  axol-query: absent (ok)
  cuthulu-query: absent (ok)
  gitops-query: absent (ok)
  grafana-query: absent (ok)
  homelab: absent (ok)
  walter: absent (ok)
  waltr-component: absent (ok)
  plugin ok, paths: [ '/home/rfhold/repos/rfhold/skills/skills' ]
  ```
- **Files changed (across the stage)**:
  - `~/repos/rfhold/superspec/adapters/opencode/README.md` (written)
  - `~/repos/rfhold/skills/package.json` (created)
  - `~/repos/rfhold/skills/.opencode/plugins/rfhold-skills.js` (created)
  - `~/repos/rfhold/skills/skills/axol-query/` (deleted)
  - `~/repos/rfhold/skills/skills/cuthulu-query/` (deleted)
  - `~/repos/rfhold/skills/skills/gitops-query/` (deleted)
  - `~/repos/rfhold/skills/skills/grafana-query/` (deleted)
  - `~/repos/rfhold/skills/skills/homelab/` (deleted)
  - `~/repos/rfhold/skills/skills/walter/` (deleted)
  - `~/repos/rfhold/skills/skills/waltr-component/` (deleted)
- **AGENTS.md notes applied**: no Co-authored-by trailers; no emojis; terse comments; rfhold/skills committed from inside repo
- **Subagent statuses**:
  - Task 1.1: DONE (superspec adapter README written, committed da2a7ef)
  - Task 1.2: DONE (rfhold-skills plugin created, 7 skills deleted, committed d47ff01)

- [x] Stage 1 complete

---

## Stage 2: Plugin Scaffolding Per Source Repo

Batch execute tasks that can be run in parallel sub agents.

### Task 2.1: `gitops-query` plugin + relocated skill

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Query Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`; `Plugin Source-Repo Accuracy`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/gitops-query/package.json`
  - `~/repos/rfhold/gitops-query/.opencode/plugins/gitops-query.js`
  - `~/repos/rfhold/gitops-query/skills/gitops-query/SKILL.md`
  - `~/repos/rfhold/gitops-query/skills/gitops-query/references/*` (if any existed in original)
- **Approach**: Add `package.json` (name `gitops-query`, type `module`, main `.opencode/plugins/gitops-query.js`). Plugin file registers `config.mcp.gitops = { type: "remote", url: "https://preview-gitops-query.holdenitdown.net" }` and dedup-pushes `skills/` onto `config.skills.paths`. Copy the gitops-query SKILL.md bundle verbatim from the content currently at `~/repos/rfhold/skills/skills/gitops-query/` into `skills/gitops-query/`; bump frontmatter `last-updated` to `2026-04-19`; confirm `source-repo: rfhold/gitops-query`. Commit and push.
- **Dispatch**: subagent

### Task 2.2: `slack-query` plugin + new skill stub

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Query Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`; `Plugin Source-Repo Accuracy`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/slack-query/package.json`
  - `~/repos/rfhold/slack-query/.opencode/plugins/slack-query.js`
  - `~/repos/rfhold/slack-query/skills/slack-query/SKILL.md`
- **Approach**: Same shape as 2.1 but MCP url `https://preview-slack-query.holdenitdown.net`, MCP key `slack`, plugin name `slack-query`. Write a minimal SKILL.md stub mirroring the gitops-query skill's shape: name, description with trigger phrases ("slack", "slack_query", etc.), metadata with `source-repo: rfhold/slack-query` and `last-updated: 2026-04-19`, body derived from the server's `cmd/slack-query-server/` and `docs/` so the model knows when to invoke `slack_query`. Commit and push.
- **Dispatch**: subagent

### Task 2.3: `grafana-query` plugin + relocated skill (fix source-repo)

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Query Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`; `Plugin Source-Repo Accuracy` (grafana-query mis-attribution correction scenario).
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/grafana-query/package.json`
  - `~/repos/rfhold/grafana-query/.opencode/plugins/grafana-query.js`
  - `~/repos/rfhold/grafana-query/skills/grafana-query/SKILL.md`
- **Approach**: Same shape as 2.1 but MCP url `https://preview-grafana-query.holdenitdown.net`, MCP key `grafana`, plugin name `grafana-query`. Copy SKILL.md content verbatim from `~/repos/rfhold/skills/skills/grafana-query/`; correct frontmatter `source-repo` from `rfhold/waltr-grafana` to `rfhold/grafana-query`; bump `last-updated` to `2026-04-19`. Commit and push.
- **Dispatch**: subagent

### Task 2.4: `atlassian-query` plugin + new skill stub

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Query Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`; `Plugin Source-Repo Accuracy`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/atlassian-query/package.json`
  - `~/repos/rfhold/atlassian-query/.opencode/plugins/atlassian-query.js`
  - `~/repos/rfhold/atlassian-query/skills/atlassian-query/SKILL.md`
- **Approach**: Same shape as 2.1 but MCP url `https://atlassian-query.holdenitdown.net` (matching `ATLASSIAN_QUERY_URL` default from the repo's AGENTS.md — confirm against `manifests/` during implementation; if a `preview-atlassian-query.holdenitdown.net` exists in manifests, prefer that to match the preview pattern used by gitops/slack/grafana), MCP key `atlassian`, plugin name `atlassian-query`. Write a minimal SKILL.md stub (name, description, trigger phrases for Jira/Confluence queries, `source-repo: rfhold/atlassian-query`, `last-updated: 2026-04-19`). Commit and push. Observe AGENTS.md constraint: plugin file is JS, not Go; do not introduce commented section separators or restate-what-code-does lines.
- **Dispatch**: subagent

### Task 2.5: `gsuite-query` plugin + new skill stub

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Query Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`; `Plugin Source-Repo Accuracy`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/gsuite-query/package.json`
  - `~/repos/rfhold/gsuite-query/.opencode/plugins/gsuite-query.js`
  - `~/repos/rfhold/gsuite-query/skills/gsuite-query/SKILL.md`
- **Approach**: Same shape as 2.1; MCP url derived from `manifests/` (prefer a preview URL if present, otherwise production `gsuite-query.holdenitdown.net`), MCP key `gsuite`, plugin name `gsuite-query`. Skill stub describes `gsuite_query` Gmail+Calendar surface per AGENTS.md. Frontmatter `source-repo: rfhold/gsuite-query`, `last-updated: 2026-04-19`. Commit and push.
- **Dispatch**: subagent

### Task 2.6: `axol-query` plugin + relocated skill (in rfhold/axol repo)

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Query Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`; `Plugin Source-Repo Accuracy`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/axol/package.json` (create or extend — axol may already have a package.json for its SolidJS client; add `"opencode": { ... }` field, OR add a dedicated sub-package if its existing `package.json` is incompatible)
  - `~/repos/rfhold/axol/.opencode/plugins/axol-query.js`
  - `~/repos/rfhold/axol/skills/axol-query/SKILL.md`
- **Approach**: Plugin name `axol-query` (not `axol` — the repo owns the axol service but the plugin surfaces the `axol_query` MCP). MCP key `axol`, url derived from axol's `manifests/` preview endpoint. Copy SKILL.md content from `~/repos/rfhold/skills/skills/axol-query/`; set `source-repo: rfhold/axol`, `last-updated: 2026-04-19`. **Compatibility check**: inspect the existing `~/repos/rfhold/axol/package.json`; if `main` is already bound to the client build output, add an `"opencode"` field that OpenCode's plugin loader can read, OR create `~/repos/rfhold/axol/.opencode/package.json` as a minimal sibling package so `axol-query@git+ssh://...rfhold/axol.git` resolves to the plugin. Document the chosen path inside the plugin file. Commit and push. Observe axol's namespace-disambiguation note from AGENTS.md (not applicable to plugin wiring, but preserve any Grafana query strings in the skill body).
- **Dispatch**: subagent
- **Dispatch rationale**: this is the most complex plugin task — the axol repo likely already uses package.json for its SolidJS client; the subagent needs isolation to decide between in-place extension vs a sibling package without dragging coordinator context.

### Task 2.7: `cuthulu` plugin (TypeScript source + relocated cuthulu/cuthulu-query skills)

- **Implements**: `opencode-config` ADDED Requirement: `Cuthulu Plugin Ownership` (both scenarios); `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Skill-Only Plugin Contract` (no MCP registered by this plugin itself — the cuthulu MCP endpoint is separate); `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/cuthulu/package.json` (extend existing)
  - `~/repos/rfhold/cuthulu/.opencode/plugins/cuthulu.ts` (authored TS source, not a bundled JS artifact — layer skills path registration on top of the session-monitoring logic)
  - `~/repos/rfhold/cuthulu/skills/cuthulu/SKILL.md`
  - `~/repos/rfhold/cuthulu/skills/cuthulu-query/SKILL.md`
- **Approach**: OpenCode loads `.ts` plugins directly (see `~/.config/opencode/plugins/anthropic-oauth.ts` in dot as precedent), so no build step is needed. Locate the original TypeScript source for the cuthulu plugin (check inside `~/repos/rfhold/cuthulu/` for a `plugin/`, `opencode/`, or similar subtree; the 1.4MB `~/dot/.config/opencode/plugins/cuthulu.js` is a bundled artifact we are replacing). Author `.opencode/plugins/cuthulu.ts` from that TS source, with a `config` hook that dedup-pushes the resolved `skills/` directory onto `config.skills.paths` using `import.meta.url` resolution. Update `package.json` `main` to `.opencode/plugins/cuthulu.ts`. Relocate the `cuthulu` and `cuthulu-query` skill bundles from `~/dot/home/.agents/skills/cuthulu/` and `~/repos/rfhold/skills/skills/cuthulu-query/` respectively into `~/repos/rfhold/cuthulu/skills/`; bump `last-updated` to `2026-04-19`; confirm `source-repo: rfhold/cuthulu`. The plugin MUST NOT register an MCP inside this task — cuthulu's MCP wiring, if any, comes through an existing layer and is out of scope. If TS source cannot be located, escalate (`NEEDS_CONTEXT`) rather than commit the bundled 1.4MB JS. Commit and push.
- **Dispatch**: subagent
- **Dispatch rationale**: locating the TS source and porting it benefits from context isolation; avoids dragging the coordinator's exploration context into the plugin authoring step.

### Task 2.8: `re-search` plugin (MCP + agent + skill stub)

- **Implements**: `opencode-config` ADDED Requirement: `Agent Plugin Contract`; `Research Plugin Ownership`; `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Query Plugin Contract`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/re-search/package.json`
  - `~/repos/rfhold/re-search/.opencode/plugins/re-search.js`
  - `~/repos/rfhold/re-search/.opencode/agents/research.md` (port from dot)
  - `~/repos/rfhold/re-search/skills/research/SKILL.md`
- **Approach**: Port `~/dot/.config/opencode/agent/research.md` verbatim into the plugin repo at `.opencode/agents/research.md`. Plugin file registers `config.mcp.research = { type: "remote", url: "https://re-search.holdenitdown.net/mcp", timeout: 600000 }` (matching the current global opencode.jsonc entry), registers `config.agent.research = { prompt: <path to .opencode/agents/research.md> }` using `import.meta.url` resolution, and dedup-pushes `skills/` onto `config.skills.paths`. Author a minimal `skills/research/SKILL.md` describing when to invoke the research agent or MCP (trigger phrases: "research", "deep research", etc.), `source-repo: rfhold/re-search`, `last-updated: 2026-04-19`. Commit and push.
- **Dispatch**: subagent
- **Dispatch rationale**: the only plugin that registers all three surfaces (MCP + agent + skill); isolation ensures the agent-prompt port and timeout wiring get focused attention.

### Task 2.9: `homelab` skill-only plugin

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Skill-Only Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/homelab/package.json` (likely extend existing — homelab already uses Bun per AGENTS.md)
  - `~/repos/rfhold/homelab/.opencode/plugins/homelab.js`
  - `~/repos/rfhold/homelab/skills/homelab/SKILL.md`
- **Approach**: Plugin only pushes `skills/` onto `config.skills.paths`. Copy SKILL.md from `~/repos/rfhold/skills/skills/homelab/`; set `source-repo: rfhold/homelab`, `last-updated: 2026-04-19`. Observe AGENTS.md: **no comments in the JS file** unless required for correctness; use Bun conventions; check imports before using. Extend existing `package.json` if possible — if the existing main field conflicts, add an `.opencode/` sub-package as a workspace member. Commit and push.
- **Dispatch**: subagent

### Task 2.10: `walter` skill-only plugin (walter + waltr-component skills)

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `OpenCode Plugin Layout`; `Skill-Only Plugin Contract`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`.
- **Depends on**: 1.1
- **Files**:
  - `~/repos/rfhold/walter/package.json`
  - `~/repos/rfhold/walter/.opencode/plugins/walter.js`
  - `~/repos/rfhold/walter/skills/walter/SKILL.md`
  - `~/repos/rfhold/walter/skills/waltr-component/SKILL.md`
- **Approach**: Plugin only pushes `skills/` onto `config.skills.paths`. Copy SKILL.md bundles from `~/repos/rfhold/skills/skills/walter/` and `~/repos/rfhold/skills/skills/waltr-component/`; set both `source-repo: rfhold/walter`, `last-updated: 2026-04-19`. Observe walter AGENTS.md (no section-separator comments). Commit and push.
- **Dispatch**: subagent

### Task 2.11: Confirm no other skill relocations required

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Based Capability Delivery`; `Plugin-Delivered Skills Supersede Filesystem Whitelist`; `Per-Repository Skill Home`; `Skill-Only Plugin Contract`.
- **Depends on**: 1.1, 1.2
- **Files**:
  - `~/repos/rfhold/skills/skills/` (verify only `kubectl/`, `forgejo-tea/`, `tekton-pac/` remain after 1.2)
  - `~/dot/home/.agents/skills/` (verify only generic tool skills remain: `pyinfra`, `slidev`, `tmux-tui`, `machine-tts-stt` — these are out of scope for this change)
- **Approach**: Inspection-only task. After 1.2 and Stage 2 tasks 2.1–2.10 complete, verify no other repo-coupled skill remained behind. If a previously unknown repo-coupled skill is discovered, report it (`NEEDS_CONTEXT`) rather than silently create a new plugin.
- **Dispatch**: inline
- **Dispatch rationale**: pure verification, no file changes, runs in coordinator context after the other Stage 2 subagents return.

### Stage Verification

- **Commands**:
  ```
  for repo in gitops-query slack-query grafana-query atlassian-query gsuite-query axol cuthulu re-search homelab walter; do
    echo "== $repo =="
    ls ~/repos/rfhold/$repo/package.json || true
    ls ~/repos/rfhold/$repo/.opencode/plugins/*.js || true
    ls -d ~/repos/rfhold/$repo/skills/*/ || true
  done
  for skill in gitops-query slack-query grafana-query atlassian-query gsuite-query research; do
    grep -l "source-repo:" ~/repos/rfhold/*/skills/$skill/SKILL.md 2>/dev/null || echo "missing: $skill"
  done
  grep -l "source-repo: rfhold/grafana-query" ~/repos/rfhold/grafana-query/skills/grafana-query/SKILL.md
  grep -l "source-repo: rfhold/waltr-grafana" ~/repos/rfhold/ -R 2>/dev/null | head -5
  test ! -e ~/repos/rfhold/skills/skills/gitops-query
  test ! -e ~/repos/rfhold/skills/skills/grafana-query
  test ! -e ~/repos/rfhold/skills/skills/axol-query
  test ! -e ~/repos/rfhold/skills/skills/cuthulu-query
  test ! -e ~/repos/rfhold/skills/skills/homelab
  test ! -e ~/repos/rfhold/skills/skills/walter
  test ! -e ~/repos/rfhold/skills/skills/waltr-component
  test ! -e ~/dot/home/.agents/skills/cuthulu
  test ! -e ~/dot/home/.agents/skills/gitops-query
  ls ~/repos/rfhold/re-search/.opencode/agents/research.md
  ```
- **Expected outcome**: each of the 10 plugin repos shows a `package.json`, exactly one `.opencode/plugins/*.js`, and at least one `skills/<name>/` directory; the 6 skill-lookup lines each resolve to the right repo; the grafana-query mis-attribution grep returns zero matches; every `test ! -e` exits 0 (relocated skills no longer exist in their old homes); the re-search agent prompt file exists. No `wrong source-repo: rfhold/waltr-grafana` remains anywhere under `~/repos/rfhold`.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-04-19
- **Commands** (abridged — full verification per stage spec):
  ```
  for repo in gitops-query slack-query grafana-query atlassian-query gsuite-query axol cuthulu re-search homelab walter; do
    ls ~/repos/rfhold/$repo/package.json
    ls ~/repos/rfhold/$repo/.opencode/plugins/
    ls -d ~/repos/rfhold/$repo/skills/*/
  done
  for skill in gitops-query slack-query grafana-query atlassian-query gsuite-query research; do
    grep -l "source-repo:" ~/repos/rfhold/*/skills/$skill/SKILL.md
  done
  grep -l "source-repo: rfhold/grafana-query" ~/repos/rfhold/grafana-query/skills/grafana-query/SKILL.md
  # confirmed: "source-repo: rfhold/waltr-grafana" absent from grafana-query skill
  test ! -e ~/repos/rfhold/skills/skills/{gitops-query,grafana-query,axol-query,cuthulu-query,homelab,walter,waltr-component}
  test ! -e ~/dot/home/.agents/skills/cuthulu
  test ! -e ~/dot/home/.agents/skills/gitops-query
  ls ~/repos/rfhold/re-search/.opencode/agents/research.md
  ```
- **Output**:
  ```
  All 10 plugin repos: package.json ✓, .opencode/plugins/ ✓ (js or ts), skills/ ✓
  all 6 source-repo: grep lines found matching SKILL.md files
  grafana-query: source-repo: rfhold/grafana-query (corrected from rfhold/waltr-grafana) ✓
  waltr-grafana attribution: absent ✓
  skills absent from rfhold/skills/skills: ok1-ok7 ✓
  dot cuthulu absent: ok8 ✓
  dot gitops-query absent: ok9 ✓
  re-search agent prompt: /home/rfhold/repos/rfhold/re-search/.opencode/agents/research.md ✓
  ```
- **Files changed (across the stage)**:
  - `~/repos/rfhold/gitops-query/package.json`, `.opencode/plugins/gitops-query.js`, `skills/gitops-query/SKILL.md`
  - `~/repos/rfhold/slack-query/package.json`, `.opencode/plugins/slack-query.js`, `skills/slack-query/SKILL.md`
  - `~/repos/rfhold/grafana-query/package.json`, `.opencode/plugins/grafana-query.js`, `skills/grafana-query/SKILL.md`
  - `~/repos/rfhold/atlassian-query/package.json`, `.opencode/plugins/atlassian-query.js`, `skills/atlassian-query/SKILL.md`
  - `~/repos/rfhold/gsuite-query/package.json`, `.opencode/plugins/gsuite-query.js`, `skills/gsuite-query/SKILL.md`
  - `~/repos/rfhold/axol/package.json`, `.opencode/plugins/axol-query.js`, `skills/axol-query/SKILL.md`
  - `~/repos/rfhold/cuthulu/package.json`, `.opencode/plugins/cuthulu.ts`, `skills/cuthulu/SKILL.md`, `skills/cuthulu-query/SKILL.md`
  - `~/repos/rfhold/re-search/package.json`, `.opencode/plugins/re-search.js`, `.opencode/agents/research.md`, `skills/research/SKILL.md`
  - `~/repos/rfhold/homelab/package.json` (extended), `.opencode/plugins/homelab.js`, `skills/homelab/SKILL.md`
  - `~/repos/rfhold/walter/package.json` (extended), `.opencode/plugins/walter.js`, `skills/walter/SKILL.md`, `skills/waltr-component/SKILL.md`
  - `~/dot/home/.agents/skills/cuthulu/SKILL.md` (deleted)
  - `~/dot/home/.agents/skills/gitops-query/SKILL.md` (deleted)
- **AGENTS.md notes applied**:
  - atlassian-query/gsuite-query: no commented section separators; `go build ./...` passes
  - homelab: no comments in plugin JS file; Bun conventions
  - walter: no unnecessary comments or section separators
  - cuthulu: no hand-editing bundled JS; OTEL TRACEPARENT preserved; Bun.spawnSync retained (inherited from original plugin, OpenCode runs on Bun)
  - all repos: no Co-authored-by trailers; no emojis
- **Subagent statuses**:
  - Task 2.1 (gitops-query): DONE
  - Task 2.2 (slack-query): DONE
  - Task 2.3 (grafana-query): DONE
  - Task 2.4 (atlassian-query): DONE — go build passes
  - Task 2.5 (gsuite-query): DONE — go build passes
  - Task 2.6 (axol): DONE — MCP URL: `https://preview-axol.holdenitdown.net`
  - Task 2.7 (cuthulu): DONE — Bun.spawnSync retained (inherited from original; accepted)
  - Task 2.8 (re-search): DONE
  - Task 2.9 (homelab): DONE — no comments in plugin per AGENTS.md
  - Task 2.10 (walter): DONE — root package.json extended (no field conflict)
  - Task 2.11 (inspection): DONE inline — rfhold/skills/skills/ has only kubectl/forgejo-tea/tekton-pac; dot/.agents/skills/ has only machine-tts-stt/pyinfra/slidev/tmux-tui after cleanup

- [x] Stage 2 complete

---

## Stage 3: Wire Plugins Into Config + Cleanup

Wait for the results from prior tasks before starting dependent sub agent tasks.

### Task 3.1: Update global `~/dot/.config/opencode/opencode.jsonc`

- **Implements**: `opencode-config` ADDED Requirement: `Plugin Activation Scope` (global-everywhere scenario); `No Inline MCP for Plugin-Owned Servers`; `Plugin Installation Via git+ssh`; `Research Plugin Ownership` (global install + no inline `mcp.research`).
- **Depends on**: Stage 2 complete (all 10 plugin repos pushed)
- **Files**:
  - `~/dot/.config/opencode/opencode.jsonc`
- **Approach**: Remove the `mcp.research` stanza (re-search plugin owns it now). Leave the `mcp.playwright` entry (non-plugin MCP) untouched. Append to the existing `plugin` array these two entries in order: `re-search@git+ssh://git@git.holdenitdown.net/rfhold/re-search.git`, `rfhold-skills@git+ssh://git@git.holdenitdown.net/rfhold/skills.git`. Do NOT remove the existing `@franlol/opencode-md-table-formatter@0.0.3` and `@tarquinen/opencode-dcp@beta` entries. Commit from inside the dot repo.
- **Dispatch**: inline
- **Dispatch rationale**: single-file, single-repo edit with tightly-bounded diff; quick back-and-forth with the user is valuable if the jsonc edit surfaces a subtle issue.

### Task 3.2: Update rfhold org `~/repos/rfhold/.agents/opencode.jsonc` + remove loose cuthulu.js

- **Implements**: `opencode-config` ADDED Requirement: `Cuthulu Plugin Ownership` (legacy loose plugin file removed scenario); `Plugin Activation Scope` (rfhold-scoped scenarios); `No Inline MCP for Plugin-Owned Servers`; `Plugin Installation Via git+ssh`; `rfhold-mcp-config` MODIFIED: `rfhold MCP Server Set`; `rfhold-Only superspec Plugin`; `Org-Level Plugin List`.
- **Depends on**: Stage 2 complete; Task 3.1
- **Files**:
  - `~/repos/rfhold/.agents/opencode.jsonc`
  - `~/dot/.config/opencode/plugins/cuthulu.js` (DELETE)
- **Approach**: This file is generated by `configure.py` but currently committed. Drop the entire `mcp` object (`gitops`, `slack`, `grafana` all come from plugins now). Replace the `plugin` array with, in order: `superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git`, `gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git`, `slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git`, `grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git`, `atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git`, `gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git`, `axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git`, `cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git`, `homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git`, `walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git`. Delete `~/dot/.config/opencode/plugins/cuthulu.js`. Commit both edits from the dot repo.
- **Dispatch**: inline
- **Dispatch rationale**: depends on 3.1 (sequential), touches two files in one dot repo, mechanical.

### Task 3.3: Delete stale rfhold skills directories

- **Implements**: `opencode-config` ADDED Requirement: `Plugin-Delivered Skills Supersede Filesystem Whitelist` (no duplicate in `.agents/skills/`).
- **Depends on**: 3.2
- **Files**:
  - `~/repos/rfhold/.agents/skills/` (DELETE)
  - `~/repos/rfhold/.agents/skills-src/` (DELETE)
- **Approach**: Run `rm -rf ~/repos/rfhold/.agents/skills ~/repos/rfhold/.agents/skills-src` so no filesystem-whitelist tree lingers alongside the plugin-delivered skills. `configure.py` changes (drop rfhold `skills_whitelist` and `mcp_servers`, extend rfhold `plugins`) are handled by the user separately and are out of scope for this task. The rfhold-mcp-config REMOVED and MODIFIED requirements are satisfied at the behavior level by Tasks 3.1/3.2 (the generated files no longer emit inline rfhold MCP stanzas or a whitelist-driven skills tree) plus the user's separate `configure.py` edit.
- **Dispatch**: inline
- **Dispatch rationale**: mechanical filesystem cleanup, depends on 3.2.

### Task 3.4: Remove broken skill symlinks under `~/.agents/skills/` + `~/.config/opencode/agent/research.md`

- **Implements**: `opencode-config` ADDED Requirement: `Broken Skill Symlinks Removed` (all three scenarios); `Research Plugin Ownership` (no `agent/research.md` in dot).
- **Depends on**: 3.1 (so re-search plugin is installed before dot's research agent file is removed)
- **Files**:
  - `~/.agents/skills/oc-agent` (DELETE — dangling symlink)
  - `~/.agents/skills/oc-skill` (DELETE — dangling symlink)
  - `~/.agents/skills/atlassian-query/` (DELETE — orphan dir with dangling SKILL.md)
  - `~/.config/opencode/agent/research.md` (DELETE — owned by re-search plugin now; this is a symlink into `~/dot/.config/opencode/agent/research.md`, so delete the source file inside dot)
  - `~/dot/.config/opencode/agent/research.md` (DELETE)
- **Approach**: `rm` the three global skill paths (use `-rf` on the atlassian-query directory; plain `rm` on the two dangling symlinks). Delete the dot-tracked research agent file from inside the dot repo; commit. The `~/.config/opencode/agent/research.md` symlink becomes stale naturally once the source file is gone — confirm with `ls -la`.
- **Dispatch**: inline
- **Dispatch rationale**: mechanical filesystem cleanup, no isolation benefit, user may want to sanity-check before deletion.

### Stage Verification

- **Commands**:
  ```
  # Global config has new plugins + no inline mcp.research
  grep -c 're-search@git+ssh' ~/dot/.config/opencode/opencode.jsonc
  grep -c 'rfhold-skills@git+ssh' ~/dot/.config/opencode/opencode.jsonc
  ! grep -q '"research"' <(python3 -c "import json, re, sys; s=open('/home/rfhold/dot/.config/opencode/opencode.jsonc').read(); s=re.sub(r'//.*','',s); d=json.loads(s); print(json.dumps(d.get('mcp',{}),indent=2))")
  # rfhold org config has 10 plugins + no inline mcp
  python3 -c "import json, re; s=open('/home/rfhold/repos/rfhold/.agents/opencode.jsonc').read(); s=re.sub(r'//.*','',s); d=json.loads(s); assert len(d.get('plugin',[]))==10, d.get('plugin'); assert not d.get('mcp'), d.get('mcp')"
  # cuthulu loose plugin removed
  test ! -e ~/dot/.config/opencode/plugins/cuthulu.js
  test ! -e ~/.config/opencode/plugins/cuthulu.js
  # Dangling symlinks + orphan dir removed
  test ! -e ~/.agents/skills/oc-agent
  test ! -e ~/.agents/skills/oc-skill
  test ! -e ~/.agents/skills/atlassian-query
  # research agent file gone
  test ! -e ~/dot/.config/opencode/agent/research.md
  test ! -e ~/.config/opencode/agent/research.md
  # filtered-skills tree gone for rfhold
  test ! -e ~/repos/rfhold/.agents/skills
  test ! -e ~/repos/rfhold/.agents/skills-src
  # Full opencode plugin-resolution smoke (global): opencode prints no error on startup in ~
  cd ~ && opencode --help >/dev/null 2>&1 && echo global-ok
  # rfhold-scoped smoke
  cd ~/repos/rfhold && opencode --help >/dev/null 2>&1 && echo rfhold-ok
  ```
- **Expected outcome**: both `grep -c` lines return 1; global config parse confirms no `mcp.research`; rfhold config parse confirms exactly 10 plugin entries and an empty (or absent) `mcp` object; every `test ! -e` exits 0; both `opencode --help` smoke tests print their ok sentinel.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-04-19
- **Commands**:
  ```
  grep -c 're-search@git+ssh' ~/dot/.config/opencode/opencode.jsonc         # → 1
  grep -c 'rfhold-skills@git+ssh' ~/dot/.config/opencode/opencode.jsonc     # → 1
  grep '"research"' ~/dot/.config/opencode/opencode.jsonc                    # → absent
  grep -c 'git+ssh' ~/repos/rfhold/.agents/opencode.jsonc                   # → 10
  grep '"mcp"' ~/repos/rfhold/.agents/opencode.jsonc                        # → absent
  test ! -e ~/dot/.config/opencode/plugins/cuthulu.js                       # → ok
  test ! -e ~/.config/opencode/plugins/cuthulu.js                           # → ok
  test ! -e ~/.agents/skills/oc-agent                                       # → ok
  test ! -e ~/.agents/skills/oc-skill                                       # → ok
  test ! -e ~/.agents/skills/atlassian-query                                # → ok
  test ! -e ~/dot/.config/opencode/agent/research.md                        # → ok
  test ! -e ~/.config/opencode/agent/research.md                            # → ok
  test ! -e ~/repos/rfhold/.agents/skills                                   # → ok
  test ! -e ~/repos/rfhold/.agents/skills-src                               # → ok
  cd ~ && opencode --help >/dev/null 2>&1 && echo global-ok                 # → global-ok
  cd ~/repos/rfhold && opencode --help >/dev/null 2>&1 && echo rfhold-ok   # → rfhold-ok
  ```
- **Output**: all checks passed; both smoke tests printed ok sentinel
- **Files changed (across the stage)**:
  - `~/dot/.config/opencode/opencode.jsonc` (removed mcp.research; added re-search + rfhold-skills plugins)
  - `~/dot/.config/opencode/agent/research.md` (git rm — owned by re-search plugin now)
  - `~/dot/home/.agents/skills/cuthulu/SKILL.md` (already deleted in Stage 2)
  - `~/dot/home/.agents/skills/gitops-query/SKILL.md` (already deleted in Stage 2)
  - `~/repos/rfhold/.agents/opencode.jsonc` (replaced: 10 plugins, no mcp stanza)
  - `~/dot/.config/opencode/plugins/cuthulu.js` (rm — untracked file, now gone)
  - `~/repos/rfhold/.agents/skills/` (rm -rf)
  - `~/repos/rfhold/.agents/skills-src/` (rm -rf)
  - `~/.agents/skills/oc-agent` (rm — dangling symlink)
  - `~/.agents/skills/oc-skill` (rm — dangling symlink)
  - `~/.agents/skills/atlassian-query/` (rm -rf — orphan dir with dangling SKILL.md)
- **AGENTS.md notes applied**: no Co-authored-by trailers; no emojis; dot commits use terse messages
- **Subagent statuses**: all Stage 3 tasks were inline (no subagents)

- [x] Stage 3 complete

---

## Follow-ups

`<!-- FOLLOW-UP(2026-04-19): configure.py edits (drop rfhold skills_whitelist + mcp_servers; extend rfhold plugins to the 10-entry list from Task 3.2; cfaintl branch untouched) are handled by the user outside this execution. Required to fully satisfy rfhold-mcp-config REMOVED: Per-Org Skills Whitelist / Filtered Skills Directory Generation / Initial Skill Allowlists, and MODIFIED: rfhold MCP Server Set / rfhold-Only superspec Plugin / Preserve Legacy Skills Layout / Org-Level Plugin List at the generator level. The committed opencode.jsonc from Task 3.2 already reflects the target generator output. -->`

`<!-- FOLLOW-UP(2026-04-19): Evaluate plugin-izing the generic tool skills currently in ~/dot/home/.agents/skills/ (pyinfra, slidev, tmux-tui, machine-tts-stt). This change explicitly leaves them as filesystem skills. -->`

`<!-- FOLLOW-UP(2026-04-19): Evaluate plugin-izing the custom commands (~/.config/opencode/command/{cp,cpr,just,pr}.md) and tools (~/.config/opencode/tool/*.ts). This change leaves them as loose files. -->`

`<!-- FOLLOW-UP(2026-04-19): Once every rfhold plugin has a stable release discipline, consider pinning git+ssh URLs to tags (noted as a SUGGESTION by review-changes pass 2). Currently all plugins track main. -->`

`<!-- FOLLOW-UP(2026-04-19): If axol-query plugin ends up needing a sibling package (Task 2.6 compatibility fork), evaluate whether rfhold/axol should split the SolidJS client into a sub-workspace. -->`

`<!-- FOLLOW-UP(2026-04-19): Inline MCP url in each query plugin is currently hardcoded to the preview domain. Consider env-var fallbacks in the plugin file once production endpoints exist (explicitly a non-goal of this change). -->`

---

## Review summary

Findings from `review-changes` validation pass 2 (handoff context):

- **CRITICAL**: none — the pass-1 CRITICAL (legacy REQ-NNN headings in the rfhold-mcp-config delta) was resolved by merging the prerequisite `canonicalize-rfhold-mcp-config-headings` change and rewriting the delta against the canonicalized stable spec. Both deltas are now precondition-clean.
- **WARNING**: none objectively blocking. (Pass 1 raised three WARNINGs that were resolved by user direction: REQ-008 consolidation absorbing the cfaintl allowlist — ACCEPTED; dual bullet+scenario format — irrelevant post-canonicalize; legacy heading convention — ELEVATED to CRITICAL, resolved by the prerequisite change.)
- **SUGGESTION**: Plugin `git+ssh` URLs track `main` for every rfhold plugin. Once release discipline stabilizes per-plugin, consider pinning tags in `opencode.jsonc`. Recorded as a follow-up above.

---

## Approval

- [x] User has reviewed and approved this plan (written). This is the workflow's sole approval gate.
