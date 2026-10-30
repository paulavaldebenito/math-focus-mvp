#!/usr/bin/env bash
# Paquete de la API para Elastic Beanstalk (specs/025).
#
#   scripts/empaquetar-api.sh              # deja .despliegue/eureka-api-<versión>.zip
#   scripts/empaquetar-api.sh --verificar  # además lo prueba: lo descomprime, instala solo las
#                                          # dependencias de producción, migra y siembra una base
#                                          # `prisma dev` aislada, arranca y llama /api/health
#
# Compila en una copia limpia de server/ (no toca el node_modules ni el dist del `npm run dev`
# abierto). El zip lleva solo lo que corre en la instancia:
#
#   dist/                    servidor compilado, incluido el cliente Prisma generado
#   package.json, package-lock.json   EB corre la instalación sin devDependencies
#   prisma.config.ts, prisma/schema.prisma, prisma/migrations/   para `prisma migrate deploy`
#   prisma/seed.ts, prisma/integrar-banco-imagenes.ts, prisma/seed/, src/   banco de ejercicios
#                            (el seed corre con tsx sobre el código fuente)
#   certs/rds-global-bundle.pem   certificados raíz de RDS para verificar TLS (DB_SSL=verificar)
#   Procfile, .ebextensions/, scripts-eb/   arranque y migraciones en el despliegue
#
# Nunca lleva .env, pruebas, prisma/demo ni prisma/carga (cuentas de demostración y de carga).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
VERIFICAR=0
for arg in "$@"; do
  case "$arg" in
    --verificar) VERIFICAR=1 ;;
    *) echo "Opción desconocida: $arg" >&2; exit 2 ;;
  esac
done

paso() { printf '\n\033[1;34m== %s\033[0m\n' "$1"; }

if [ "$(node -p 'process.versions.node.split(".")[0]')" != "22" ]; then
  echo "Se necesita Node 22 (el de la plataforma de Elastic Beanstalk). Tienes $(node -v)." >&2
  exit 1
fi

# Versión: commit + marca si hay cambios sin commitear + hora. EB exige etiquetas únicas.
COMMIT="$(git -C "$RAIZ" rev-parse --short HEAD)"
SUCIO=""
git -C "$RAIZ" diff --quiet HEAD -- server infra/beanstalk || SUCIO="-sucio"
VERSION="${COMMIT}${SUCIO}-$(date +%Y%m%d-%H%M%S)"
SALIDA="$RAIZ/.despliegue"
ZIP="$SALIDA/eureka-api-$VERSION.zip"
mkdir -p "$SALIDA"

TRABAJO="$(mktemp -d "${TMPDIR:-/tmp}/eureka-empaque.XXXXXX")"
BUILD="$TRABAJO/build"
PAQUETE="$TRABAJO/paquete"
limpiar() { rm -rf "$TRABAJO"; }
trap limpiar EXIT

paso "Compilación en una copia limpia ($VERSION)"
rsync -a \
  --exclude node_modules --exclude dist --exclude 'src/generated' \
  --exclude '.env' --exclude '.env.*' --exclude '.pgdata' \
  "$RAIZ/server/" "$BUILD/"
cd "$BUILD"
npm ci --no-audit --no-fund
npm run build
test -f dist/index.js && test -f dist/generated/prisma/client.js || {
  echo "La compilación no dejó dist/index.js o el cliente Prisma en dist/generated." >&2
  exit 1
}

paso "Armado del paquete"
mkdir -p "$PAQUETE/prisma" "$PAQUETE/certs"
cp -R dist "$PAQUETE/dist"
find "$PAQUETE/dist" -type d -name __tests__ -prune -exec rm -rf {} +
cp package.json package-lock.json prisma.config.ts "$PAQUETE/"
cp prisma/schema.prisma prisma/seed.ts prisma/integrar-banco-imagenes.ts "$PAQUETE/prisma/"
cp -R prisma/migrations "$PAQUETE/prisma/migrations"
rsync -a --exclude __tests__ prisma/seed/ "$PAQUETE/prisma/seed/"
# El seed importa el cliente Prisma y algunos módulos de src/ (lo ejecuta tsx).
rsync -a --exclude __tests__ src/ "$PAQUETE/src/"

curl -fsS https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o "$PAQUETE/certs/rds-global-bundle.pem"
if [ "$(grep -c 'BEGIN CERTIFICATE' "$PAQUETE/certs/rds-global-bundle.pem")" -lt 10 ]; then
  echo "El paquete de certificados de RDS no parece válido." >&2
  exit 1
fi

cp "$RAIZ/infra/beanstalk/Procfile" "$PAQUETE/"
cp -R "$RAIZ/infra/beanstalk/.ebextensions" "$PAQUETE/.ebextensions"
cp -R "$RAIZ/infra/beanstalk/scripts-eb" "$PAQUETE/scripts-eb"
echo "$VERSION" > "$PAQUETE/VERSION"

