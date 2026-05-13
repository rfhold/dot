# Tasks: use-bun-ci-for-pin-updater

**Status**: complete

## Coverage Matrix

| Requirement | Task(s) |
|---|---|
| `opencode-config` MODIFIED: `Scheduled Plugin Pin Updates` | 1.1 |

## AGENTS.md Notes

AGENTS.md files were checked during plan-review for affected directories and relevant notes are captured here for `execution` and `code-review`.

- `/home/rfhold/dot/AGENTS.md`: not present.
- `/home/rfhold/dot/.tekton/AGENTS.md`: not present.
- `/home/rfhold/dot/docs/specs/AGENTS.md`: not present.
- `/home/rfhold/dot/docs/specs/opencode-config/AGENTS.md`: not present.

---

## Stage 1: Pin Updater Workflow Image

### Task 1.1: Use shared Bun CI image for pin updater

- **Implements**: `opencode-config` MODIFIED Requirement: `Scheduled Plugin Pin Updates`
- **Depends on**: (none)
- **Files**: `.tekton/opencode-plugin-pin-update.yaml`
- **Approach**: Replace the update step image with the shared Bun CI image published by homelab so the updater has `bun`, `git`, `ssh`, and CA certificates when resolving `git+ssh` plugin tags. Keep the updater script, git credential handling, and direct-to-main behavior unchanged.
- **Dispatch**: inline
- **Dispatch rationale**: Single-line workflow image change with direct verification; no context-isolation or parallelism benefit.

### Stage Verification

- **Commands**:
  ```
  git diff --check -- .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/use-bun-ci-for-pin-updater
  rg -n 'image: cr\.holdenitdown\.net/rfhold/bun-ci:latest|bun scripts/update-opencode-plugin-pins\.ts|git clone "\$\(params\.repo-url\)"' .tekton/opencode-plugin-pin-update.yaml
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/validate-opencode-plugin-config.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  ```
- **Expected outcome**: Diff check passes; the PipelineRun uses the shared Bun CI image while retaining clone and updater steps; updater tests pass; config validation passes; dry-run reports pins are already current or lists only expected pending pin changes without modifying files.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-13
- **Commands**:
  ```
  git diff --check -- .tekton/opencode-plugin-pin-update.yaml docs/specs/changes/use-bun-ci-for-pin-updater
  rg -n 'image: cr\.holdenitdown\.net/rfhold/bun-ci:latest|bun scripts/update-opencode-plugin-pins\.ts|git clone "\$\(params\.repo-url\)"' .tekton/opencode-plugin-pin-update.yaml
  bun test scripts/update-opencode-plugin-pins.test.ts
  bun run scripts/validate-opencode-plugin-config.ts
  bun run scripts/update-opencode-plugin-pins.ts --dry-run --no-push
  ```
- **Output**:
  ```
  39:              image: cr.holdenitdown.net/rfhold/bun-ci:latest
  60:                git clone "$(params.repo-url)" .
  65:                bun scripts/update-opencode-plugin-pins.ts
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
  - `docs/specs/changes/use-bun-ci-for-pin-updater/specs/opencode-config/spec.md`
  - `docs/specs/changes/use-bun-ci-for-pin-updater/tasks.md`
- **AGENTS.md notes applied**: No affected-directory AGENTS.md files were present.
- **Subagent statuses**: None; Task 1.1 executed inline.

- [x] Stage 1 complete

---

## Follow-ups

`<!-- FOLLOW-UP(2026-05-13): After this change is committed and pushed, dispatch dot's opencode-plugin-pin-update workflow on main and confirm the run succeeds with the shared Bun CI image. -->`

---

## Review summary

Findings from `review-changes` validation (inline handoff context, not a file):

- **CRITICAL**: (none — CRITICAL findings return the change to `writing-specs` before planning)
- **WARNING**: None
- **SUGGESTION**: None

---

## Approval

- [x] User has reviewed and approved this plan (written). This is the workflow's sole approval gate.
