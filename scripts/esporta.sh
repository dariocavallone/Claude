#!/usr/bin/env bash
# Post-produzione con FFmpeg: crea le versioni da pubblicare a partire dal video renderizzato.
#
# Uso:
#   bash scripts/esporta.sh output/lancio.mp4 [--verticale] [--quadrato] [--gif]
#
# Produce sempre:
#   output/<nome>-web.mp4        audio normalizzato a -14 LUFS (standard YouTube/Instagram/TikTok), file leggero
#   output/<nome>-copertina.jpg  miniatura (fotogramma a 1.5s)
# Con le opzioni:
#   --verticale  output/<nome>-9x16.mp4  da un video orizzontale: video al centro su sfondo sfocato (Reels/TikTok/Shorts)
#   --quadrato   output/<nome>-1x1.mp4   idem in 1:1 (feed LinkedIn/Instagram)
#   --gif        output/<nome>.gif       anteprima animata per README, Product Hunt, email (primi 8s)
#
# Suggerimento: per i social è meglio un video nato verticale ("formato": "verticale" nel JSON);
# --verticale è la scorciatoia per riusare il video orizzontale.
set -euo pipefail

[[ $# -lt 1 ]] && { sed -n '2,17p' "$0"; exit 1; }
IN="$1"; shift
BASE="${IN%.*}"
Q=(-hide_banner -loglevel warning -y)

echo "🔊 Normalizzo l'audio e comprimo per il web..."
ffmpeg "${Q[@]}" -i "$IN" -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$BASE-web.mp4"

ffmpeg "${Q[@]}" -ss 1.5 -i "$IN" -frames:v 1 -q:v 2 "$BASE-copertina.jpg"

riformatta() { # $1=larghezza $2=altezza $3=file di uscita
  ffmpeg "${Q[@]}" -i "$BASE-web.mp4" -filter_complex \
    "[0:v]scale=$1:$2:force_original_aspect_ratio=increase,crop=$1:$2,boxblur=40:2,eq=brightness=-0.12[bg];
     [0:v]scale=$1:$2:force_original_aspect_ratio=decrease[fg];
     [bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p" \
    -c:v libx264 -preset slow -crf 21 -c:a copy -movflags +faststart "$3"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --verticale) echo "📱 Versione 9:16..."; riformatta 1080 1920 "$BASE-9x16.mp4" ;;
    --quadrato)  echo "⬛ Versione 1:1...";  riformatta 1080 1080 "$BASE-1x1.mp4" ;;
    --gif)
      echo "🖼️  GIF di anteprima..."
      ffmpeg "${Q[@]}" -t 8 -i "$IN" -vf "fps=12,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer" "$BASE.gif" ;;
    *) echo "Opzione sconosciuta: $1"; exit 1 ;;
  esac
  shift
done

echo "✅ Fatto:"; ls -lh "$BASE"-* "$BASE".gif 2>/dev/null | awk '{print "   " $5 "\t" $9}'
