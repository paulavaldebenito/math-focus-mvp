#!/usr/bin/env bash
# Compila el cliente para producción (specs/025) y lo deja en .despliegue/web, listo para S3.
#
#   scripts/construir-web.sh
#
# En producción la web y la API comparten dominio: CloudFront manda /api/* al servidor. Por eso
# el cliente usa rutas relativas y VITE_API_URL va vacía de forma explícita: client/.env la fija
# en http://localhost:4100 para desarrollo y, si quedara, el sitio llamaría al computador de
# quien lo abre. Compila en una copia limpia (sin client/.env ni el node_modules del
# `npm run dev` abierto).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SALIDA="$RAIZ/.despliegue/web"
TRABAJO="$(mktemp -d "${TMPDIR:-/tmp}/eureka-web.XXXXXX")"
trap 'rm -rf "$TRABAJO"' EXIT

rsync -a --exclude node_modules --exclude dist --exclude '.env' --exclude '.env.*' \
  "$RAIZ/client/" "$TRABAJO/client/"
cd "$TRABAJO/client"
npm ci --no-audit --no-fund
# Definida (aunque vacía), gana sobre cualquier archivo .env.
VITE_API_URL= npm run build

if grep -rIl "localhost" dist >/dev/null; then
  echo "Quedó «localhost» en el build:" >&2
  grep -rIl "localhost" dist >&2
  exit 1
fi
test -f dist/index.html

rm -rf "$SALIDA"
mkdir -p "$(dirname "$SALIDA")"
cp -R dist "$SALIDA"
echo "Cliente listo en $SALIDA ($(du -sh "$SALIDA" | cut -f1))."
