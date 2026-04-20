#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

usage() {
  printf 'Usage: %s <duration-seconds>\n' "$0" >&2
  printf '       %s --transcribe-file <audio-file>\n' "$0" >&2
}

normalize_transcript() {
  jq -r '[.segments[]?.text] | join(" ") | gsub("\\s+"; " ") | sub("^ "; "") | sub(" $"; "")'
}

record_with_ffmpeg() {
  local duration="$1"
  local output_file="$2"

  if [[ "$(uname)" == "Darwin" ]]; then
    ffmpeg -loglevel error -y -f avfoundation -i ":default" -t "$duration" -ac 1 -ar 16000 "$output_file" 2>/dev/null
    return
  fi

  if ffmpeg -loglevel error -y -f pulse -i default -t "$duration" -ac 1 -ar 16000 "$output_file"; then
    return
  fi

  ffmpeg -loglevel error -y -f alsa -i default -t "$duration" -ac 1 -ar 16000 "$output_file"
}

transcribe_file() {
  local audio_file="$1"
  local response text
  local api_url="https://whisperx.holdenitdown.net/transcribe"

  response="$(curl -sS -X POST "$api_url?language=en" \
    -F "file=@$audio_file;type=audio/wav")"

  text="$(printf '%s' "$response" | normalize_transcript)"
  if [[ -z "$text" ]]; then
    printf 'Transcription failed. API response:\n%s\n' "$response" >&2
    exit 1
  fi

  printf '%s\n' "$text"
}

record_for_duration() {
  local duration="$1"
  local tmp_wav

  tmp_wav="$(mktemp).wav"
  trap 'rm -f "$tmp_wav"' EXIT

  if command -v ffmpeg >/dev/null 2>&1; then
    record_with_ffmpeg "$duration" "$tmp_wav"
  elif command -v arecord >/dev/null 2>&1; then
    arecord -q -d "$duration" -f S16_LE -r 16000 -c 1 "$tmp_wav"
  elif command -v rec >/dev/null 2>&1; then
    rec -q -c 1 -r 16000 -b 16 "$tmp_wav" trim 0 "$duration"
  else
    printf 'No supported recorder found. Install ffmpeg, arecord, or sox (rec).\n' >&2
    exit 1
  fi

  transcribe_file "$tmp_wav"
}

if [[ $# -eq 2 && "$1" == "--transcribe-file" ]]; then
  if [[ ! -f "$2" ]]; then
    printf 'Audio file not found: %s\n' "$2" >&2
    exit 1
  fi

  transcribe_file "$2"
  exit 0
fi

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

duration="$1"
if ! [[ "$duration" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  printf 'Duration must be a positive number of seconds.\n' >&2
  exit 1
fi

record_for_duration "$duration"
