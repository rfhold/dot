---
feature: whisper-push-to-talk
title: Whisper Push-To-Talk Shortcut
status: draft
created: 2026-04-20
updated: 2026-04-20
---

# Whisper Push-To-Talk Shortcut

## Goal

Define macOS global push-to-talk shortcuts that record microphone audio only while the user holds `right cmd+/` or `right cmd+opt+/`, send the captured audio to the existing Whisper transcription service on release, and then either copy the transcript to the clipboard or type it into the focused application based on which shortcut was used.

## Scope

This spec covers the local shortcut implementation in this dotfiles repo, including the Hammerspoon keybindings, the audio capture and transcription flow, clipboard integration, focused-application text insertion, and user-visible notifications.

It includes:
- Hammerspoon-managed global shortcuts for `right cmd+/` and `right cmd+opt+/`
- press-to-start and release-to-stop microphone recording
- submission of recorded audio to `https://whisperx.holdenitdown.net/transcribe`
- copying successful transcript output to the macOS clipboard for `right cmd+/`
- typing successful transcript output into the focused application for `right cmd+opt+/` without changing clipboard contents
- notifications for recording, transcription, and output outcomes
- cleanup of temporary audio files and recorder processes

## Dependencies

- local macOS services for microphone capture, notifications, and clipboard access
- `ffmpeg`, `curl`, and `jq` on the local machine
- `Hammerspoon` for global hotkey handling
- `https://whisperx.holdenitdown.net/transcribe`

## Non-Goals

- streaming partial transcription results while recording is still in progress
- wake-word or always-on microphone listening
- a GUI preferences screen for selecting shortcuts or output modes
- non-macOS shortcut implementations
- additional default shortcut/output combinations beyond the approved two

## Constraints

- The shortcut implementation MUST target macOS and MUST use `Hammerspoon` as the global hotkey backend.
- The default copy shortcut MUST be `right cmd+/` and the default direct-type shortcut MUST be `right cmd+opt+/` unless an approved spec changes them.
- Recording MUST occur only while the shortcut is held.
- Transcription MUST use the existing Whisper service endpoint `https://whisperx.holdenitdown.net/transcribe` unless an approved spec changes it.
- Successful output for `right cmd+/` MUST be copied with macOS clipboard tooling and MUST NOT require manual terminal interaction.
- Successful output for `right cmd+opt+/` MUST be inserted into the focused application without first overwriting clipboard contents.
- Failed or empty transcription results MUST NOT overwrite the clipboard with empty content and MUST NOT type empty text into the focused application.
- Temporary capture artifacts MUST be removed after completion or failure.

## Requirements

### REQ-001: Global Shortcut Binding

**Statement:** The system MUST register global push-to-talk shortcuts on `right cmd+/` and `right cmd+opt+/` using `Hammerspoon`.

**Acceptance Criteria:**
- Pressing either approved shortcut triggers the recording start path without requiring terminal focus.
- Releasing either approved shortcut triggers the recording stop and transcription path.
- The shortcut invocation determines whether the success path copies to the clipboard or types into the focused application.
- The shortcut remains available across applications, subject to normal macOS accessibility and input permission requirements.
- No additional default shortcut is introduced alongside `right cmd+/` and `right cmd+opt+/`.

### REQ-002: Hold-To-Record Lifecycle

**Statement:** The recording lifecycle MUST be tied directly to shortcut press and release events.

**Acceptance Criteria:**
- Key down starts a new microphone capture session.
- Key release stops the active microphone capture session for that shortcut invocation.
- A new shortcut press after a completed capture starts a fresh session rather than reusing prior audio.
- The output mode for an invocation is fixed by the shortcut that started the recording.
- The implementation MUST prevent overlapping concurrent recordings from the same shortcut flow.

### REQ-003: Whisper Submission

**Statement:** After recording stops, the captured audio MUST be submitted to the configured Whisper service for transcription.

**Acceptance Criteria:**
- The recorded audio is encoded in a format accepted by the current Whisper endpoint.
- The request is sent to `https://whisperx.holdenitdown.net/transcribe`.
- The transcription flow normalizes the returned transcript into a single plain-text string suitable for clipboard use.
- If the Whisper service request fails, the flow surfaces a failure result to the user instead of silently succeeding.

### REQ-004: Output Delivery

**Statement:** A successful transcription MUST be delivered according to the shortcut that initiated the recording.

