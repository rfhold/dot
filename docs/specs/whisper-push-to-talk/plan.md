---
feature: whisper-push-to-talk
spec: docs/specs/whisper-push-to-talk/spec.md
status: draft
created: 2026-04-20
updated: 2026-04-20
---

# Whisper Push-To-Talk Shortcut Plan

## Goal

Implement the approved whisper-push-to-talk spec by adding macOS Hammerspoon hold shortcuts on `right cmd+/` and `right cmd+opt+/`, wiring a shared hold-to-record shell flow that reuses the existing Whisper transcription behavior, and managing the required local config through this dotfiles repo.

## Planning Notes

- There is no existing Hammerspoon config checked into this repo, so this feature needs both config management and runtime behavior.
- `configure.py` already links `home/` into the local home directory and installs GUI apps via Homebrew casks, so Hammerspoon should be managed there rather than by a one-off manual step.
- `bin/capture.sh` already handles Whisper submission and transcript normalization for duration-based capture; the new work should extract or reuse that logic instead of duplicating parsing.
- The press/release lifecycle remains the main behavior: Hammerspoon should orchestrate start on key down and stop/transcribe on key up while the shell layer owns recorder process lifecycle.
- The newly approved split output behavior means delivery should be mode-aware: the copy shortcut may use the clipboard, while the direct-type shortcut must preserve existing clipboard contents and type through Hammerspoon/macOS input APIs.
- Verification will be a mix of static checks, script smoke tests, and local config inspection because true end-to-end hotkey behavior depends on macOS permissions and an interactive desktop session.
- Instruction order: approved `docs/specs/whisper-push-to-talk/spec.md` is the source of truth; no `changes.md` exists for this feature; the global `AGENTS.md` still applies (minimal edits, terse comments, fix broken state when encountered).

## Coverage Matrix

| Requirement | Planned Task(s) | Notes |
| --- | --- | --- |
| REQ-001 | Task 1, Task 3 | Install/manage Hammerspoon and bind both approved hotkeys |
| REQ-002 | Task 2, Task 3 | Shell start/stop flow plus Hammerspoon press/release orchestration |
| REQ-003 | Task 2, Task 5 | Shared Whisper submission path and verification |
| REQ-004 | Task 2, Task 3, Task 5 | Mode-aware success delivery: clipboard for copy, direct input for type |
| REQ-005 | Task 3, Task 5 | Recording/success/failure notifications |
| REQ-006 | Task 2, Task 3, Task 5 | Cleanup and recovery after failure |
| REQ-007 | Task 2 | Reuse existing transcription logic from `bin/capture.sh` |
| NFR-001 | Task 2, Task 3, Task 5 | Release-driven stop path, no fixed-duration wait |
| NFR-002 | Task 1, Task 2, Task 3 | Keep implementation limited to dotfiles-managed config and scripts |

## Tasks

### Task 1: Manage Hammerspoon through dotfiles

- **Requirements:** `REQ-001`, `NFR-002`
- **Objective:** Ensure the workstation installs Hammerspoon and that the repo owns the config path where the dual hotkey behavior will live.
- **Files:**
  - `/Users/rfhold/dot/configure.py`
  - `/Users/rfhold/dot/home/.hammerspoon/init.lua`
- **Steps:**
  1. Add `hammerspoon` to the managed macOS casks in `configure.py`.
  2. Add a tracked `home/.hammerspoon/init.lua` so the existing home-linking flow manages the config file.
  3. Keep the new config focused on this feature rather than introducing a generic automation framework.
- **Verification:**
  - `rg -n 'hammerspoon' /Users/rfhold/dot/configure.py /Users/rfhold/dot/home/.hammerspoon/init.lua` shows the expected references.
  - `lua -e 'assert(loadfile("/Users/rfhold/dot/home/.hammerspoon/init.lua"))'` succeeds if `lua` is available.
