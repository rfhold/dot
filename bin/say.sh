#!/usr/bin/env bash
set -euo pipefail

text="$*"

if command -v ffplay >/dev/null 2>&1; then
  player=(ffplay -nodisp -autoexit -loglevel quiet -)
elif command -v mpv >/dev/null 2>&1; then
  player=(mpv --no-video --no-terminal --really-quiet -)
elif command -v play >/dev/null 2>&1; then
  player=(play -q -)
elif command -v aplay >/dev/null 2>&1; then
  player=(aplay -q)
else
  printf 'No supported audio player found. Install ffplay, mpv, sox (play), or aplay.\n' >&2
  exit 1
fi

curl -s -X POST https://kokoro.holdenitdown.net/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg input "$text" --arg voice "am_adam" --arg response_format "wav" '{input: $input, voice: $voice, response_format: $response_format}')" \
  | "${player[@]}"
