---
feature: rfhold-mcp-config
spec: docs/specs/rfhold-mcp-config/spec.md
status: draft
created: 2026-04-17
updated: 2026-04-17
---

# rfhold MCP Configuration Plan

## Goal

Implement the approved rfhold-mcp-config spec by updating `configure.py` and the global OpenCode config so that `rfhold/*` repos expose exactly the `gitops`, `slack`, and `grafana` preview MCP servers, activate `superspec` only in rfhold, and expose a curated allowlisted `.agents/skills/` tree per org.

## Planning Notes

- All behavior changes are concentrated in `configure.py` (`ORG_SKILLS`, `MANAGED_APPS`, and the `has_tag("skills")` block) plus the global `~/.config/opencode/opencode.jsonc` plugin list.
- Generation helpers use `server.shell` + heredoc today; new helpers for symlink curation should reuse that pattern rather than introducing new primitives.
- Verification for pyinfra deploys runs through re-executing `configure.py` against the workstation and inspecting generated files; tasks below include explicit file inspection checks.
- Current rfhold state confirmed: `~/repos/rfhold/.agents/opencode.jsonc` is `{"mcp": {}}` and there is no `.claude.json`, so regeneration is idempotent.
- `skills_whitelist` uses symlinks inside `.agents/skills/`; reconciliation must handle both pre-existing directory-style skills (from the legacy full-repo layout) and prior symlinks.
- Instruction order: `spec.md` beats this `plan.md`; `docs/specs/rfhold-mcp-config/changes.md` does not yet exist, and personal `AGENTS.md` applies globally (no co-authored trailers, no emojis, terse comments, fix broken state when encountered).

## Coverage Matrix

| Requirement | Planned Task(s) | Notes |
| --- | --- | --- |
| REQ-001 | Task 2 | rfhold `mcp_servers` set to exactly `gitops`, `slack`, `grafana` |
| REQ-002 | Task 2 | Preview URLs wired in `ORG_SKILLS["rfhold"]["mcp_servers"]` |
| REQ-003 | Task 2, Task 7 | rfhold `.envrc` scoping preserved; verified in final sweep |
| REQ-004 | Task 1 | Remove `waltr-grafana` and `waltr-gitops` from `MANAGED_APPS` |
| REQ-005 | Task 3, Task 5 | Remove `superspec` from global config; emit it from rfhold org |
| REQ-006 | Task 4 | `skills_whitelist` schema + filtered iteration |
| REQ-007 | Task 4 | Clone to `skills-src`; curate symlinks in `.agents/skills/` |
| REQ-008 | Task 4 | Preserve legacy layout when `skills_whitelist` is absent |
| REQ-009 | Task 6 | Seed rfhold and cfaintl allowlists |
| REQ-010 | Task 5 | `plugins` list emitted into `opencode.jsonc` |
| NFR-001 | Task 2, Task 7 | Keep config data-driven via `ORG_SKILLS` |
| NFR-002 | Task 4, Task 5, Task 6 | Allowlist/plugin logic data-driven with FS primitives only |

## Tasks

### Task 1: Prune Walter-managed apps

- **Requirements:** `REQ-004`
- **Objective:** Stop `configure.py` from cloning or installing `waltr-grafana` and `waltr-gitops`.
- **Files:**
  - `/Users/rfhold/dot/configure.py`
- **Steps:**
  1. Remove the `waltr-grafana` and `waltr-gitops` dict entries from `MANAGED_APPS`.
  2. Leave remaining managed apps (`cuthulu`, `walter`, `axol-query`, `atlassian-query`) untouched.
  3. Confirm no code path elsewhere references those names.
- **Verification:**
  - `rg -n '"waltr-grafana"|"waltr-gitops"|waltr-grafana\.git|waltr-gitops\.git' configure.py` returns no matches.
  - Dry run of `opencode-style` inspection: `python3 -c "import ast; t=ast.parse(open('configure.py').read()); print('ok')"` succeeds.
- **Agent Shape:** single-file edit
- **Done When:** `MANAGED_APPS` no longer contains the two entries and `configure.py` still parses successfully.

### Task 2: Wire rfhold preview MCP servers

- **Requirements:** `REQ-001`, `REQ-002`, `REQ-003`, `NFR-001`
- **Objective:** Populate `ORG_SKILLS["rfhold"]["mcp_servers"]` with exactly `gitops`, `slack`, and `grafana` at the approved preview URLs.
- **Files:**
  - `/Users/rfhold/dot/configure.py`
- **Steps:**
  1. Replace `"mcp_servers": {}` under `ORG_SKILLS["rfhold"]` with a dict containing:
     - `"gitops": {"url": "https://preview-gitops-query.holdenitdown.net"}`
     - `"slack": {"url": "https://preview-slack-query.holdenitdown.net"}`
     - `"grafana": {"url": "https://preview-grafana-query.holdenitdown.net"}`
  2. Leave the existing opencode/claude generation logic alone so the data flows through unchanged.
