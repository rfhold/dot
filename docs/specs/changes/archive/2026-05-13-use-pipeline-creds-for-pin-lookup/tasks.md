# Tasks: use-pipeline-creds-for-pin-lookup

**Status**: complete

## Coverage Matrix

| Requirement | Task(s) |
|---|---|
| `opencode-config` MODIFIED: `Scheduled Plugin Pin Updates` | 1.1 |

## AGENTS.md Notes

AGENTS.md files were checked during plan-review for the repo root, `.tekton/`, `docs/specs/`, and `docs/specs/opencode-config/`. No applicable AGENTS.md files were present in those affected directories. Unrelated nested AGENTS.md files under dot-managed home/config trees do not govern this workflow/spec change.

---

## Stage 1: Pipeline Credential Lookup

### Task 1.1: Route rfhold tag lookups through pipeline credentials

- **Implements**: `opencode-config` MODIFIED Requirement: `Scheduled Plugin Pin Updates`
- **Depends on**: (none)
- **Files**: `.tekton/opencode-plugin-pin-update.yaml`
- **Approach**: After the workflow copies PAC-provided `.gitconfig` and `.git-credentials` into its runtime home, configure Git to rewrite `git+ssh://git@git.holdenitdown.net/` URLs to `https://git.holdenitdown.net/` for the updater process. Keep committed plugin specifiers unchanged, keep the updater script unchanged, and preserve the existing direct-to-main behavior.
- **Dispatch**: inline
- **Dispatch rationale**: Small workflow-only change with no parallel work and already-diagnosed failure mode.

### Stage Verification

- **Commands**:
  ```
  git diff --check -- .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/use-pipeline-creds-for-pin-lookup
  rg -n 'url\.https://git\.holdenitdown\.net/\.insteadOf|git\+ssh://git@git\.holdenitdown\.net/|bun scripts/update-opencode-plugin-pins\.ts|image: cr\.holdenitdown\.net/rfhold/bun-ci:latest' .tekton/opencode-plugin-pin-update.yaml
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/validate-opencode-plugin-config.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  ```
- **Expected outcome**: Diff check passes; workflow contains the Bun CI image, URL rewrite, and updater invocation; updater tests pass; config validation passes; dry-run either reports pins current or only expected pending pin updates without modifying files.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-13
- **Commands**:
  ```
  git diff --check -- .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/use-pipeline-creds-for-pin-lookup
  rg -n 'url\.https://git\.holdenitdown\.net/\.insteadOf|git\+ssh://git@git\.holdenitdown\.net/|bun scripts/update-opencode-plugin-pins\.ts|image: cr\.holdenitdown\.net/rfhold/bun-ci:latest' .tekton/opencode-plugin-pin-update.yaml
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/validate-opencode-plugin-config.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  ```
- **Output**:
  ```
  39:              image: cr.holdenitdown.net/rfhold/bun-ci:latest
  59:                git config --global url.https://git.holdenitdown.net/.insteadOf git+ssh://git@git.holdenitdown.net/
  70:                bun scripts/update-opencode-plugin-pins.ts
  bun test v1.3.11 (af24e281)

   6 pass
   0 fail
   15 expect() calls
  Ran 6 tests across 1 file. [80.00ms]
  OpenCode plugin config validation passed.
  home/repos/rfhold/.agents/opencode.jsonc: cuthulu opencode/v0.3.2 -> opencode/v0.3.4
  Dry run: no files changed.
  ```
- **Files changed (across the stage)**:
  - `.tekton/opencode-plugin-pin-update.yaml`
  - `docs/specs/changes/use-pipeline-creds-for-pin-lookup/specs/opencode-config/spec.md`
  - `docs/specs/changes/use-pipeline-creds-for-pin-lookup/tasks.md`
- **AGENTS.md notes applied**: No applicable AGENTS.md files were present in affected directories.
- **Subagent statuses**: None; Task 1.1 executed inline.

- [x] Stage 1 complete

---

## Review summary

Findings from `review-changes` validation:

- **CRITICAL**: None
- **WARNING**: None
- **SUGGESTION**: None

---

## Approval

- [x] User has reviewed and approved this plan (written). This is the workflow's sole approval gate.
