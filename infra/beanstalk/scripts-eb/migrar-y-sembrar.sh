#!/usr/bin/env bash
# Corre en la instancia líder de Elastic Beanstalk en cada despliegue (ver
# .ebextensions/01-base-de-datos.config y specs/025):
#
#   1. `prisma migrate deploy`: aplica las migraciones pendientes, en orden. Nunca borra datos
#      ni usa la base sombra; si una migración falla, sale con error y el despliegue se cancela.
#   2. Seed del banco de ejercicios (prisma/seed.ts): upserts idempotentes de habilidades,
#      ejercicios, traducciones e imágenes. No crea cuentas ni datos de demostración (esos viven
#      en prisma/demo y prisma/carga, que no viajan en el paquete). Se puede apagar con
#      SEMBRAR_BANCO=no en las propiedades del entorno.
#
# También sirve en local contra una base de prueba: con DATABASE_URL definida no lee nada de EB.
set -euo pipefail
cd "$(dirname "$0")/.."

# Las propiedades del entorno y los secretos de Secrets Manager llegan como variables a los
# container_commands. Por si no, se leen con la herramienta de la plataforma.
if [ -z "${DATABASE_URL:-}" ] && [ -z "${DB_HOST:-}" ] && [ -x /opt/elasticbeanstalk/bin/get-config ]; then
  eval "$(/opt/elasticbeanstalk/bin/get-config environment | node scripts-eb/exportar-entorno.cjs)"
fi

if [ -z "${DATABASE_URL:-}" ] && { [ -z "${DB_HOST:-}" ] || [ -z "${DB_PASSWORD:-}" ]; }; then
  echo "Faltan DB_HOST o DB_PASSWORD (¿el secreto de Secrets Manager está configurado?)." >&2
  exit 1
fi
if [ ! -x node_modules/.bin/prisma ] || [ ! -x node_modules/.bin/tsx ]; then
  echo "No están prisma o tsx en node_modules: ¿corrió npm install? Revisa package.json." >&2
  exit 1
fi

echo "== Migraciones (prisma migrate deploy)"
node_modules/.bin/prisma migrate deploy

if [ "${SEMBRAR_BANCO:-si}" = "si" ]; then
  echo "== Banco de ejercicios (prisma/seed.ts, idempotente)"
  inicio=$(date +%s)
  node_modules/.bin/tsx prisma/seed.ts
  echo "Banco sembrado en $(( $(date +%s) - inicio )) s."
else
  echo "== SEMBRAR_BANCO=$SEMBRAR_BANCO: no se siembra el banco."
fi
