#!/usr/bin/env bash
# Pulisce una registrazione dello schermo grezza (OBS, Cap, QuickTime, scrcpy, Tella...) e la rende
# pronta per HyperFrames: H.264, frame rate costante, dimensioni pari, senza audio.
#
# Uso:
#   bash scripts/prepara-registrazione.sh <input> <nome-output> [opzioni]
#
# Opzioni:
#   --da 00:00:03        inizia da qui (taglio iniziale)
#   --a 00:00:15         finisci qui (taglio finale)
#   --velocita 1.5       accelera (1.5 = 50% più veloce; 0.8 = rallenta)
#   --ritaglia W:H:X:Y   ritaglia un'area (es. 1170:2532:0:0 per togliere bordi/barre)
#   --larghezza 1080     ridimensiona mantenendo le proporzioni (default 1080)
#   --fps 30             frame rate di uscita (default 30)
#
# Esempio:
#   bash scripts/prepara-registrazione.sh ~/Desktop/rec.mov 01-aggiungi --da 2 --a 14 --velocita 1.25
#   -> assets/registrazioni/01-aggiungi.mp4
set -euo pipefail

[[ $# -lt 2 ]] && { sed -n '2,20p' "$0"; exit 1; }
IN="$1"; NOME="$2"; shift 2
DA=""; A=""; VEL="1"; CROP=""; LARG="1080"; FPS="30"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --da) DA="$2"; shift 2 ;;
    --a) A="$2"; shift 2 ;;
    --velocita) VEL="$2"; shift 2 ;;
    --ritaglia) CROP="$2"; shift 2 ;;
    --larghezza) LARG="$2"; shift 2 ;;
    --fps) FPS="$2"; shift 2 ;;
    *) echo "Opzione sconosciuta: $1"; exit 1 ;;
  esac
done

DIR="$(cd "$(dirname "$0")/.." && pwd)/assets/registrazioni"
mkdir -p "$DIR"
OUT="$DIR/$NOME.mp4"

FILTRI=()
[[ -n "$CROP" ]] && FILTRI+=("crop=$CROP")
FILTRI+=("setpts=PTS/$VEL" "fps=$FPS" "scale=$LARG:-2:flags=lanczos" "format=yuv420p")
VF="$(IFS=,; echo "${FILTRI[*]}")"

TAGLIO=()
[[ -n "$DA" ]] && TAGLIO+=(-ss "$DA")
[[ -n "$A" ]] && TAGLIO+=(-to "$A")

ffmpeg -hide_banner -loglevel warning -y "${TAGLIO[@]}" -i "$IN" \
  -vf "$VF" -an -c:v libx264 -preset slow -crf 18 -g "$FPS" -keyint_min "$FPS" -movflags +faststart "$OUT"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
RES=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$OUT")
echo "✅ $OUT  (${RES}, ${DUR%.*}s)"
