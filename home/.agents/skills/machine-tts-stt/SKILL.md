---
name: machine-tts-stt
description: Uses local machine audio I/O helpers for quick speech loops. Use when user asks to speak text with say.sh, capture microphone audio with capture.sh, or test TTS-to-STT by playing and recording on the same machine.
metadata:
  author: rfhold
  version: "1.0"
  category: audio
  tags: tts, stt, whisper, ffmpeg
---

# Machine TTS/STT

Use:
- `say.sh "text"` to synthesize speech and play audio on the local machine speakers.
- `capture.sh <seconds>` to record from the local machine microphone for that duration and print transcription text.

Quick loopback test (same machine):
```bash
(capture.sh 4) & pid=$!; sleep 1; say.sh "this is a capture test"; wait $pid
```

Notes:
- Audio playback and recording happen on the machine running the command.
- If no text is captured, increase duration or mic/speaker volume.
