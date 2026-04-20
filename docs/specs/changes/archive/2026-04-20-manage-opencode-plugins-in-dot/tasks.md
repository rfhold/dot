# Tasks: manage-opencode-plugins-in-dot

**Status**: complete

## Coverage Matrix

| Requirement | Task(s) |
|---|---|
| `rfhold-mcp-config` MODIFIED: `Org-Level Plugin List` | 1.1 |
| `rfhold-mcp-config` ADDED: `OpenCode Plugin Cache Refresh Helper` | 1.2 |

## AGENTS.md Notes

AGENTS.md files were read during plan-review. Relevant notes are captured here and forwarded to `execution` and `code-review` via this file.

- `/home/rfhold/repos/rfhold/.agents/AGENTS.md`: org-level context only; no extra implementation constraints beyond rfhold environment metadata.
- `/home/rfhold/dot/AGENTS.md`: not present.
- `/home/rfhold/dot/docs/specs/AGENTS.md`: not present.
- `/home/rfhold/dot/bin/AGENTS.md`: not present.
- `/home/rfhold/dot/.config/opencode/AGENTS.md`: keep comments terse; do not add unnecessary comments; prefer fixing broken behavior rather than treating it as pre-existing.

---

## Stage 1: Update Generator And Cache Helper

Batch execute tasks that can be run in parallel sub agents.

### Task 1.1: Expand rfhold plugin generation in `configure.py`

- **Implements**: `rfhold-mcp-config` MODIFIED Requirement: `Org-Level Plugin List`
- **Depends on**: (none)
- **Files**: `configure.py`
- **Approach**: Update `ORG_SKILLS["rfhold"]["plugins"]` to the canonical 10-entry ordered list and adjust the org-level OpenCode generation flow so rfhold emits that plugin array without duplicating plugin-owned MCP servers inline in `~/repos/rfhold/.agents/opencode.jsonc`. Preserve Claude MCP generation and non-rfhold org behavior.
- **Dispatch**: subagent

### Task 1.2: Rename and generalize the OpenCode plugin refresh helper

- **Implements**: `rfhold-mcp-config` ADDED Requirement: `OpenCode Plugin Cache Refresh Helper`
- **Depends on**: (none)
- **Files**: `bin/update-superspec.sh`, `bin/update-oc-plugins.sh`
- **Approach**: Replace the superspec-specific helper with `bin/update-oc-plugins.sh`, remove repo-update behavior, and make the helper clear `~/.cache/opencode/packages/` so OpenCode re-downloads plugins on the next load. Keep user-facing output focused on cache clearing and restart guidance.
- **Dispatch**: subagent

### Stage Verification

- **Commands**:
  ```
  python3 -c "import ast, pathlib; ast.parse(pathlib.Path('configure.py').read_text()); print('configure.py ok')"
  DOTFILES_TAGS=skills uv run pyinfra -y @local configure.py
  python3 <<'PY'
  import json
  from pathlib import Path
  expected = [
      'superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git',
      'gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git',
      'slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git',
      'grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git',
      'atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git',
      'gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git',
      'axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git',
      'cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git',
      'homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git',
      'walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git',
  ]
  data = json.loads(Path.home().joinpath('repos/rfhold/.agents/opencode.jsonc').read_text())
  assert data.get('plugin') == expected, data.get('plugin')
  assert 'mcp' not in data, data.get('mcp')
  print('rfhold opencode.jsonc ok')
  PY
  test -f "bin/update-oc-plugins.sh"
  test ! -e "bin/update-superspec.sh"
  if rg -n 'git pull|git fetch|git checkout' "bin/update-oc-plugins.sh"; then exit 1; else echo 'update-oc-plugins.sh ok'; fi
  ```
- **Expected outcome**: `configure.py` parses; the `skills` run succeeds; generated `~/repos/rfhold/.agents/opencode.jsonc` contains exactly the canonical plugin list with no top-level `mcp`; the renamed helper exists; the old helper path is gone; and the helper script contains no direct git update commands.
- **Evidence artifact**: inline in this stage's Evidence block.

#### Evidence

- **Date**: 2026-04-20
- **Commands**:
  ```
  python3 -c "import ast, pathlib; ast.parse(pathlib.Path('configure.py').read_text()); print('configure.py ok')"
  DOTFILES_TAGS=skills uv run pyinfra -y @local configure.py
  python3 -c "import json; from pathlib import Path; expected=['superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git','gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git','slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git','grafana-query@git+ssh://git@git.holdenitdown.net/rfhold/grafana-query.git','atlassian-query@git+ssh://git@git.holdenitdown.net/rfhold/atlassian-query.git','gsuite-query@git+ssh://git@git.holdenitdown.net/rfhold/gsuite-query.git','axol-query@git+ssh://git@git.holdenitdown.net/rfhold/axol.git','cuthulu@git+ssh://git@git.holdenitdown.net/rfhold/cuthulu.git','homelab@git+ssh://git@git.holdenitdown.net/rfhold/homelab.git','walter@git+ssh://git@git.holdenitdown.net/rfhold/walter.git']; data=json.loads(Path.home().joinpath('repos/rfhold/.agents/opencode.jsonc').read_text()); assert data.get('plugin') == expected, data.get('plugin'); assert 'mcp' not in data, data.get('mcp'); print('rfhold opencode.jsonc ok')"
  test -f "bin/update-oc-plugins.sh"
  test ! -e "bin/update-superspec.sh"
  if rg -n 'git pull|git fetch|git checkout' "bin/update-oc-plugins.sh"; then exit 1; else echo 'update-oc-plugins.sh ok'; fi
  ```
