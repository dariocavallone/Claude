#!/usr/bin/env bash
# Prepara la sessione cloud di Claude Code (claude.ai/code): dipendenze + skill HyperFrames.
# Lanciato in automatico all'avvio della sessione (hook SessionStart in .claude/settings.json).
set -uo pipefail
[[ "${CLAUDE_CODE_REMOTE:-}" != "true" ]] && exit 0
cd "$(dirname "$0")/.."

npm install --no-audit --no-fund --silent >/dev/null 2>&1 || echo "⚠️ npm install fallito"
python3 -m pip install -q kokoro-onnx soundfile >/dev/null 2>&1 || echo "⚠️ installazione Kokoro fallita"
command -v ffmpeg >/dev/null || echo "⚠️ FFmpeg mancante nell'ambiente cloud"
# Skill ufficiali HyperFrames (router, core, media-use, product-launch-video...) in ~/.claude/skills
npx --yes hyperframes@0.8.143 skills update product-launch-video >/dev/null 2>&1 || echo "⚠️ skill HyperFrames non installate"

if [[ -n "${HEYGEN_API_KEY:-}" ]]; then
  curl -s -m 8 -o /dev/null https://api.heygen.com && echo "HeyGen: chiave presente e API raggiungibile" \
    || echo "⚠️ HeyGen: chiave presente ma api.heygen.com bloccato dalla rete dell'ambiente"
else
  echo "HeyGen: nessuna chiave (HEYGEN_API_KEY), uso la voce gratuita Kokoro"
fi
exit 0