# Nada de secretos ni datos de demostración en el paquete.
if find "$PAQUETE" \( -name '.env' -o -name '.env.*' -o -path '*/prisma/demo*' -o -path '*/prisma/carga*' \) | grep -q .; then
  echo "El paquete contiene .env o datos de demostración. Me detengo." >&2
  exit 1
fi

(cd "$PAQUETE" && zip -q -r -X "$ZIP" . -x '.DS_Store' '*/.DS_Store')
echo "Paquete: $ZIP ($(du -h "$ZIP" | cut -f1))"

if [ "$VERIFICAR" = 0 ]; then
  exit 0
fi

# --- Verificación: el zip tal cual, con solo dependencias de producción, contra una base aislada.
NOMBRE_DB="eureka-empaque"
PRUEBA="$TRABAJO/prueba"
PUERTO_API=4300
apagar_db() {
  (cd "$RAIZ/server" && npx prisma dev stop "$NOMBRE_DB" >/dev/null 2>&1 || true)
  (cd "$RAIZ/server" && npx prisma dev rm "$NOMBRE_DB" >/dev/null 2>&1 || true)
}
trap 'kill "${PID_API:-}" 2>/dev/null || true; apagar_db; limpiar' EXIT

paso "Verificación: descomprimir e instalar sin devDependencies"
mkdir -p "$PRUEBA" && cd "$PRUEBA"
unzip -q "$ZIP"
npm ci --omit=dev --no-audit --no-fund
# (typescript y @types/node sí pueden aparecer: otras dependencias los declaran como peer.)
for dev in vitest oxlint; do
  if [ -d "node_modules/$dev" ]; then echo "Se instaló $dev (devDependency) en producción." >&2; exit 1; fi
done

paso "Verificación: base aislada $NOMBRE_DB (nunca la de desarrollo)"
apagar_db
# Sin PORT ni server/.env: con PORT definida, `prisma dev` usa ese puerto para todo y se cuelga.
URL_DB="$(cd "$RAIZ/server" && env -u PORT DOTENV_CONFIG_PATH=/dev/null npx prisma dev --name "$NOMBRE_DB" -d 2>/dev/null | grep -oE 'postgres://[^[:space:]]+' | head -1)"
if [ -z "$URL_DB" ]; then echo "No se pudo levantar la base $NOMBRE_DB." >&2; exit 1; fi
PUERTO_DB="$(echo "$URL_DB" | sed -E 's#.*@localhost:([0-9]+)/.*#\1#')"
if grep -q "localhost:$PUERTO_DB/" "$RAIZ/server/.env" 2>/dev/null; then
  echo "La base resultó ser la de server/.env (puerto $PUERTO_DB). Me detengo." >&2
  exit 1
fi
for _ in $(seq 1 30); do nc -z localhost "$PUERTO_DB" 2>/dev/null && break; sleep 1; done

# Lo mismo que en EB, salvo la base (PGlite: una conexión y sin TLS).
export DATABASE_URL="$URL_DB" PG_POOL_MAX=1 NODE_ENV=production PORT="$PUERTO_API" \
  SESSION_SECRET="verificacion-del-paquete-$(date +%s)-no-es-un-secreto-real" \
  CLIENT_ORIGIN="https://app.eurekalatam.com" TRUST_PROXY_HOPS=3

paso "Verificación: migraciones y banco (scripts-eb/migrar-y-sembrar.sh)"
bash scripts-eb/migrar-y-sembrar.sh

paso "Verificación: arranque con NODE_ENV=production"
node dist/index.js > "$TRABAJO/api.log" 2>&1 &
PID_API=$!
for _ in $(seq 1 30); do curl -fsS "http://localhost:$PUERTO_API/api/health" >/dev/null 2>&1 && break; sleep 1; done
SALUD="$(curl -fsS "http://localhost:$PUERTO_API/api/health")"
SALUD_DB="$(curl -fsS "http://localhost:$PUERTO_API/api/health/db")"
echo "/api/health → $SALUD"
echo "/api/health/db → $SALUD_DB"
[ "$SALUD" = '{"ok":true}' ] && [ "$SALUD_DB" = '{"ok":true,"db":"ok"}' ] || { cat "$TRABAJO/api.log"; exit 1; }

# Apagado ordenado: SIGTERM debe cerrar el servidor y el pool y salir con 0.
kill -TERM "$PID_API"
CODIGO=0
wait "$PID_API" || CODIGO=$?
PID_API=""
cat "$TRABAJO/api.log"
[ "$CODIGO" = 0 ] || { echo "El servidor salió con código $CODIGO tras SIGTERM." >&2; exit 1; }

paso "Paquete verificado ✅ $ZIP"
