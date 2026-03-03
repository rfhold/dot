#!/usr/bin/env bash
set -euo pipefail

text="$*"

if [[ -z "$text" ]]; then
  printf 'Usage: %s <text>\n' "$0" >&2
  exit 1
fi

cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/say-tts"
max_cache_bytes=$((200 * 1024 * 1024))
max_cacheable_text_chars=280
max_cacheable_audio_bytes=$((5 * 1024 * 1024))

player=()
play_audio() {
  local audio_file="$1"
  "${player[@]}" "$audio_file"
}

hash_text() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | cut -d' ' -f1
  else
    shasum -a 256 | cut -d' ' -f1
  fi
}

cache_size_bytes() {
  if [[ ! -d "$cache_dir" ]]; then
    printf '0\n'
    return
  fi

  if du -sb "$cache_dir" >/dev/null 2>&1; then
    du -sb "$cache_dir" | cut -f1
  else
    local size_kb
    size_kb="$(du -sk "$cache_dir" | cut -f1)"
    printf '%s\n' "$((size_kb * 1024))"
  fi
}

file_size_bytes() {
  local file_path="$1"
  if stat -c%s "$file_path" >/dev/null 2>&1; then
    stat -c%s "$file_path"
  else
    stat -f%z "$file_path"
  fi
}

make_temp_wav() {
  if mktemp --suffix=.wav >/dev/null 2>&1; then
    mktemp --suffix=.wav
  else
    mktemp -t say-tts.XXXXXX.wav
  fi
}

trim_cache() {
  while (( $(cache_size_bytes) > max_cache_bytes )); do
    local oldest
    oldest="$(ls -1tr "$cache_dir"/*.wav 2>/dev/null | head -n 1 || true)"
    if [[ -z "$oldest" ]]; then
      break
    fi
    rm -f "$oldest"
  done
}

if command -v ffplay >/dev/null 2>&1; then
  player=(ffplay -nodisp -autoexit -loglevel quiet)
elif command -v mpv >/dev/null 2>&1; then
  player=(mpv --no-video --no-terminal --really-quiet)
elif command -v play >/dev/null 2>&1; then
  player=(play -q)
elif command -v aplay >/dev/null 2>&1; then
  player=(aplay -q)
else
  printf 'No supported audio player found. Install ffplay, mpv, sox (play), or aplay.\n' >&2
  exit 1
fi

cacheable=false
cache_key=""
cache_file=""

if (( ${#text} <= max_cacheable_text_chars )); then
  cacheable=true
  cache_key="$(printf '%s' "am_adam|wav|$text" | hash_text)"
  cache_file="$cache_dir/$cache_key.wav"
  if [[ -f "$cache_file" ]]; then
    play_audio "$cache_file"
    exit 0
  fi
fi

tmp_wav="$(make_temp_wav)"
trap 'rm -f "$tmp_wav"' EXIT

curl -sS -X POST https://kokoro.holdenitdown.net/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg input "$text" --arg voice "am_adam" --arg response_format "wav" '{input: $input, voice: $voice, response_format: $response_format}')" \
  -o "$tmp_wav"

if $cacheable && [[ -n "$cache_file" ]]; then
  audio_size="$(file_size_bytes "$tmp_wav")"
  if (( audio_size <= max_cacheable_audio_bytes )); then
    mkdir -p "$cache_dir"
    cp "$tmp_wav" "$cache_file"
    trim_cache
  fi
fi

play_audio "$tmp_wav"
