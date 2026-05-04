# Tasks: pin-generated-opencode-plugins

**Status**: approved

## Coverage Matrix

| Requirement | Tasks |
|---|---|
| `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only superspec Plugin | 1.1 |
| `rfhold-mcp-config` MODIFIED Requirement: Org-Level Plugin List | 1.1, 2.1 |
| `opencode-config` MODIFIED Requirement: Plugin Installation Via git+ssh | 1.1, 2.1 |

## AGENTS.md Notes

- No `AGENTS.md` files exist at the dot repo root, `docs/specs/`, or the affected spec domain directories.
- `/home/rfhold/dot/.config/opencode/AGENTS.md`: do not add `Co-authored-by` trailers; do not use emojis unless requested; keep comments terse; treat broken config as something to fix.

## Stage 1: Generator Pinning

### Task 1.1: Pin rfhold generated OpenCode plugins

- **Implements**: `rfhold-mcp-config` MODIFIED Requirement: rfhold-Only superspec Plugin; `rfhold-mcp-config` MODIFIED Requirement: Org-Level Plugin List; `opencode-config` MODIFIED Requirement: Plugin Installation Via git+ssh
- **Depends on**: none
- **Files**: `configure.py`
- **Approach**: Add `#opencode/v0.1.0` to every rfhold-hosted plugin specifier in `ORG_SKILLS["rfhold"]["plugins"]`, preserve the exact existing plugin order, keep `plugin_mcp_servers` unchanged so plugin-owned MCP servers are not duplicated inline, and avoid editing archived historical specs.
- **Dispatch**: inline

### Stage Verification

- **Commands**:
  ```bash
  git diff --check -- configure.py docs/specs/changes/pin-generated-opencode-plugins
  python -m py_compile configure.py
  ! rg -n 'git\+ssh://git@git\.holdenitdown\.net/rfhold/[^"#]+\.git"' configure.py
  rg -n 'superspec@git\+ssh://git@git\.holdenitdown\.net/rfhold/superspec\.git#opencode/v0\.1\.0' configure.py
  rg -n 'gitops-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/gitops-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'slack-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/slack-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'grafana-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/grafana-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'atlassian-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/atlassian-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'gsuite-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/gsuite-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'axol-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/axol\.git#opencode/v0\.1\.0' configure.py
  rg -n 'cuthulu@git\+ssh://git@git\.holdenitdown\.net/rfhold/cuthulu\.git#opencode/v0\.1\.0' configure.py
  rg -n 'homelab@git\+ssh://git@git\.holdenitdown\.net/rfhold/homelab\.git#opencode/v0\.1\.0' configure.py
  rg -n 'walter@git\+ssh://git@git\.holdenitdown\.net/rfhold/walter\.git#opencode/v0\.1\.0' configure.py
  ```
- **Expected outcome**: whitespace and Python syntax checks pass; no bare rfhold `git+ssh` plugin specifiers remain in `configure.py`; every canonical generated rfhold plugin entry is present with `#opencode/v0.1.0`.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-04
- **Commands**:
  ```bash
  git diff --check -- configure.py docs/specs/changes/pin-generated-opencode-plugins
  python -m py_compile configure.py
  ! rg -n 'git\+ssh://git@git\.holdenitdown\.net/rfhold/[^"#]+\.git"' configure.py
  rg -n 'superspec@git\+ssh://git@git\.holdenitdown\.net/rfhold/superspec\.git#opencode/v0\.1\.0' configure.py
  rg -n 'gitops-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/gitops-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'slack-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/slack-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'grafana-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/grafana-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'atlassian-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/atlassian-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'gsuite-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/gsuite-query\.git#opencode/v0\.1\.0' configure.py
  rg -n 'axol-query@git\+ssh://git@git\.holdenitdown\.net/rfhold/axol\.git#opencode/v0\.1\.0' configure.py
  rg -n 'cuthulu@git\+ssh://git@git\.holdenitdown\.net/rfhold/cuthulu\.git#opencode/v0\.1\.0' configure.py
  rg -n 'homelab@git\+ssh://git@git\.holdenitdown\.net/rfhold/homelab\.git#opencode/v0\.1\.0' configure.py
  rg -n 'walter@git\+ssh://git@git\.holdenitdown\.net/rfhold/walter\.git#opencode/v0\.1\.0' configure.py
  ```