- **Verification:**
  - `rg -n 'preview-gitops-query|preview-slack-query|preview-grafana-query' configure.py` shows three hits.
  - After running `pyinfra @local configure.py skills`, `/Users/rfhold/repos/rfhold/.agents/opencode.jsonc` contains an `mcp` object with exactly those three server keys and URLs.
- **Agent Shape:** single-file edit
- **Done When:** rfhold MCP dict holds the three entries and generated config reflects them.

### Task 3: Remove superspec from global OpenCode config

- **Requirements:** `REQ-005`
- **Objective:** Drop `superspec` from the global `plugin` array so it no longer applies outside rfhold.
- **Files:**
  - `/Users/rfhold/dot/.config/opencode/opencode.jsonc`
- **Steps:**
  1. Remove the `"superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git"` entry from the `plugin` array.
  2. Keep the remaining entries (`@franlol/...`, `@tarquinen/...`) untouched.
  3. Preserve trailing newline and formatting.
- **Verification:**
  - `rg -n 'superspec@git' ~/.config/opencode/opencode.jsonc` returns no matches.
  - `jq '.plugin' ~/.config/opencode/opencode.jsonc` (after stripping comments if any) returns the two expected plugins.
  - `opencode debug config` in `~/dot` shows no `superspec` plugin.
- **Agent Shape:** single-file edit
- **Done When:** global config no longer lists `superspec`.

### Task 4: Filtered skills directory support

- **Requirements:** `REQ-006`, `REQ-007`, `REQ-008`, `NFR-002`
- **Objective:** Teach the `has_tag("skills")` block to generate curated symlink trees driven by `skills_whitelist`, and preserve existing behavior when absent.
- **Files:**
  - `/Users/rfhold/dot/configure.py`
- **Steps:**
  1. When an org config has `skills_whitelist`, set the clone destination to `f"{agents_dir}/skills-src"` even if `skills_subdir` is not set, and compute `skills_root = f"{clone_dest}/{skills_subdir}"` when `skills_subdir` is set else `clone_dest`.
  2. Replace the unconditional `files.link` (today used for `skills_subdir` alone) with an explicit branch:
     - whitelist absent + `skills_subdir` set: keep current full-subdir symlink behavior.
     - whitelist absent + no `skills_subdir`: unchanged (clone directly into `skills`).
     - whitelist present: ensure `.agents/skills/` directory exists, then for each allowlisted name create/replace a symlink `f"{agents_dir}/skills/<name>" -> "{skills_root}/<name>"` using `files.link` (`symbolic=True`, `present=True`, `force=True`). Skip entries whose target is missing after clone and emit a warning via `print()`.
  3. Add a reconciliation step: use a `server.shell` heredoc that `find`s `.agents/skills/` for entries not in the allowlist and removes dangling/obsolete symlinks only (never real directories). Implementation detail: guard with `-type l` and compare names against a shell-quoted allowlist.
  4. Ensure that when `skills_whitelist` is set, the top-level `files.link` for the `skills_subdir` case does not also fire (avoid double-linking the whole subtree on top of curated entries).
- **Verification:**
  - After running the deploy for rfhold with the new allowlist, `ls -la /Users/rfhold/repos/rfhold/.agents/skills/` lists exactly the ten rfhold allowlisted entries, each as a symlink.
  - After running for cfaintl, `ls -la /Users/rfhold/repos/cfaintl/.agents/skills/` lists exactly the fourteen cfaintl allowlisted entries.
  - Introducing a temporary extra symlink under `.agents/skills/` and re-running the deploy causes it to be removed, while a non-symlink child (if any) is left alone.
  - Removing `skills_whitelist` from an org and re-running restores the prior full-repo / subdir symlink layout.
- **Agent Shape:** single-file edit with targeted shell reconciliation snippet
- **Done When:** both allowlisted orgs end up with curated symlink trees and orgs without a whitelist keep legacy behavior.

### Task 5: Org-level plugin emission

- **Requirements:** `REQ-005`, `REQ-010`, `NFR-002`
- **Objective:** Emit a `plugin` array into each org's `opencode.jsonc` when `ORG_SKILLS[<org>]["plugins"]` is populated, and wire rfhold to use `superspec`.
- **Files:**
  - `/Users/rfhold/dot/configure.py`
- **Steps:**
  1. Extend the generation near `opencode_config_content` so that when `config.get("plugins")` is truthy, the JSON body includes a `"plugin"` key with the list verbatim, preserving order.
  2. Keep the existing `"mcp"` key. Example resulting body: `{ "mcp": {...}, "plugin": [...] }`.
  3. When `plugins` is empty or missing, the JSON MUST NOT include a `"plugin"` key.
  4. Add `"plugins": ["superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git"]` to `ORG_SKILLS["rfhold"]` as part of Task 6 (seeded there for clarity) but validate behavior here.
