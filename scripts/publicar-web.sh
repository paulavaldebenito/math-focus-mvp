#!/usr/bin/env bash
# Sube el cliente compilado (.despliegue/web, de scripts/construir-web.sh) al bucket S3 de la
# web e invalida la caché de CloudFront (specs/025).
#
#   scripts/publicar-web.sh
#
# CAMBIA RECURSOS EN AWS (perfil `eureka`): pide confirmación antes de hacerlo.
#
# Caché: /assets/* lleva hash en el nombre → inmutable por un año. index.html → no-cache (el
# navegador y CloudFront siempre preguntan si cambió), así una versión nueva se ve al recargar.
# Las imágenes del banco no llevan hash → un día, y la invalidación /* las renueva al publicar.
# No se borran archivos viejos de /assets: una pestaña abierta con la versión anterior los sigue
# pidiendo.
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-eureka}" AWS_REGION="${AWS_REGION:-sa-east-1}"
PILA="${PILA:-eureka}"
CUENTA_ESPERADA="034726292734"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$RAIZ/.despliegue/web"

test -f "$WEB/index.html" || { echo "Falta $WEB: corre scripts/construir-web.sh" >&2; exit 1; }
if grep -rIl "localhost" "$WEB" >/dev/null; then
  echo "El build contiene «localhost». Vuelve a correr scripts/construir-web.sh." >&2
  exit 1
fi
if [ "$(aws sts get-caller-identity --query Account --output text)" != "$CUENTA_ESPERADA" ]; then
  echo "El perfil $AWS_PROFILE no apunta a la cuenta $CUENTA_ESPERADA. Me detengo." >&2
  exit 1
fi

salida() {
  aws cloudformation describe-stacks --stack-name "$PILA" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}
BUCKET="$(salida BucketWeb)"
DISTRIBUCION="$(salida IdDistribucion)"

echo "Subir $WEB ($(du -sh "$WEB" | cut -f1)) a s3://$BUCKET e invalidar CloudFront $DISTRIBUCION."
read -r -p "¿Publicar? Escribe «si» para continuar: " RESPUESTA
[ "$RESPUESTA" = "si" ] || { echo "Cancelado."; exit 1; }

aws s3 sync "$WEB/assets" "s3://$BUCKET/assets" --only-show-errors \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync "$WEB" "s3://$BUCKET" --only-show-errors \
  --exclude "assets/*" --exclude "index.html" --exclude "manifest.webmanifest" \
  --cache-control "public, max-age=86400"
aws s3 cp "$WEB/manifest.webmanifest" "s3://$BUCKET/manifest.webmanifest" --only-show-errors \
  --content-type "application/manifest+json" --cache-control "public, max-age=86400"
# index.html al final: recién ahora apunta a los archivos nuevos, que ya están arriba.
aws s3 cp "$WEB/index.html" "s3://$BUCKET/index.html" --only-show-errors \
  --content-type "text/html; charset=utf-8" --cache-control "no-cache"

# Una ruta con comodín cuenta como una sola invalidación (las primeras 1.000 al mes son gratis).
aws cloudfront create-invalidation --distribution-id "$DISTRIBUCION" --paths "/*" \
  --query 'Invalidation.[Id,Status]' --output text
echo "Publicado. La invalidación tarda unos minutos en llegar a todas las ubicaciones."
