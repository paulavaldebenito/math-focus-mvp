#!/usr/bin/env bash
# Ambiente de test aislado (specs/023): base Postgres NUEVA y vacía, separada de la de desarrollo,
# con el mismo flujo que CI — migraciones, chequeo de drift, seed — y la suite completa encima.
#
#   scripts/ambiente-test.sh            # todo: servidor, cliente y E2E; apaga la base al final
#   scripts/ambiente-test.sh --sin-e2e  # sin E2E (más rápido)
#   scripts/ambiente-test.sh --dejar    # deja la base corriendo para inspeccionarla
#
# Usa `prisma dev` (PGlite) con nombre y puertos fijos, así nunca toca la base `default`.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
NOMBRE="eureka-test"
E2E=1
DEJAR=0
for arg in "$@"; do
  case "$arg" in
    --sin-e2e) E2E=0 ;;
    --dejar) DEJAR=1 ;;
    *) echo "Opción desconocida: $arg" >&2; exit 2 ;;
  esac
done

paso() { printf '\n\033[1;34m== %s\033[0m\n' "$1"; }

# Servidor y cliente de test en puertos propios (no 4100/5173): puede correr con un `npm run dev`
# abierto, y E2E_AISLADO hace que Playwright levante servidores nuevos contra la base de test.
export E2E_SERVER_PORT=4200 E2E_CLIENT_PORT=5273 E2E_AISLADO=1
if [ "$E2E" = 1 ]; then
  for p in "$E2E_SERVER_PORT" "$E2E_CLIENT_PORT"; do
    if nc -z localhost "$p" 2>/dev/null; then
      echo "El puerto $p está ocupado. Ciérralo o usa --sin-e2e." >&2
      exit 1
    fi
  done
fi

cd "$RAIZ/server"

apagar() {
  if [ "$DEJAR" = 0 ]; then
    npx prisma dev stop "$NOMBRE" >/dev/null 2>&1 || true
  else
    echo "Base de test corriendo en localhost:$PUERTO_DB (detener: npx prisma dev stop $NOMBRE)"
  fi
}
trap apagar EXIT

paso "Base de test nueva ($NOMBRE)"
npx prisma dev stop "$NOMBRE" >/dev/null 2>&1 || true
npx prisma dev rm "$NOMBRE" >/dev/null 2>&1 || true
# `prisma dev` elige sus propios puertos (ignora -P): se toma la URL que imprime al arrancar.
# Sin PORT ni server/.env: la versión actual de `prisma dev` usa la variable PORT (PORT=4100 en
# .env) para sus tres puertos a la vez y se queda colgada «starting_up» (2026-10-30).
URL_DB="$(env -u PORT DOTENV_CONFIG_PATH=/dev/null npx prisma dev --name "$NOMBRE" -d 2>/dev/null | grep -oE 'postgres://[^[:space:]]+' | head -1)"
if [ -z "$URL_DB" ]; then echo "No se pudo levantar la base de test." >&2; exit 1; fi
PUERTO_DB="$(echo "$URL_DB" | sed -E 's#.*@localhost:([0-9]+)/.*#\1#')"
# Nunca correr migraciones/seed/pruebas contra la base de desarrollo.
if grep -q "localhost:$PUERTO_DB/" "$RAIZ/server/.env" 2>/dev/null; then
  echo "La base de test resultó ser la de server/.env (puerto $PUERTO_DB). Me detengo." >&2
  exit 1
fi
for _ in $(seq 1 30); do nc -z localhost "$PUERTO_DB" 2>/dev/null && break; sleep 1; done
echo "Base de test en localhost:$PUERTO_DB"

# Exportadas, ganan sobre server/.env (dotenv no pisa variables ya definidas) y las heredan los
# servidores que levanta Playwright.
export DATABASE_URL="$URL_DB"
export PG_POOL_MAX=1
export SESSION_SECRET="solo-para-el-ambiente-de-test-no-usar-en-produccion"
export CLIENT_ORIGIN="http://localhost:$E2E_CLIENT_PORT"

paso "Migraciones + chequeo de drift + seed (igual que CI)"
npx prisma migrate deploy
npx prisma migrate diff --from-config-datasource --to-schema ./prisma/schema.prisma --exit-code
npx prisma db seed

paso "Servidor: lint, typecheck y pruebas"
npm run lint
npm run typecheck
npm test

paso "Cliente: lint, typecheck y pruebas"
cd "$RAIZ/client"
npm run lint
npx tsc -b --noEmit
npm test

if [ "$E2E" = 1 ]; then
  paso "E2E (Playwright) contra la base de test"
  cd "$RAIZ/e2e"
  PW_CHANNEL="${PW_CHANNEL:-chrome}" npx playwright test --reporter=line
fi

paso "Todo verde ✅"