- **Verification:**
  - After deploy, `/Users/rfhold/repos/rfhold/.agents/opencode.jsonc` contains both `mcp` (three servers) and `plugin` with one entry `superspec@git+ssh://...`.
  - `/Users/rfhold/repos/cfaintl/.agents/opencode.jsonc` does not contain a `plugin` key (cfaintl has no `plugins`).
  - Running `OPENCODE_CONFIG=/Users/rfhold/repos/rfhold/.agents/opencode.jsonc opencode debug config` inside `/Users/rfhold/repos/rfhold` shows `superspec` attributed to that file.
- **Agent Shape:** single-file edit
- **Done When:** generated configs correctly include or omit the `plugin` key per org.

### Task 6: Seed org data (plugins + allowlists + MCP)

- **Requirements:** `REQ-009`, `REQ-005`, `REQ-010`
- **Objective:** Populate `ORG_SKILLS` for `rfhold` and `cfaintl` with the approved allowlists and plugin list.
- **Files:**
  - `/Users/rfhold/dot/configure.py`
- **Steps:**
  1. In `ORG_SKILLS["rfhold"]`, add:
     - `"plugins": ["superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git"]`
     - `"skills_whitelist": ["axol-query", "cuthulu-query", "forgejo-tea", "gitops-query", "grafana-query", "homelab", "kubectl", "tekton-pac", "walter", "waltr-component"]`
  2. In `ORG_SKILLS["cfaintl"]`, add:
     - `"skills_whitelist": ["cfa-acronyms", "cfaintl-environment", "chikin-mcp", "logql", "promql", "pulumi-go", "traceql", "brainstorming", "code-review", "execution", "plan-review", "review-changes", "using-superspec", "writing-specs"]`
  3. Leave `cfaintl`'s `mcp_servers` and `skills_subdir` alone.
  4. Keep lists sorted in the order above (matches spec REQ-009).
- **Verification:**
  - `rg -n 'skills_whitelist' configure.py` shows exactly two hits.
  - `python3 -c "import ast; mod=ast.parse(open('configure.py').read()); print('ok')"` succeeds.
  - Resulting `~/repos/rfhold/.agents/skills/` and `~/repos/cfaintl/.agents/skills/` listings match REQ-009 exactly.
- **Agent Shape:** single-file edit
- **Done When:** both org entries carry the approved lists and generation reflects them.

### Task 7: Final integration verification

- **Requirements:** `REQ-001`..`REQ-010`, `NFR-001`, `NFR-002`
- **Objective:** Re-run configuration end to end and confirm the full spec is satisfied on disk.
- **Files:**
  - n/a (verification only)
- **Steps:**
  1. Run `pyinfra @local /Users/rfhold/dot/configure.py skills apps` (or the standard invocation used for this repo) on macOS.
  2. Inspect generated files and compare with spec acceptance criteria.
  3. Confirm that stale working trees for `waltr-grafana` and `waltr-gitops` still exist but are no longer mutated (git status should remain as it was pre-run).
- **Verification:**
  - `/Users/rfhold/repos/rfhold/.agents/opencode.jsonc` contains `mcp.gitops.url`, `mcp.slack.url`, `mcp.grafana.url`, and `plugin[0] == "superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git"`.
  - `/Users/rfhold/repos/rfhold/.agents/.claude.json` contains matching `mcpServers` entries with `type: http`.
  - `/Users/rfhold/repos/rfhold/.envrc` still exports the three `CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `OPENCODE_CONFIG` vars.
  - `/Users/rfhold/repos/rfhold/.agents/skills/` lists exactly the rfhold allowlist as symlinks.
  - `/Users/rfhold/repos/cfaintl/.agents/skills/` lists exactly the cfaintl allowlist as symlinks.
  - `/Users/rfhold/repos/cfaintl/.agents/opencode.jsonc` contains only `mcp.chikin` and no `plugin` key.
  - `opencode debug config` inside `~/dot` shows no `superspec`.
  - `opencode debug config` inside `~/repos/rfhold` shows `superspec` attributed to the org `opencode.jsonc`.
- **Agent Shape:** observational
- **Done When:** all checks above pass.

## Drift Handling

- If an unexpected rfhold repo shape blocks curation (missing skill directory for an allowlisted name), log a warning via `print(...)` and continue; never abort the deploy.
- If `cfaintl` allowlist entries reference skills only present on `rfh/superspec`, document the gap in `docs/specs/rfhold-mcp-config/changes.md` and keep the allowlist as spec'd. Do not silently prune allowlist entries.
- If Walter working trees need cleanup later (Non-Goal now), create a follow-up spec; do not delete those directories in this change.
- Any discovered need to re-add `superspec` to non-rfhold contexts (Open Question Q1) is a spec change, not a plan drift; stop and request a `review-changes` pass.

## Review Checklist

- [ ] Every REQ-### and NFR-### in `spec.md` appears in the coverage matrix.
- [ ] Each task has explicit files, steps, and verification.
- [ ] No task edits files outside `configure.py` and `~/.config/opencode/opencode.jsonc`.
- [ ] No task creates local clones for `gitops-query`, `slack-query`, or `grafana-query`.
- [ ] Curation behavior handles the empty allowlist and missing-target cases.
- [ ] Drift handling covers allowlist gaps and Walter tree cleanup boundary.
