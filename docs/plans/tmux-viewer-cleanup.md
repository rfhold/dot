# Tmux Viewer Cleanup & Agent Service

## Overview

The tmux viewer system (Go backend + Android app) was proved out and rushed to completion across several commits. This plan covers four areas of cleanup:

1. **Android UI simplification** - strip the cluttered compose screens down to a minimal SSH shortcut launcher
2. **Code quality & tooling cleanup** - remove bloated docs, plan files, and unused scripts
3. **Laptop auto-discovery** - add a systemd user service that runs the tmux-agent via `go run` from the local checkout
4. **Minimal deployment** - add a kustomization.yaml to the existing k8s manifests

### Current State

- Go backend (`cmd/tmux-server`, `cmd/tmux-agent`, `internal/`) is clean - minimal deps (`go-oidc`, `oauth2`), good test coverage, proper error handling
- Android app UI is over-engineered for what is essentially an SSH shortcut launcher
- Large spec/plan docs exist that duplicate what the code already says
- A 1505-line `bin/android-sdk` script and its 711-line plan doc are dead weight
- No systemd service exists for the tmux-agent on the laptop
- K8s manifests are raw YAML with no kustomization.yaml
- Auth is deferred (SKIP_AUTH=true) - not addressed in this plan

---

## Completed

These deletions were already executed during the planning session:

| File | Lines | Reason |
|------|-------|--------|
| `docs/tmux-viewer.md` | 689 | Spec doc; code exists now and speaks for itself |
| `docs/plans/android-sdk-management.md` | 711 | Plan doc for a script that's being deleted |
| `bin/android-sdk` | 1505 | Bloated SDK management TUI; not needed |

**Total removed: ~2,905 lines**

---

## Phase 1: Android UI Simplification

The guiding principle: this app is an SSH shortcut launcher. Session name, status, tap to connect. That's it.

### 1.1 SessionCard.kt (268 -> ~80 lines)

**File:** `android/app/src/main/java/dev/rholden/dot/ui/components/SessionCard.kt`

**Remove entirely:**
- `WindowRow` composable (lines 152-223) - window drill-down row with active indicator, index badge, name, pane count
- `PaneRow` composable (lines 225-268) - pane drill-down row with active indicator, index, current command
- `AnimatedVisibility` block (lines 129-149) - expand/collapse animation for window/pane details
- Expand/collapse state: `var expanded by rememberSaveable { mutableStateOf(false) }` and `hasDetails` logic
- `onWindowClick` and `onPaneClick` callback parameters

**Remove unused imports:**
- `AnimatedVisibility`, `expandVertically`, `shrinkVertically`
- `HorizontalDivider`
- `rememberSaveable`, `mutableStateOf` (if no longer needed)
- `Icons.Default.KeyboardArrowDown`, `Icons.Default.KeyboardArrowUp`
- `TmuxPane`, `TmuxWindow`, `Purple300`
- `FontFamily`, `RoundedCornerShape`

**Replace with:**
- `Card(onClick = onClick, ...)` instead of manual `clickable` with expand toggle
- Single `Row`: status dot | session name + relative time | window count badge
- No chevron, no expand, no drill-down

**Resulting signature:**
```kotlin
@Composable
fun SessionCard(
    session: TmuxSession,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
)
```

### 1.2 SessionListScreen.kt (405 -> ~150 lines)

**File:** `android/app/src/main/java/dev/rholden/dot/ui/screens/SessionListScreen.kt`

**Remove entirely:**
- `extractProcesses()` function (lines 65-73) - extracts unique process names from all panes
- `filterByProcess()` function (lines 79-105) - filters machine hierarchy by process name
- `ProcessFilterChips` composable (lines 373-404) - horizontal scrolling filter chip row
- `selectedProcess` state variable (line 119)
- Process-derived state and filtering logic (lines 216-227)
- "No sessions running X" empty state for filtered results (lines 312-325)
- Process filter chips rendering block (lines 299-308)

**Simplify SessionCard call site** (lines 334-358):

Remove `onWindowClick` and `onPaneClick` callbacks. Change to:
```kotlin
SessionCard(
    session = session,
    onClick = { onSessionTap(machine, session.name) },
)
```