**Acceptance Criteria:**
- On success from `right cmd+/`, the transcript is written to the clipboard with `pbcopy` or an equivalent macOS clipboard API.
- On success from `right cmd+opt+/`, the transcript is typed into the focused application with macOS input APIs without first changing clipboard contents.
- The delivered text matches the normalized transcript returned by the transcription flow.
- If the transcript is empty after normalization, clipboard contents and the focused application remain unchanged.

### REQ-005: User Notifications

**Statement:** The shortcut flow MUST provide visible notifications for recording and transcription state changes.

**Acceptance Criteria:**
- Starting a recording shows a notification that recording is in progress.
- Releasing the shortcut shows a notification that transcription is in progress.
- A successful transcription shows a notification that the transcript was copied or typed, matching the invoked shortcut.
- A failed recording or transcription shows a notification that the operation failed.
- Notifications do not require an open terminal window to understand the result.

### REQ-006: Failure Handling And Cleanup

**Statement:** The shortcut flow MUST clean up temporary resources and leave the system in a usable state after both success and failure.

**Acceptance Criteria:**
- Temporary audio files are deleted after transcription completes or fails.
- Recorder processes started for a shortcut invocation are terminated when recording stops.
- A failure in one invocation does not prevent a later shortcut press from starting a new recording.
- Empty or malformed service responses are treated as failures.
- Failed invocations do not modify the clipboard or insert partial text into the focused application.

### REQ-007: Reuse Existing Local Transcription Behavior

**Statement:** The implementation SHOULD reuse the existing local transcription shell tooling where practical instead of duplicating Whisper parsing logic across multiple places.

**Acceptance Criteria:**
- Shared Whisper endpoint handling and transcript normalization logic lives in one local script path or one common shell code path.
- The push-to-talk flow does not introduce a second independent implementation of response parsing without a documented need.
- Any new script surface added for push-to-talk is narrowly scoped to start/stop lifecycle needs that the existing duration-based command does not cover.

## Non-Functional Requirements

### NFR-001: Responsive Release Behavior

**Statement:** The shortcut flow SHOULD stop recording promptly on key release so the user does not need to wait for an arbitrary fixed-duration timeout.

**Acceptance Criteria:**
- Recording stop is triggered by key release rather than by a preconfigured duration.
- The user does not need to estimate speech length before starting a recording.
- The implementation avoids adding extra intentional delay between key release and recorder shutdown.

### NFR-002: Minimal Local Surface Area

**Statement:** The implementation SHOULD remain small and local to the existing dotfiles-managed automation stack.

**Acceptance Criteria:**
- Global shortcut behavior is implemented through Hammerspoon config rather than a new background application.
- The transcription flow relies on standard local tools already present in the repo's shell automation style.
- The change is limited to the shortcut integration and related scripts/config needed for this feature.

## Contract Boundaries

- shortcut boundary: `Hammerspoon` owns the global keybinding and press/release event delivery
- audio boundary: local recorder tooling captures microphone input into a temporary audio file
- transcription boundary: `https://whisperx.holdenitdown.net/transcribe` accepts uploaded audio and returns transcription data
- clipboard boundary: macOS clipboard services store the final transcript for the copy shortcut
- text insertion boundary: macOS accessibility/input services insert the transcript into the focused application for the direct-type shortcut
- notification boundary: macOS notification services surface status to the user outside the terminal

## Implementation Boundaries

- Hammerspoon configuration owns shortcut registration, press/release orchestration, and direct text insertion into the focused application.
- Local shell tooling owns recorder process management, temporary file lifecycle, Whisper submission, and transcript normalization.
- Existing `bin/capture.sh` behavior is the starting point for shared transcription logic, but fixed-duration capture behavior may be split from hold-to-record behavior if needed.
- Clipboard handling remains local to the copy shortcut path.
- This change does not define a generalized shortcut framework for unrelated automation.

## Risks

- `Hammerspoon` handling of `right cmd+/` and `right cmd+opt+/` may require verification on the target keyboard layout and modifier mapping.
- macOS microphone, input monitoring, accessibility, text-insertion, or notification permissions may block parts of the flow until granted.
- Recorder shutdown timing may truncate speech if the capture process is not stopped cleanly.
- Focused applications may reject or transform synthetic text input differently from ordinary typing.
- Whisper service availability or latency may affect perceived responsiveness after key release.

## Open Questions

- Q1: Resolved. `right cmd+/` copies successful transcripts to the clipboard, while `right cmd+opt+/` types successful transcripts into the focused application.
- Q2: Resolved. The initial shortcuts are `right cmd+/` and `right cmd+opt+/`.
- Q3: Resolved. `Hammerspoon` is the approved backend for press-and-hold shortcut handling on macOS.
