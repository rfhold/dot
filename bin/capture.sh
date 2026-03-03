#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  printf 'Usage: %s <duration-seconds>\n' "$0" >&2
  exit 1
fi

duration="$1"
if ! [[ "$duration" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
  printf 'Duration must be a positive number of seconds.\n' >&2
  exit 1
fi

api_url="https://whisperx.holdenitdown.net/transcribe"
tmp_wav="$(mktemp).wav"
trap 'rm -f "$tmp_wav"' EXIT

record_with_ffmpeg() {
  if [[ "$(uname)" == "Darwin" ]]; then
    ffmpeg -loglevel error -y -f avfoundation -i ":default" -t "$duration" -ac 1 -ar 16000 "$tmp_wav" 2>/dev/null
    return
  fi

  if ffmpeg -loglevel error -y -f pulse -i default -t "$duration" -ac 1 -ar 16000 "$tmp_wav"; then
    return
  fi

  ffmpeg -loglevel error -y -f alsa -i default -t "$duration" -ac 1 -ar 16000 "$tmp_wav"
}

if command -v ffmpeg >/dev/null 2>&1; then
  record_with_ffmpeg
elif command -v arecord >/dev/null 2>&1; then
  arecord -q -d "$duration" -f S16_LE -r 16000 -c 1 "$tmp_wav"
elif command -v rec >/dev/null 2>&1; then
  rec -q -c 1 -r 16000 -b 16 "$tmp_wav" trim 0 "$duration"
else
  printf 'No supported recorder found. Install ffmpeg, arecord, or sox (rec).\n' >&2
  exit 1
fi

response="$(curl -sS -X POST "$api_url?language=en" \
  -F "file=@$tmp_wav;type=audio/wav")"

text="$(printf '%s' "$response" | jq -r '[.segments[]?.text] | join(" ") | gsub("\\s+"; " ") | sub("^ "; "") | sub(" $"; "")')"
if [[ -z "$text" ]]; then
  printf 'Transcription failed. API response:\n%s\n' "$response" >&2
  exit 1
fi

printf '%s\n' "$text"
