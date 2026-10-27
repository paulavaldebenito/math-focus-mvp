#!/usr/bin/env bash
# Convierte las escenas grabadas (e2e/test-results/*/video.webm) a MP4 (H.264) con nombre de escena
# y las deja, junto al logo y la ilustración, en el Escritorio › Eureka-video. Usa ffmpeg-static
# (paquete npm gratuito), que se instala la primera vez en ~/.cache/eureka-ffmpeg.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$HOME/Desktop/Eureka-video"
mkdir -p "$OUT"
CACHE="$HOME/.cache/eureka-ffmpeg"
[[ -d "$CACHE/node_modules/ffmpeg-static" ]] || npm install --silent --prefix "$CACHE" ffmpeg-static@5 >/dev/null
FF="$CACHE/node_modules/ffmpeg-static/ffmpeg"
convert() { # $1 = patrón de carpeta, $2 = nombre de salida
  local dir
  dir="$(ls -d "$ROOT"/e2e/test-results/*"$1"* 2>/dev/null | head -1)"
  if [[ -z "$dir" || ! -f "$dir/video.webm" ]]; then echo "No encontré la escena $2"; return; fi
  "$FF" -y -loglevel error -i "$dir/video.webm" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "$OUT/$2.mp4"
  echo "OK: $OUT/$2.mp4"
}
convert "cena-2" "2-nino-practica"
convert "cena-3" "3-panel-docente"
convert "cena-4" "4-espacio-familia"
convert "cena-5" "5-panel-directivo"
cp "$ROOT/client/public/brand/eureka-hero.jpg" "$ROOT/client/public/brand/eureka-logo.png" "$OUT/"
cp "$ROOT/specs/019-video-colegios/guion.md" "$OUT/guion.md"
echo "Listo: $OUT"