**Remove `onSessionTap` optional params:**

Simplify to just `machine` and `sessionName` - remove `windowIndex` and `paneIndex` parameters (lines 155-173), since we no longer drill into windows/panes.

**Remove unused imports:**
- `horizontalScroll`, `rememberScrollState` (used by filter chips)
- `FilterChip`, `FilterChipDefaults`
- `derivedStateOf`
- `saveable.rememberSaveable` (if no longer needed after removing selectedProcess)

### 1.3 SettingsScreen.kt (368 -> ~200 lines)

**File:** `android/app/src/main/java/dev/rholden/dot/ui/screens/SettingsScreen.kt`

**Problem:** Each text field has its own `MutableStateFlow` + `LaunchedEffect` with `.drop(1).debounce(300).collect { ... }` for debounced persistence. That's 5 flows and 5 launched effects (lines 111-132). There's also a dual-initialization hack with an `initialized` flag and a 100ms delay fallback (lines 83-108).

**Remove:**
- 5 `MutableStateFlow` instances (lines 111-115): `serverUrlFlow`, `authentikDomainFlow`, `authentikSlugFlow`, `oidcClientIdFlow`, `defaultSshUserFlow`
- 5 `LaunchedEffect(Unit) { ...Flow.drop(1).debounce(300).collect { ... } }` blocks (lines 118-132)
- The `initialized` flag and dual-initialization pattern (lines 83-108)
- Import for `FlowPreview`, `MutableStateFlow`, `debounce`, `drop`

**Replace with:**
- Seed local state directly from persisted values using `LaunchedEffect(persistedX) { localX = persistedX }` with a simple guard
- Save directly in `onValueChange` via `scope.launch { settingsStore.updateX(it) }` (DataStore already coalesces rapid writes)
- This is simpler and the 300ms debounce saved nothing meaningful for a settings screen

### 1.4 Unused Color Constants