- **Output**:
  ```text
  1027:            "superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v0.1.0",
  1028:            "gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git#opencode/v0.1.0",
  1029:            "slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git#opencode/v0.1.0",
  1030:            "grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git#opencode/v0.1.0",
  1031:            "atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git#opencode/v0.1.0",
  1032:            "gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git#opencode/v0.1.0",
  1033:            "axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git#opencode/v0.1.0",
  1034:            "cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git#opencode/v0.1.0",
  1035:            "homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git#opencode/v0.1.0",
  1036:            "walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git#opencode/v0.1.0",
  ```
- **Files changed (across the stage)**:
  - `configure.py`
  - `docs/specs/changes/pin-generated-opencode-plugins/tasks.md`
- **AGENTS.md notes applied**: `/home/rfhold/dot/.config/opencode/AGENTS.md` notes to avoid `Co-authored-by` trailers, avoid emojis, keep comments terse, and treat broken config as something to fix.
- **Subagent statuses**: none; Task 1.1 executed inline.

- [x] Stage 1 complete

---

## Stage 2: Plugin Release Tags

Wait for the results from prior tasks before starting dependent sub agent tasks.

### Task 2.1: Publish missing generated plugin tags

- **Implements**: `rfhold-mcp-config` MODIFIED Requirement: Org-Level Plugin List; `opencode-config` MODIFIED Requirement: Plugin Installation Via git+ssh
- **Depends on**: 1.1
- **Files**: remote `refs/tags/opencode/v0.1.0` in `gitops-query`, `slack-query`, `atlassian-query`, `gsuite-query`, `axol`, `cuthulu`, `homelab`, and `walter`
- **Approach**: Confirm each target repo lacks the remote tag before creation, create annotated `opencode/v0.1.0` tags at each current local repository HEAD using message `OpenCode plugin v0.1.0`, and push only those tag refs. Do not overwrite any existing tag.
- **Dispatch**: inline

### Stage Verification

- **Commands**:
  ```bash
  git ls-remote --tags git@git.holdenitdown.net:rfhold/superspec.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/gitops-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/slack-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/grafana-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/atlassian-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/gsuite-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/axol.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/cuthulu.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/homelab.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/walter.git refs/tags/opencode/v0.1.0
  ```
- **Expected outcome**: each command prints one `refs/tags/opencode/v0.1.0` ref and exits successfully.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-05-04
- **Commands**:
  ```bash
  git status --short --branch
  git rev-parse HEAD
  git tag --list opencode/v0.1.0
  git ls-remote --tags origin refs/tags/opencode/v0.1.0
  git tag -m "OpenCode plugin v0.1.0" "opencode/v0.1.0" && git push origin refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/superspec.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/gitops-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/slack-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/grafana-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/atlassian-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/gsuite-query.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/axol.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/cuthulu.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/homelab.git refs/tags/opencode/v0.1.0
  git ls-remote --tags git@git.holdenitdown.net:rfhold/walter.git refs/tags/opencode/v0.1.0
  ```