- **Agent Shape:** small multi-file edit
- **Done When:** Hammerspoon is managed by dotfiles and the repo contains the tracked config entry point.

### Task 2: Add hold-to-record shell flow

- **Requirements:** `REQ-002`, `REQ-003`, `REQ-004`, `REQ-006`, `REQ-007`, `NFR-001`, `NFR-002`
- **Objective:** Create a small shell interface that starts recording on demand, stops recording on demand, submits captured audio to Whisper, returns normalized transcript data in a mode-aware way, and cleans up temporary state.
- **Files:**
  - `/Users/rfhold/dot/bin/capture.sh`
  - `/Users/rfhold/dot/bin/whisper-push-to-talk.sh`
  - optional shared helper only if needed to avoid duplicated Whisper parsing
- **Steps:**
  1. Refactor `bin/capture.sh` just enough to separate shared Whisper submission / transcript normalization from fixed-duration capture.
  2. Add a new shell command that supports explicit `start` and `stop` actions for push-to-talk use.
  3. On `start`, create per-invocation state, launch `ffmpeg` microphone capture in the background, and record the process metadata needed to stop it later.
  4. On `stop`, terminate the recorder cleanly, submit the captured file to Whisper, normalize the transcript, and emit enough result information for the caller to either copy or type the transcript.
  5. Keep clipboard writes confined to the copy path so the direct-type path can preserve clipboard contents.
  6. Ensure malformed responses, empty transcripts, missing dependencies, and recorder failures return non-zero status without clobbering the clipboard or emitting partial typed output.
  7. Prevent overlapping invocations by refusing or safely ignoring a new `start` while one is already active.
- **Verification:**
  - `bash -n /Users/rfhold/dot/bin/capture.sh /Users/rfhold/dot/bin/whisper-push-to-talk.sh` succeeds.
  - `rg -n 'pbcopy|whisperx\.holdenitdown\.net/transcribe|jq -r' /Users/rfhold/dot/bin/capture.sh /Users/rfhold/dot/bin/whisper-push-to-talk.sh` confirms the shared transcription path and the copy-only clipboard boundary.
  - Local smoke test in a desktop session: `bin/whisper-push-to-talk.sh start`, brief pause, `bin/whisper-push-to-talk.sh stop` returns success or a clear error and leaves no temp state behind.
- **Agent Shape:** focused shell refactor plus one new script
- **Done When:** a non-interactive start/stop shell interface exists and owns recorder lifecycle, Whisper submission, transcript normalization, and cleanup without forcing clipboard use for direct-type mode.

### Task 3: Wire Hammerspoon press/release orchestration

- **Requirements:** `REQ-001`, `REQ-002`, `REQ-004`, `REQ-005`, `REQ-006`, `NFR-001`, `NFR-002`
- **Objective:** Bind `right cmd+/` and `right cmd+opt+/` globally and connect key events to the shell start/stop flow with mode-specific delivery and notifications.
- **Files:**
  - `/Users/rfhold/dot/home/.hammerspoon/init.lua`
- **Steps:**
  1. Implement the approved hotkeys in Hammerspoon using press callbacks and release callbacks that preserve the invocation mode.
  2. On key down, invoke the shell `start` action and show a recording-in-progress notification only when recording actually starts.
  3. On key up, invoke the shell `stop` action, interpret success/failure from the command result, and either copy the transcript or type it into the focused application based on the shortcut that started the recording.
  4. Ensure the direct-type path uses Hammerspoon/macOS input APIs without modifying clipboard contents first.
  5. Guard against double-start, mode confusion, or stop-without-start cases so a failed invocation does not wedge later attempts.
  6. Keep config self-contained and readable without adding unrelated Hammerspoon helpers.
- **Verification:**
  - `lua -e 'assert(loadfile("/Users/rfhold/dot/home/.hammerspoon/init.lua"))'` succeeds if `lua` is available.
  - Static inspection shows the file invokes the push-to-talk script on both press and release, distinguishes `right cmd+/` from `right cmd+opt+/`, and routes successful output to clipboard or direct typing appropriately.
  - In Hammerspoon console or reload logs, config reload completes without Lua errors.
