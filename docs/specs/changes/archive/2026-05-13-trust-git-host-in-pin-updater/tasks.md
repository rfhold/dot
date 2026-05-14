# Tasks: trust-git-host-in-pin-updater

**Status**: complete

## Coverage Matrix

| Requirement | Task(s) |
|---|---|
| `opencode-config` MODIFIED: `Scheduled Plugin Pin Updates` | 1.1 |

## AGENTS.md Notes

No applicable AGENTS.md files were present in the affected repo root, `.tekton/`, `docs/specs/`, or `docs/specs/opencode-config/` paths during the preceding dot workflow change. Unrelated nested AGENTS.md files under dot-managed home directories do not apply to this workflow/spec change.

---

## Stage 1: Pin Updater SSH Host Trust

### Task 1.1: Configure Forgejo SSH host trust

- **Implements**: `opencode-config` MODIFIED Requirement: `Scheduled Plugin Pin Updates`
- **Depends on**: (none)
- **Files**: `.tekton/opencode-plugin-pin-update.yaml`
- **Approach**: Configure `~/.ssh/known_hosts` with `git.holdenitdown.net` before the updater script resolves `git+ssh` plugin tags. Keep the updater script, git credentials, shared Bun CI image, and direct-to-main commit behavior unchanged.
- **Dispatch**: inline
- **Dispatch rationale**: Mechanical one-workflow fix following the immediately observed CI failure.

### Stage Verification

- **Commands**:
  ```
  git diff --check -- .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/trust-git-host-in-pin-updater
  rg -n 'ssh-keyscan git\.holdenitdown\.net|known_hosts|bun scripts/update-opencode-plugin-pins\.ts|image: cr\.holdenitdown\.net/rfhold/bun-ci:latest' .tekton/opencode-plugin-pin-update.yaml
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/validate-opencode-plugin-config.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  ```
- **Expected outcome**: Diff check passes; workflow configures host trust before running the updater; updater tests and config validation pass; dry-run does not modify files.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-13
- **Commands**:
  ```
  git diff --check -- .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/trust-git-host-in-pin-updater
  rg -n 'ssh-keyscan git\.holdenitdown\.net|known_hosts|bun scripts/update-opencode-plugin-pins\.ts|image: cr\.holdenitdown\.net/rfhold/bun-ci:latest' .tekton/opencode-plugin-pin-update.yaml
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/validate-opencode-plugin-config.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  ```
- **Output**:
  ```
  39:              image: cr.holdenitdown.net/rfhold/bun-ci:latest
  60:                ssh-keyscan git.holdenitdown.net >> "$HOME/.ssh/known_hosts"
  62:                chmod 600 "$HOME/.ssh/known_hosts"
  69:                bun scripts/update-opencode-plugin-pins.ts
  bun test v1.3.11 (af24e281)

   6 pass
   0 fail
   15 expect() calls
  Ran 6 tests across 1 file. [112.00ms]
  OpenCode plugin config validation passed.
  home/repos/rfhold/.agents/opencode.jsonc: cuthulu opencode/v0.3.2 -> opencode/v0.3.4
  Dry run: no files changed.
  ```
- **Files changed (across the stage)**:
  - `.tekton/opencode-plugin-pin-update.yaml`
  - `docs/specs/changes/trust-git-host-in-pin-updater/specs/opencode-config/spec.md`
  - `docs/specs/changes/trust-git-host-in-pin-updater/tasks.md`
- **AGENTS.md notes applied**: No applicable notes.
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

- [x] User has reviewed and approved this plan (written). Approval supplied by instruction: "just make the change".