- **Output**:
  ```text
  Precheck: /home/rfhold/repos/rfhold/gitops-query
  ## main...origin/main
  0801ed8a4fadaf6d7162c6a7c71813ef80daacce

  Precheck: /home/rfhold/repos/rfhold/slack-query
  ## main...origin/main
  ?? slack-query-server
  d070f7b41cb335482f1b03de467af2183d01cd1e

  Precheck: /home/rfhold/repos/rfhold/atlassian-query
  ## main...origin/main
  04cb6880f4846d6bc5c509fd695171eb1961d69e

  Precheck: /home/rfhold/repos/rfhold/gsuite-query
  ## main...origin/main
  97f30d975be2da10de6d794d83b5f298fd5e4959

  Precheck: /home/rfhold/repos/rfhold/axol
  ## main...origin/main
  b9c250605940439e8c489975953fc395ad274eb0

  Precheck: /home/rfhold/repos/rfhold/cuthulu
  ## main...origin/main
   M plugin/src/index.test.ts
   M plugin/src/index.ts
  ?? docs/specs/changes/use-opencode-plugin-logger/
  f93635b95d173fed49aa0da652f5014c348c4006

  Precheck: /home/rfhold/repos/rfhold/homelab
  ## main...origin/main
   M README.md
   M docs/specs/observability/spec.md
   M package.json
   M programs/authentik/index.ts
   M programs/container-registry/Pulumi.pantheon.yaml
   M programs/grafana/Pulumi.yaml
   M programs/grafana/index.ts
   M src/adapters/stack-reference.ts
   M src/components/alloy.ts
   M src/components/authentik-oidc-app.ts
   M src/components/zot-registry.ts
   M src/helm-charts.ts
   M src/modules/grafana-stack.ts
  ?? docs/operations/
  ?? docs/research/pyroscope.md
  ?? docs/specs/changes/
  ?? docs/specs/secrets-management/
  ?? programs/vault/
  ?? src/components/pyroscope.ts
  ?? src/components/vault.ts
  ?? src/modules/vault.ts
  035a84653503ee7d97b1c28bdbaba25105f57295

  Precheck: /home/rfhold/repos/rfhold/walter
  ## main...origin/main
  f7fedd97c7c7660d11e544ab9f6789b175591b36

  Tag push: /home/rfhold/repos/rfhold/gitops-query
  To git.holdenitdown.net:rfhold/gitops-query.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Tag push: /home/rfhold/repos/rfhold/slack-query
  To git.holdenitdown.net:rfhold/slack-query.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Tag push: /home/rfhold/repos/rfhold/atlassian-query
  To git.holdenitdown.net:rfhold/atlassian-query.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Tag push: /home/rfhold/repos/rfhold/gsuite-query
  To git.holdenitdown.net:rfhold/gsuite-query.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Tag push: /home/rfhold/repos/rfhold/axol
  To git.holdenitdown.net:rfhold/axol.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Tag push: /home/rfhold/repos/rfhold/cuthulu
  To ssh://git.holdenitdown.net/rfhold/cuthulu.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Tag push: /home/rfhold/repos/rfhold/homelab
  To git.holdenitdown.net:rfhold/homelab.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Tag push: /home/rfhold/repos/rfhold/walter
  To git.holdenitdown.net:rfhold/walter.git
   * [new tag]         opencode/v0.1.0 -> opencode/v0.1.0

  Stage verification:
  7f8158e47aece337c1f34ed659ef439e4b141ff9	refs/tags/opencode/v0.1.0
  97524062cbfe54947c485a13bd96cd80f61bb719	refs/tags/opencode/v0.1.0
  1cfe71b4123e62d65aa08400a23e5dd4d5999995	refs/tags/opencode/v0.1.0
  cfe3518275bd3d7b715a4b99a30e4d8d19cdcb13	refs/tags/opencode/v0.1.0
  104c3b127737448aa12c117b863f6cf5f68dc186	refs/tags/opencode/v0.1.0
  9ffddb0feda043783c1b525c4536f32c82f83d9d	refs/tags/opencode/v0.1.0
  a503787bbea085f3408e59a905b75903b9d667e5	refs/tags/opencode/v0.1.0
  9c0df3f10f24759f6fff82127590d51f34b350fd	refs/tags/opencode/v0.1.0
  cfadf83572616fd7666b2b5ac4dc7967d9a6767c	refs/tags/opencode/v0.1.0
  c9189a00aea7317997f4fc9e21f63003fb453cae	refs/tags/opencode/v0.1.0
  ```
- **Files changed (across the stage)**:
  - `docs/specs/changes/pin-generated-opencode-plugins/tasks.md`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/gitops-query.git`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/slack-query.git`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/atlassian-query.git`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/gsuite-query.git`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/axol.git`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/cuthulu.git`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/homelab.git`
  - `refs/tags/opencode/v0.1.0` in `git@git.holdenitdown.net:rfhold/walter.git`
- **AGENTS.md notes applied**: `/home/rfhold/dot/.config/opencode/AGENTS.md` notes to avoid `Co-authored-by` trailers, avoid emojis, keep comments terse, and treat broken config as something to fix.
- **Subagent statuses**: none; Task 2.1 executed inline.
- **Execution note**: `slack-query`, `cuthulu`, and `homelab` had unrelated dirty worktrees during precheck. Tags were created at each repository's committed `HEAD` and no worktree files were modified.

- [x] Stage 2 complete

## Follow-ups

- None.

## Review Summary

- CRITICAL: none.
- WARNING: none.
- SUGGESTION: none.

## Approval

- [x] User has reviewed and approved this plan (written). This is the workflow's sole approval gate.
