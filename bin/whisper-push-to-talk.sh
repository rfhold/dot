#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

usage() {
  printf 'Usage: %s <start|stop>\n' "$0" >&2
}

require_command() {
  local cmd="$1"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$cmd" >&2
    exit 1
  fi
}

tmp_root="${TMPDIR:-/tmp}"
tmp_root="${tmp_root%/}"
state_dir="$tmp_root/whisper-push-to-talk"
pid_file="$state_dir/ffmpeg.pid"
audio_file="$state_dir/recording.wav"
log_file="$state_dir/ffmpeg.log"
startup_checks=8
startup_check_interval=0.05
release_tail_seconds=0.15
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
capture_script="$script_dir/capture.sh"

remove_state_dir() {
  rmdir "$state_dir" 2>/dev/null || true
}

cleanup_stale_state() {
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(<"$pid_file")"

    if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$pid_file"
    fi
  fi

  if [[ ! -f "$pid_file" ]]; then
    rm -f "$audio_file" "$log_file"
    remove_state_dir
  fi
}

cleanup_all_state() {
  rm -f "$pid_file" "$audio_file" "$log_file"
  remove_state_dir
}

wait_for_exit() {
  local pid="$1"
  local max_checks="$2"
  local check=0

  while kill -0 "$pid" 2>/dev/null; do
    if (( check >= max_checks )); then
      return 1
    fi

    sleep 0.1
    check=$((check + 1))
  done

  return 0
}

wait_for_audio_ready() {
  local pid="$1"
  local max_checks="$2"
  local check=0

  while (( check < max_checks )); do
    if [[ -s "$audio_file" ]]; then
      return 0
    fi

    if ! kill -0 "$pid" 2>/dev/null; then
      return 1
    fi

    sleep "$startup_check_interval"
    check=$((check + 1))
  done

  return 0
}

stop_recorder() {
  local pid="$1"

  if ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  kill -INT "$pid" 2>/dev/null || true
  if wait_for_exit "$pid" 50; then
    return 0
  fi

  kill -TERM "$pid" 2>/dev/null || true
  if wait_for_exit "$pid" 20; then
    return 0
  fi

  kill -KILL "$pid" 2>/dev/null || true
  wait_for_exit "$pid" 10
}

start_recording() {
  local pid

  if [[ "$(uname)" != "Darwin" ]]; then
    printf 'Push-to-talk recording is only supported on macOS.\n' >&2
    exit 1
  fi

  require_command ffmpeg
  cleanup_stale_state

  if [[ -f "$pid_file" ]]; then
    pid="$(<"$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      printf 'Recording already in progress.\n' >&2
      exit 2
    fi
  fi

  mkdir -p "$state_dir"
  rm -f "$audio_file" "$log_file" "$pid_file"

  nohup ffmpeg -nostdin -loglevel error -y -f avfoundation -i ":default" -ac 1 -ar 16000 "$audio_file" >"$log_file" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" > "$pid_file"

  if ! wait_for_audio_ready "$pid" "$startup_checks" || ! kill -0 "$pid" 2>/dev/null; then
    if [[ -s "$log_file" ]]; then
      cat "$log_file" >&2
    else
      printf 'Recorder failed to start.\n' >&2
    fi
    cleanup_all_state
    exit 1
  fi
}

stop_recording_action() {
  local pid transcript

  require_command pbcopy

  if [[ ! -f "$pid_file" ]]; then
    printf 'No active recording.\n' >&2
    exit 3
  fi

  pid="$(<"$pid_file")"
  trap 'cleanup_all_state' EXIT

  if [[ -z "$pid" ]]; then
    printf 'Recording state is invalid.\n' >&2
    exit 1
  fi

  sleep "$release_tail_seconds"
  if ! stop_recorder "$pid"; then
    printf 'Recorder failed to stop cleanly.\n' >&2
    exit 1
  fi

  rm -f "$pid_file"

  if [[ ! -s "$audio_file" ]]; then
    if [[ -s "$log_file" ]]; then
      cat "$log_file" >&2
    else
      printf 'Recorded audio file is empty.\n' >&2
    fi
    exit 1
  fi

  transcript="$("$capture_script" --transcribe-file "$audio_file")"
  printf '%s' "$transcript" | pbcopy
  printf '%s\n' "$transcript"
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  start)
    start_recording
    ;;
  stop)
    stop_recording_action
    ;;
  *)
    usage
    exit 1
    ;;
esac