- **Output**:
  ```
  configure.py ok
  --> Loading config...
  --> Loading inventory...
  --> Connecting to hosts...
      [@local] Connected

  --> Preparing operation files...
      Loading: configure.py

  *** npm registry auth missing for cfaintl. Run:
      setup-npm-registry 'https://cfa.jfrog.io/artifactory/api/npm/npm/' '/home/rfhold/.config/npm/cfaintl-npmrc'

      [@local] Ready: configure.py

  --> Skipping change detection
  --> Beginning operation run...
  --> Starting operation: Ensure rfhold .agents directory 
      [@local] No changes

  --> Starting operation: Migrate legacy rfhold skills clone to skills-src 
      [@local] Success

  --> Starting operation: Clone rfhold skills repo 
      [@local] No changes

  --> Starting operation: Curate rfhold .agents/skills tree 
      [@local] Success

  --> Starting operation: Write rfhold CLAUDE.md 
      [@local] Success

  --> Starting operation: Write rfhold .envrc for AI tools 
      [@local] Success

  --> Starting operation: Allow direnv for rfhold 
      [@local] Success

  --> Starting operation: Write rfhold opencode.jsonc 
      [@local] Success

  --> Starting operation: Merge MCP servers into rfhold .claude.json 
      [@local] Success

  --> Starting operation: Ensure cfaintl .agents directory 
      [@local] No changes

  --> Starting operation: Migrate legacy cfaintl skills clone to skills-src 
      [@local] Success

  --> Starting operation: Clone cfaintl skills repo 
      [@local] No changes

  --> Starting operation: Curate cfaintl .agents/skills tree 
      [@local] Success

  --> Starting operation: Write cfaintl CLAUDE.md 
      [@local] Success

  --> Starting operation: Write cfaintl .envrc for AI tools 
      [@local] Success

  --> Starting operation: Allow direnv for cfaintl 
      [@local] Success

  --> Starting operation: Write cfaintl opencode.jsonc 
      [@local] Success

  --> Starting operation: Merge MCP servers into cfaintl .claude.json 
      [@local] Success

  --> Results:
      Operation                                           Hosts   Success   Error   No Change   
      Ensure rfhold .agents directory                     1       -         -       1           
      Migrate legacy rfhold skills clone to skills-src    1       1         -       -           
      Clone rfhold skills repo                            1       -         -       1           
      Curate rfhold .agents/skills tree                   1       1         -       -           
      Write rfhold CLAUDE.md                              1       1         -       -           
      Write rfhold .envrc for AI tools                    1       1         -       -           
      Allow direnv for rfhold                             1       1         -       -           
      Write rfhold opencode.jsonc                         1       1         -       -           
      Merge MCP servers into rfhold .claude.json          1       1         -       -           
      Ensure cfaintl .agents directory                    1       -         -       1           
      Migrate legacy cfaintl skills clone to skills-src   1       1         -       -           
      Clone cfaintl skills repo                           1       -         -       1           
      Curate cfaintl .agents/skills tree                  1       1         -       -           
      Write cfaintl CLAUDE.md                             1       1         -       -           
      Write cfaintl .envrc for AI tools                   1       1         -       -           
      Allow direnv for cfaintl                            1       1         -       -           
      Write cfaintl opencode.jsonc                        1       1         -       -           
      Merge MCP servers into cfaintl .claude.json         1       1         -       -           
      Grand total                                         18      14        -       4           

  --> Disconnecting from hosts...
  rfhold opencode.jsonc ok
  update-oc-plugins.sh ok
  ```
- **Files changed (across the stage)**:
  - `configure.py`
  - `bin/update-oc-plugins.sh`
  - `bin/update-superspec.sh`
  - `/home/rfhold/repos/rfhold/.agents/opencode.jsonc`
- **AGENTS.md notes applied**: `/home/rfhold/dot/.config/opencode/AGENTS.md` — keep comments terse; do not add unnecessary comments; prefer fixing broken behavior rather than treating it as pre-existing.
- **Subagent statuses**:
  - Task 1.1: DONE
  - Task 1.2: DONE
- **Concerns**: None

- [x] Stage 1 complete

---

## Follow-ups

None.

---

## Review summary

Findings from `review-changes` validation (inline handoff context, not a file):

- **CRITICAL**: none
- **WARNING**: None
- **SUGGESTION**: None

---

## Approval

- [x] User has reviewed and approved this plan (written). This is the workflow's sole approval gate.