- **Agent Shape:** single-file config implementation
- **Done When:** Hammerspoon owns both global hotkeys, press/release orchestration, and mode-specific output delivery for the shell flow.

### Task 4: Link and install config on the workstation

- **Requirements:** `REQ-001`, `NFR-002`
- **Objective:** Apply the dotfiles changes so the live environment has the new config and Hammerspoon package.
- **Files:**
  - n/a (verification and deploy step)
- **Steps:**
  1. Run the standard local configure flow needed to link `home/.hammerspoon/init.lua` into `~/.hammerspoon/init.lua` and install any new casks.
  2. Confirm the resulting home path points at the repo-managed file.
  3. Reload Hammerspoon config after the file is in place.
- **Verification:**
  - `/Users/rfhold/.hammerspoon/init.lua` exists after linking.
  - `readlink /Users/rfhold/.hammerspoon/init.lua` resolves into `/Users/rfhold/dot/home/.hammerspoon/init.lua` if the target is symlinked.
  - Hammerspoon is installed or installable through the managed cask list.
- **Agent Shape:** local deploy and inspection
- **Done When:** the live home directory points at the tracked config and Hammerspoon can load it.

### Task 5: End-to-end verification sweep

- **Requirements:** `REQ-001`..`REQ-007`, `NFR-001`, `NFR-002`
- **Objective:** Verify the implementation satisfies the approved spec as far as the current machine session allows.
- **Files:**
  - n/a (verification only)
- **Steps:**
  1. Run syntax checks for edited shell and Lua files.
  2. Exercise the shell start/stop flow directly to validate cleanup, transcript result handling, and failure behavior.
  3. Reload Hammerspoon and inspect for config errors.
  4. If the machine session allows it, manually trigger `right cmd+/` to confirm recording start, release-driven stop, copy behavior, and notifications.
  5. If the machine session allows it, manually trigger `right cmd+opt+/` to confirm recording start, release-driven stop, direct typing behavior, clipboard preservation, and notifications.
- **Verification:**
  - Script and Lua syntax checks pass.
  - No stale temp files or recorder processes remain after success or failure paths.
  - Clipboard is updated only on non-empty success for the copy shortcut.
  - Direct-type success inserts text without altering prior clipboard contents.
  - Hammerspoon reloads without errors.
  - Any untestable desktop-permission gaps are documented explicitly in the final report.
- **Agent Shape:** observational and smoke-test focused
- **Done When:** verification evidence is collected for each implemented requirement, with any remaining permission-gated checks called out.

## Drift Handling

- If `Hammerspoon` cannot distinguish the chosen right-side modifier combination in practice, stop and return to spec review rather than silently changing the shortcut.
- If recorder control with `ffmpeg` proves unreliable on macOS for release-driven stop, prefer a minimal shell-state adjustment or different `ffmpeg` invocation before considering a new recorder backend.
- If synthetic typing behaves inconsistently across focused applications, prefer a minimal Hammerspoon input adjustment and report any application-specific limitations explicitly rather than silently falling back to clipboard paste.
- If end-to-end hotkey testing is blocked by missing desktop permissions, complete the file/config work and report the exact manual permission gate rather than claiming full runtime verification.
- If sharing logic with `bin/capture.sh` would require a larger shell framework than the feature justifies, keep the refactor minimal and document the narrow duplication boundary in the final report.

## Review Checklist

- [ ] Every REQ-### and NFR-### in `spec.md` appears in the coverage matrix.
- [ ] Each task lists files, steps, and verification.
- [ ] The plan keeps Hammerspoon as the only hotkey backend.
- [ ] The plan preserves copy-only clipboard output for `right cmd+/` and direct typing for `right cmd+opt+/`.
- [ ] Verification notes include the possibility of macOS permission-gated manual checks.