After removing `WindowRow` and `PaneRow`, check if `Purple300` in `ui/theme/Color.kt` is still referenced anywhere. If not, it can stay (it's a one-liner in a color file, not worth the churn).

---

## Phase 2: Go Server Fix

### 2.1 Duplicate log statement in tmux-server/main.go

**File:** `cmd/tmux-server/main.go`

Lines 64-69 log `"starting tmux-server"` with `listen_addr`, `issuer`, `client_ids`, `session_ttl` inside the `else` (auth-enabled) branch. Lines 79-83 log `"starting tmux-server"` with `listen_addr`, `session_ttl`, `skip_auth` unconditionally.

**Fix:** Remove lines 64-69 (the one inside the else branch). The unconditional log at lines 79-83 already covers startup info. If we want issuer/client_ids logged when auth is enabled, add those fields conditionally to the single log call.

---

## Phase 3: Systemd User Service for tmux-agent

### 3.1 Create the service file

**New file:** `.config/systemd/user/tmux-agent.service`

```ini
[Unit]
Description=Tmux session agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=%h/.local/go/bin/go run %h/dot/cmd/tmux-agent
Environment=HOME=%h
Environment=GOPATH=%h/.local/go
Environment=PATH=%h/.local/go/bin:%h/go/bin:/usr/local/go/bin:/usr/local/bin:/usr/bin:/bin
Environment=SERVER_URL=https://tmux.holdenitdown.net
Environment=SSH_HOST=thinkpad.holdenitdown.net
Environment=SSH_USER=rfhold
Environment=SKIP_AUTH=true
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

**Key decisions:**
- Uses `%h` (home directory specifier) for portability
- Uses `go run` from local checkout (`%h/dot/cmd/tmux-agent`) - no network fetch needed, uses whatever's checked out
- `PATH` must be explicit since systemd user services don't source shell profiles
- `SKIP_AUTH=true` for now since auth setup is deferred
- `Restart=always` with 5s backoff ensures the agent comes back after crashes or tmux not being available

**Open question:** The exact path to the `go` binary depends on how Go was installed. On this Arch system, check `which go` to confirm. The bootstrap script installs Go to a custom location. May need to verify and adjust the `ExecStart` path.

### 3.2 Symlink auto-deployment

The existing dotfiles mechanism already handles this. `configure.py` runs `link_config_dir` which symlinks `.config/systemd/user/` into `~/.config/systemd/user/`. The service file will be deployed automatically on the next `update.sh` run.

### 3.3 Update configure.py to enable the service

Add a block in `configure.py` to enable and start the service when on Arch with systemd:

```python
# Enable tmux-agent user service (pushes tmux sessions to server)
if pkg_manager == "pacman" and has_systemd() and not is_container():
    server.shell(
        name="Enable tmux-agent user service",
        commands=["systemctl --user daemon-reload && systemctl --user enable --now tmux-agent.service"],
    )
```

**Placement:** After the existing systemd service blocks (around line 460+), within the Arch-specific section or in a new section after the main package installation.

**Decision rationale:** Using `server.shell` with `systemctl --user` rather than `systemd.service` because pyinfra's `systemd.service` operation doesn't natively support `--user` mode. The shell command handles daemon-reload + enable + start atomically.

---

## Phase 4: Kustomize Setup

### 4.1 Add kustomization.yaml

**New file:** `k8s/tmux-server/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - namespace.yaml
  - deployment.yaml
  - service.yaml
  - httproute.yaml
```

**Decision:** Simple single-layer kustomization, no base/overlays split. The deployment is single-environment (one cluster, one namespace). Deploy with `kubectl apply -k k8s/tmux-server/`.

**No changes to existing manifests.** They're already clean and minimal:
- `namespace.yaml` - 5 lines
- `deployment.yaml` - 58 lines, proper health probes and resource limits
- `service.yaml` - 13 lines
- `httproute.yaml` - 22 lines, Gateway API with `default-gateway` in `ingress` namespace

---

## Verification Steps

1. **Go tests:** `go test ./...` - no Go code changed functionally, but run to confirm nothing broke from deletions
2. **Android build:** `cd android && ./gradlew assembleDebug` - verify the simplified UI compiles. The SessionCard signature change will require updating the call site in SessionListScreen, so these must be done together.
3. **Systemd service:** After deploying, verify with `systemctl --user status tmux-agent` and check `journalctl --user -u tmux-agent -f`
4. **Kustomize:** Verify with `kubectl kustomize k8s/tmux-server/` (dry run) before applying

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI approach | Flat tappable cards, no drill-down | App is an SSH shortcut launcher, not a tmux management tool |
| Process filter chips | Remove | Over-engineered; you pick a session and connect, no need to filter by process |
| Settings persistence | Direct save on change | DataStore coalesces writes; 300ms debounce with 5 separate flows is unnecessary complexity |
| tmux-agent binary | `go run` from local checkout | No network dependency, uses whatever code is checked out, rebuilds automatically on changes |
| Service type | Systemd user service | Runs as your user (needs tmux access), managed with `systemctl --user`, auto-starts via lingering |
| Kustomize | Simple single-layer | One environment, no overlays needed |
| Auth | Deferred (SKIP_AUTH=true) | Separate concern, Authentik configuration is a standalone task |
| docs/tmux-viewer.md | Deleted | Code exists and is self-documenting; 689-line spec was redundant |
| bin/android-sdk + plan | Deleted | 1505-line script and 711-line plan were dead weight |

## Open Questions

1. **Go binary path in systemd:** The exact path to `go` in the service file needs verification. Run `which go` on the laptop and adjust `ExecStart` accordingly. The bootstrap script (`bin/bootstrap.sh`) installs Go 1.25.5 but the install location varies.
2. **GOPATH/GOMODCACHE in systemd:** `go run` needs module cache access. The service may need `GOMODCACHE` set if it's not under the default `$HOME/go/pkg/mod`.
3. **First-run latency:** `go run` compiles on first invocation. After a reboot, the first push will be delayed by compile time (~5-10s). This is acceptable since the agent pushes every 10s anyway.
4. **Auth enablement:** When Authentik is configured later, the service file will need `SKIP_AUTH` removed and OIDC env vars added. The deployment manifest will also need the commented-out secret references uncommented.
