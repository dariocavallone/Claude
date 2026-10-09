#!/usr/bin/env bash
# Controlla che tutto il necessario sia installato. Esegui: bash scripts/verifica-setup.sh
ok() { echo "  ✅ $1"; }
ko() { echo "  ❌ $1"; echo "     → $2"; ERR=1; }
ERR=0

echo "Controllo prerequisiti..."

if command -v node >/dev/null; then
  V=$(node -v | sed 's/v//; s/\..*//')
  [[ $V -ge 22 ]] && ok "Node.js $(node -v)" || ko "Node.js $(node -v) troppo vecchio" "installa Node 22+ da https://nodejs.org (versione LTS)"
else ko "Node.js mancante" "installa Node 22+ da https://nodejs.org (versione LTS)"; fi

command -v ffmpeg >/dev/null && ok "FFmpeg $(ffmpeg -version | head -1 | awk '{print $3}')" \
  || ko "FFmpeg mancante" "Mac: brew install ffmpeg · Windows: winget install Gyan.FFmpeg · Linux: sudo apt install ffmpeg"

PY=$(command -v python3 || command -v python)
if [[ -n "$PY" ]]; then
  ok "Python $($PY --version 2>&1 | awk '{print $2}')"
  $PY -c "import kokoro_onnx, soundfile" 2>/dev/null && ok "Kokoro TTS (voce IA locale)" \
    || ko "Kokoro TTS mancante" "$PY -m pip install kokoro-onnx soundfile"
else ko "Python mancante" "installa Python 3.10+ da https://python.org"; fi

echo
echo "Diagnostica HyperFrames (Chrome per il render, ecc.)..."
npx --yes hyperframes@0.8.143 doctor || ERR=1

echo
[[ $ERR -eq 0 ]] && echo "🎉 Tutto pronto! Prova: node scripts/crea-video.mjs video/lancio.json --bozza" \
  || echo "⚠️  Sistema i punti segnati con ❌ e rilancia questo script."
exit $ERR
