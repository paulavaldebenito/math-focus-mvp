#!/usr/bin/env bash
# Sube un paquete de la API a Elastic Beanstalk y lo despliega (specs/025).
#
#   scripts/desplegar-api.sh .despliegue/eureka-api-<versión>.zip
#   scripts/desplegar-api.sh --version <etiqueta-ya-subida>     # volver a una versión anterior
#
# CAMBIA RECURSOS EN AWS (perfil `eureka`, sa-east-1): pide confirmación antes de hacerlo.
# En el despliegue, la instancia líder corre las migraciones y el seed del banco
# (infra/beanstalk/scripts-eb/migrar-y-sembrar.sh); si fallan, EB cancela y sigue la versión
# anterior. Volver a una versión anterior NO deshace migraciones: ver «Volver atrás» en specs/025.
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-eureka}" AWS_REGION="${AWS_REGION:-sa-east-1}"
PILA="${PILA:-eureka}"
APP="eureka"
ENTORNO="eureka-api"
CUENTA_ESPERADA="034726292734"

if [ "$(aws sts get-caller-identity --query Account --output text)" != "$CUENTA_ESPERADA" ]; then
  echo "El perfil $AWS_PROFILE no apunta a la cuenta $CUENTA_ESPERADA. Me detengo." >&2
  exit 1
fi

salida() {
  aws cloudformation describe-stacks --stack-name "$PILA" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

if [ "${1:-}" = "--version" ]; then
  ETIQUETA="${2:?Falta la etiqueta de versión}"
  aws elasticbeanstalk describe-application-versions --application-name "$APP" --version-labels "$ETIQUETA" \
    --query 'ApplicationVersions[0].VersionLabel' --output text | grep -qx "$ETIQUETA" || {
    echo "No existe la versión $ETIQUETA." >&2
    exit 1
  }
  SUBIR=0
else
  ZIP="${1:?Uso: scripts/desplegar-api.sh <zip> | --version <etiqueta>}"
  test -f "$ZIP" || { echo "No existe $ZIP" >&2; exit 1; }
  ETIQUETA="$(basename "$ZIP" .zip | sed 's/^eureka-api-//')"
  SUBIR=1
fi

ACTUAL="$(aws elasticbeanstalk describe-environments --environment-names "$ENTORNO" \
  --query 'Environments[0].VersionLabel' --output text)"
echo "Entorno $ENTORNO: versión actual «$ACTUAL» → nueva «$ETIQUETA»."
read -r -p "¿Desplegar? Escribe «si» para continuar: " RESPUESTA
[ "$RESPUESTA" = "si" ] || { echo "Cancelado."; exit 1; }

if [ "$SUBIR" = 1 ]; then
  BUCKET="$(salida BucketVersionesApi)"
  CLAVE="eureka-api-$ETIQUETA.zip"
  aws s3 cp "$ZIP" "s3://$BUCKET/$CLAVE"
  aws elasticbeanstalk create-application-version --application-name "$APP" --version-label "$ETIQUETA" \
    --description "$(git log -1 --format='%h %s' 2>/dev/null | cut -c1-200)" \
    --source-bundle "S3Bucket=$BUCKET,S3Key=$CLAVE" --process >/dev/null
  # --process valida el zip antes de desplegarlo.
  for _ in $(seq 1 30); do
    ESTADO="$(aws elasticbeanstalk describe-application-versions --application-name "$APP" \
      --version-labels "$ETIQUETA" --query 'ApplicationVersions[0].Status' --output text)"
    [ "$ESTADO" = "PROCESSED" ] && break
    [ "$ESTADO" = "FAILED" ] && { echo "EB rechazó el paquete." >&2; exit 1; }
    sleep 2
  done
fi

aws elasticbeanstalk update-environment --environment-name "$ENTORNO" --version-label "$ETIQUETA" >/dev/null
echo "Desplegando… (la primera vez, con el seed completo del banco, puede tardar varios minutos)"
aws elasticbeanstalk wait environment-updated --environment-names "$ENTORNO"

aws elasticbeanstalk describe-environments --environment-names "$ENTORNO" \
  --query 'Environments[0].[VersionLabel,Status,Health,HealthStatus]' --output text
DESPLEGADA="$(aws elasticbeanstalk describe-environments --environment-names "$ENTORNO" \
  --query 'Environments[0].VersionLabel' --output text)"
if [ "$DESPLEGADA" != "$ETIQUETA" ]; then
  echo "El despliegue falló y quedó la versión $DESPLEGADA. Eventos recientes:" >&2
  aws elasticbeanstalk describe-events --environment-name "$ENTORNO" --max-items 15 \
    --query 'Events[].[EventDate,Severity,Message]' --output text >&2
  exit 1
fi
echo "Listo. Comprueba: curl -s https://app.eurekalatam.com/api/health/db"
