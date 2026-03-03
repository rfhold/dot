#!/usr/bin/env bash
text="$*"
curl -s -X POST https://kokoro.holdenitdown.net/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg input "$text" --arg voice "am_adam" '{input: $input, voice: $voice}')" \
  | ffplay -nodisp -autoexit -loglevel quiet -
