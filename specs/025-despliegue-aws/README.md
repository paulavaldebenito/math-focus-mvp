# 025 · Despliegue en AWS (sa-east-1)

**Pedido (2026-10-30):** dejar todo listo para publicar Eureka en AWS: arreglos de código para
la topología real, paquetes de despliegue, infraestructura como código, costos y el paso a paso.
**En este spec no se creó ningún recurso en AWS**: solo se hicieron consultas de lectura
(certificados, VPC, precios). Cada comando que crea algo que se paga está marcado con 💲 y
necesita la aprobación de la dueña del proyecto antes de correrlo.

## Arquitectura

```
                       navegador (Chile)
                              │  https://app.eurekalatam.com
                              ▼
            ┌──────────────────────────────────────┐
            │ CloudFront (global)                  │  certificado ACM us-east-1
            │  · cabeceras de seguridad (CSP, HSTS)│  política de cabeceras de respuesta
            │  · /*      → S3 (caché)              │
            │  · /api/*  → ALB (sin caché)         │
            └───────┬───────────────────┬──────────┘
          OAC (firmado)                 │ HTTPS → api-origen.eurekalatam.com
                    ▼                   ▼
   ┌────────────────────────┐  ┌─────────────────────────────────────────────┐
   │ S3 eureka-web-…        │  │ VPC por defecto sa-east-1 (sin NAT Gateway) │
   │ privado, cifrado,      │  │                                             │
   │ con versiones          │  │  ALB :443 (solo desde CloudFront)           │
   └────────────────────────┘  │    │ certificado ACM sa-east-1              │
                               │    ▼ HTTP :80                               │
                               │  EC2 t4g.small (Elastic Beanstalk,          │
                               │  Node.js 22 / AL2023): nginx → node :8080   │
                               │    │ TLS verificado, 5432                   │
                               │    ▼                                        │
                               │  RDS PostgreSQL 17 db.t4g.micro             │
                               │  privado, cifrado, respaldos 7 días         │
                               └─────────────────────────────────────────────┘
      Secrets Manager: clave de la base y SESSION_SECRET → EB las entrega como variables.
```

El navegador ve **un solo sitio**: la web y la API comparten `app.eurekalatam.com`, así la
cookie `mathfocus.sid` (`sameSite: lax`, `secure`) funciona sin cambios y no hace falta CORS.
`api-origen.eurekalatam.com` existe solo para que CloudFront hable con el ALB por HTTPS; el
grupo de seguridad del ALB rechaza a cualquiera que no sea CloudFront.

## Bloqueos de producción encontrados y arreglados

| # | Problema | Arreglo | Prueba |
|---|---|---|---|
| P1 | **Límite de intentos compartido por todo el mundo.** `trust proxy` estaba fijo en 1. Detrás de CloudFront → ALB → nginx hay 3 saltos: Express tomaba la IP del ALB como la del cliente, así que **10 logins fallidos de cualquier persona bloqueaban el login de todas las familias** por 15 minutos. | `TRUST_PROXY_HOPS` (`server/src/lib/proxy.ts`). Por defecto 1, que nunca cree lo que manda el cliente; la plantilla fija 3. Valores raros detienen el arranque. Como el ALB solo acepta a CloudFront, nadie puede inventar el primer salto. | `lib/__tests__/proxy.test.ts`: IP real con 3 saltos, `X-Forwarded-For` inventado ignorado, `req.secure` con `X-Forwarded-Proto`, y el límite cuenta por familia, no por proxy. |
| P2 | El chequeo de salud pasaba por CORS y por el middleware de sesión, y no había forma de comprobar la base. | `GET /api/health` (liviano, antes de CORS y sesión, `no-store`) para el ALB. `GET /api/health/db` hace `SELECT 1` con tiempo máximo de 3 s y responde 503 si falla. El ALB usa el liviano a propósito: si RDS se cae, reemplazar instancias no lo arregla. | `routes/__tests__/health.integration.test.ts` |
| P3 | **Sin apagado ordenado.** EB detiene Node con SIGTERM en cada despliegue: las peticiones en curso (guardar un intento) se cortaban y las conexiones a RDS quedaban colgadas. | `server/src/lib/apagado.ts`: deja de aceptar conexiones, espera las peticiones en curso, cierra el pool y sale; si se cuelga, sale a los 10 s. El ALB espera 20 s al sacar una instancia. | `lib/__tests__/apagado.test.ts` y la verificación del paquete (SIGTERM → código 0). |
| P4 | **RDS exige TLS** (Postgres 15+ trae `rds.force_ssl=1`) y la app no tenía forma de activarlo. Además `DATABASE_URL` tendría que llevar la clave escrita en la configuración de EB. | `server/src/db/conexion.ts`: con `DB_SSL=verificar` cifra y **verifica** el certificado contra los certificados raíz de RDS (incluido el nombre del host). La URL se arma con `DB_HOST`, `DB_USER`… y `DB_PASSWORD`, que llega sola desde Secrets Manager. Sin estas variables todo sigue igual que antes (`DATABASE_URL`). | `db/__tests__/conexion.test.ts` |
| P5 | `dotenv` (importado por `index.ts`) y `tsx` (para el seed) no eran dependencias de producción: `dotenv` llegaba de casualidad, dentro de Prisma. | Las dos pasan a `dependencies`. | La verificación instala con `--omit=dev`. |
| P6 | El seed del banco escribe un reporte en `specs/` y revisa 4.222 imágenes en `client/public`, que no viajan en el paquete de la API. | `prisma/integrar-banco-imagenes.ts` omite esas dos cosas si no existe `client/public`. En el repo corre igual que siempre. | Seed completo desde el paquete. |
| P7 | La conexión a la base esperaba para siempre si la base no respondía. | `connectionTimeoutMillis: 10 s` en el pool. | — |
| P8 | `prisma dev` (versión actual) usa la variable `PORT` de `server/.env` para sus tres puertos y se queda colgado («starting_up»). Rompía `scripts/ambiente-test.sh`. | El script arranca `prisma dev` sin `PORT` y sin leer `server/.env`. | Esta misma corrida del ambiente de test. |

Revisados sin cambios:

- **`PG_POOL_MAX`**: sin definir, `pg` usa 10 por instancia. La plantilla lo fija en 10. Regla:
  `instancias × PG_POOL_MAX + 5 (migraciones, consola) ≤ max_connections`. RDS calcula
  `max_connections` según la memoria: unas 80 en db.t4g.micro (1 GB) y unas 400 en
  db.t4g.medium (4 GB). Piloto: 1 × 10. Prueba de carga: 2 × 20 = 40.
- **CORS / `CLIENT_ORIGIN`**: con un solo dominio el navegador no necesita CORS, pero sigue
  mandando `Origin` en los POST. `CLIENT_ORIGIN=https://app.eurekalatam.com` (obligatoria en
  producción) coincide, así que no estorba y sigue protegiendo si alguien llama la API desde
  otro sitio.
- **Limpieza de sesiones con varias instancias**: cada instancia borra las vencidas cada 15 min
  con `DELETE … WHERE expire < now()`, que usa el índice `http_session_expire_idx`. Si dos
  coinciden, la segunda no encuentra nada. Es correcto e idempotente.

## Secretos: Secrets Manager con «environment secrets» de Elastic Beanstalk

| Opción | A favor | En contra |
|---|---|---|
| Propiedades de entorno de EB en texto | Gratis, simple | La clave queda visible en la consola de EB, en `describe-configuration-settings` y en la plantilla. |
| **Secrets Manager + `aws:elasticbeanstalk:application:environmentsecrets`** ✅ | CloudFormation genera las claves (nadie las ve ni las copia). EB las lee al arrancar cada instancia y las entrega como variables normales: la app no necesita el SDK de AWS. Solo el rol de las instancias puede leerlas. | USD 0,40 por secreto al mes (USD 0,80). Si se cambia una clave, hay que reiniciar el entorno (`restart-app-server`) para que la tome. |
| Secrets Manager leído desde la app con el SDK | Rotación sin reiniciar | Más código y una dependencia más; no hace falta para el piloto. |

Se eligió la segunda: es la más simple que no deja secretos a la vista. Hay dos secretos:

- `SecretoBaseDatos`: JSON `{"username":"eureka","password":…}` (40 caracteres, solo letras y
  números). RDS lo usa como clave maestra; EB entrega `DB_PASSWORD` con la clave del JSON.
- `SecretoSesion`: 64 caracteres, entregado como `SESSION_SECRET` (el servidor exige ≥ 32).

No se activa la rotación automática: rotar la clave de RDS exigiría reiniciar la API en el
mismo momento. Se puede hacer a mano (cambiar el secreto, `modify-db-instance`, reiniciar).

## Migraciones y banco de ejercicios en cada despliegue

`infra/beanstalk/.ebextensions/01-base-de-datos.config` corre
`scripts-eb/migrar-y-sembrar.sh` como `container_command` con **`leader_only: true`**:

1. EB descomprime el paquete en `/var/app/staging` e instala dependencias sin las de desarrollo
   (`prisma` y `tsx` son dependencias normales). Al instalar, Prisma descarga su motor de
   migraciones para Linux ARM: por eso la instancia necesita salida a internet.
2. Solo en la instancia líder: `prisma migrate deploy` y luego el seed del banco.
3. Si cualquiera de los dos falla, el comando sale con error, **EB cancela el despliegue** y la
   versión anterior sigue atendiendo.
4. Recién ahí EB cambia a la versión nueva y reinicia Node.

**¿Por qué `container_commands` y no `.platform/hooks/predeploy`?** Los hooks corren en todas
las instancias; con dos instancias, las dos migrarían a la vez. `leader_only` solo existe en
`container_commands`. Consecuencia: no usar despliegues *Immutable* ni *Traffic splitting* (ahí
no hay líder y las migraciones no correrían). La plantilla solo permite `AllAtOnce` y `Rolling`.

**¿El seed en cada despliegue o una sola vez?** En cada despliegue. Se revisó `prisma/seed.ts`:

- Son upserts idempotentes del banco (tipos de error, habilidades, ejercicios con ids fijos,
  traducciones, pasos resueltos, imágenes, ejercicios retirados). No borra nada.
- **No crea cuentas ni datos de demostración.** Las cuentas de demostración viven en
  `prisma/demo` y las de carga en `prisma/carga`; ninguna de las dos viaja en el paquete, y
  `scripts/empaquetar-api.sh` se detiene si aparecen.
- El banco cambia con el código (las tandas de revisión pedagógica se publican como commits).
  Si el seed fuera un paso aparte, una versión nueva podría llegar sin los ejercicios que
  espera. Así, código y banco llegan juntos o no llega ninguno.
- Costo: en PGlite (una conexión) el seed completo tardó 218 s sobre una base vacía; en RDS
  debería tardar menos. El tiempo máximo de despliegue quedó en 30 min. Se puede apagar con la
  propiedad `SEMBRAR_BANCO=no`.

## Paquetes

- **`scripts/empaquetar-api.sh [--verificar]`** compila en una copia limpia de `server/` (no toca
  el `npm run dev` abierto) y arma `.despliegue/eureka-api-<commit>[-sucio]-<fecha>.zip` con
  `dist/` (incluido el cliente Prisma generado), `package.json`, `package-lock.json`,
  `prisma.config.ts`, el esquema y las migraciones, el seed con sus datos y `src/` (el seed corre
  con `tsx`), los certificados raíz de RDS, `Procfile`, `.ebextensions/` y `scripts-eb/`. Pesa
  unos 2 MB. Con `--verificar` lo descomprime, instala con `npm ci --omit=dev`, levanta una base
  `prisma dev` aislada (`eureka-empaque`, nunca la de desarrollo), corre las migraciones y el
  seed con el mismo script de EB, arranca `node dist/index.js` con `NODE_ENV=production`, llama
  `/api/health` y `/api/health/db`, manda SIGTERM y borra la base.
- **`scripts/construir-web.sh`** compila el cliente en una copia limpia con `VITE_API_URL=`
  (vacía a propósito: `client/.env` la fija en localhost para desarrollo), revisa que no quede
  `localhost` en el resultado y lo deja en `.despliegue/web` (95 MB, casi todo imágenes).
- **`scripts/desplegar-api.sh <zip>`** y **`scripts/publicar-web.sh`**: suben a AWS. Piden
  confirmación, revisan que el perfil sea la cuenta 034726292734 y leen nombres de la pila.

## Cabeceras de seguridad de la web (CloudFront)

La política `CabecerasSeguridadWeb` pone HSTS (2 años), `nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (sin cámara, micrófono,
ubicación ni pagos), `Cross-Origin-Opener-Policy` y esta CSP:

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self';
connect-src 'self'; manifest-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self';
form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

Se revisó contra el build real: `index.html` no tiene scripts ni estilos en línea, el CSS y el
JS no usan `data:` ni `blob:`, Comic Neue sale de `/assets` (@fontsource), las imágenes son del
mismo dominio y los sonidos se generan con WebAudio (sin archivos). Los `style={{…}}` de React se
aplican por CSSOM, que la CSP no bloquea. Prueba en Chrome con la CSP exacta de la plantilla: ver «Verificación». `/api/*` mantiene las cabeceras de `helmet` del servidor.

## Infraestructura como código: `infra/eureka.yaml`

Una sola pila de CloudFormation, desplegada en sa-east-1. CloudFront, su OAC y su política de
cabeceras son globales y se crean desde la misma pila (usa el certificado de us-east-1 por ARN,
que es lo permitido). Sin Lambda@Edge, sin StackSets, sin replicación entre regiones.

| Recurso | Para qué | USD/mes (piloto) |
|---|---|---|
| RDS PostgreSQL 17, db.t4g.micro, Single-AZ | Base de datos | 24,82 |
| RDS almacenamiento 20 GB gp3, cifrado | Datos | 4,38 |
| RDS respaldos automáticos 7 días | Restaurar a cualquier minuto | 0 (gratis hasta el tamaño de la base) |
| EC2 t4g.small (EB, 1 instancia, ARM) | API Node 22 | 19,56 |
| EBS raíz 8 GB gp3 | Disco de la instancia | 1,22 |
| ALB (hora) | HTTPS hacia el origen | 24,82 |
| ALB (LCU, tráfico de piloto) | Uso | ~1 |
| 3 IPv4 públicas (2 del ALB + 1 de la instancia) | Sin NAT Gateway | 10,95 |
| Secrets Manager, 2 secretos | Clave de la base, `SESSION_SECRET` | 0,80 |
| S3 web (95 MB) + paquetes de la API | Archivos | < 0,05 |
| CloudFront (+ política de cabeceras, OAC) | CDN y dominio único | 0 dentro de la capa gratis (1 TB y 10 M de peticiones al mes) |
| CloudWatch Logs (EB y Postgres, 30 días) | Registros | ~0,50 |
| IAM, grupos de seguridad, Elastic Beanstalk | — | 0 |
| **Total** | | **≈ USD 89/mes (≈ USD 2,9 por día)** |

Precios de sa-east-1 obtenidos el 2026-10-30 con `aws pricing get-products` (On-Demand):
RDS db.t4g.micro USD 0,034/h, db.t4g.medium 0,137/h, gp3 RDS 0,219/GB-mes, respaldo extra
0,095/GB-mes; EC2 t4g.micro 0,0134/h, t4g.small 0,0268/h, t4g.medium 0,0536/h, c7g.large
0,1111/h; EBS gp3 0,152/GB-mes; ALB 0,034/h y 0,011/LCU-h; IPv4 pública 0,005/h; Secrets Manager
0,40/secreto; S3 Standard 0,0405/GB; CloudFront Sudamérica 0,110/GB y 0,0220 por 10.000
peticiones HTTPS (fuera de la capa gratis).

### ⚠️ El costo no cabe en el límite de gasto

**Con USD 120 de créditos y un límite de USD 30/mes, esta arquitectura alcanza para ~10 días
por mes** (o ~41 días de créditos). El piso lo ponen tres cosas que se pagan por hora aunque nadie
use la app: RDS (~29), el ALB (~26) y las IPv4 públicas (~11). Si el límite pausa el proyecto al
superarse, la app quedaría caída a mitad de mes. Hay que decidir antes de crear la pila:

1. **Subir el límite durante el piloto** (≈ USD 90/mes) y usar los créditos. Es lo más simple.
2. **Encender solo para probar**: crear la pila, probar, borrarla (≈ USD 3 por día). La base se
   recupera de la instantánea final, pero el primer arranque tarda ~30 min.
3. **Bajar costo dentro de la misma arquitectura**: `TipoInstanciaApi=t4g.micro` (−9,8). Lo
   demás ya está en el mínimo.
4. **Cambiar la arquitectura** (otro spec): quitar el ALB usando un *VPC origin* de CloudFront
   hacia la instancia (−26, pero EB reemplaza instancias y el origen apunta a una instancia
   fija), o Aurora Serverless v2 con pausa automática en vez de RDS fijo (paga solo cuando hay
   uso, con ~15 s de arranque en frío). No se recomiendan sin probarlas antes.

### Prueba de carga de 100 mil (specs/024)

Se cambian parámetros de la misma pila: `ClaseInstanciaBd=db.t4g.medium InstanciasMin=2
InstanciasMax=2 PoliticaDespliegue=Rolling PgPoolMax=20`, más una EC2 c7g.large en la misma
región para el generador (fuera de la pila, se crea y se borra a mano).

| Por hora, sobre el piloto | USD/h |
|---|---|
| RDS db.t4g.medium en vez de micro | +0,103 |
| Segunda instancia t4g.small + su IPv4 | +0,032 |
| ALB: ~15 LCU a 300–500 peticiones/s | +0,16 |
| Generador c7g.large + IPv4 | +0,116 |
| **Subtotal** | **≈ +0,41/h** |

**Una prueba de 4 horas cuesta ≈ USD 2–3** (más los ≈ 0,12/h del piloto) si cabe en la capa
gratis de CloudFront: 2.000 niños ≈ 250 peticiones/s ≈ 0,9 M por hora; 4 horas ≈ 3,6 M de
peticiones, bajo los 10 M gratis. Si la capa gratis ya se gastó: +USD 0,022 por 10.000 → hasta
≈ USD 3/h más. Cambiar la clase de RDS corta la base unos minutos (dos veces: subir y bajar).
Al terminar, volver a los parámetros del piloto y borrar el generador.

## Runbook del primer despliegue

Todos los comandos con `AWS_PROFILE=eureka` y `--region sa-east-1`, desde la raíz del repo.
Leyenda: 🔒 sin costo · 🌐 lo hace la dueña en Lovable (DNS) · 💲 crea recursos que se pagan:
**necesita aprobación**.

0. 🔒 **Antes de todo**: decidir el tema del límite de gasto (arriba) y activar MFA en la cuenta
   raíz (ver «Pendientes»).
1. 🌐 **Validar los certificados.** En Lovable, dos registros CNAME (los pide ACM, no cuestan):

   | Nombre | Valor |
   |---|---|
   | `_a067366918f8cb312a26902224239a51.app` | `_3e61f959e3e9dfdc23e1af8deac817a6.wzccmgtwzk.acm-validations.aws.` |
   | `_88fa170fc9166480c090c3156743d9aa.api-origen` | `_c117d273b2f0bd01070304f1a1917571.wzccmgtwzk.acm-validations.aws.` |

   ✅ Hecho el 2026-10-30: ambos certificados están `ISSUED`. **No borrar estos registros**: ACM
   los usa para renovar cada año. Para revisarlos:
   ```bash
   aws acm describe-certificate --region us-east-1 --certificate-arn arn:aws:acm:us-east-1:034726292734:certificate/85f1b875-7831-4fd0-9ac6-58228fc4481a --query Certificate.Status
   aws acm describe-certificate --region sa-east-1 --certificate-arn arn:aws:acm:sa-east-1:034726292734:certificate/1a76960f-e92f-48c8-b48f-116fd5749984 --query Certificate.Status
   ```
2. 🔒 **Preparar los paquetes** (local):
   ```bash
   caffeinate -dims scripts/empaquetar-api.sh --verificar
   caffeinate -dims scripts/construir-web.sh
   ```
3. 🔒 **Revisar el plan de la pila** (un *change set* no crea recursos):
   ```bash
   aws cloudformation deploy --region sa-east-1 --stack-name eureka \
     --template-file infra/eureka.yaml --capabilities CAPABILITY_IAM --no-execute-changeset
   ```
   Imprime el comando `describe-change-set` para ver la lista de recursos.
4. 💲 **Crear la infraestructura** (~25–35 min: RDS y CloudFront son lo más lento). Desde aquí
   empieza el cobro por hora:
   ```bash
   aws cloudformation deploy --region sa-east-1 --stack-name eureka \
     --template-file infra/eureka.yaml --capabilities CAPABILITY_IAM
   aws cloudformation describe-stacks --region sa-east-1 --stack-name eureka \
     --query 'Stacks[0].Outputs' --output table
   ```
   El entorno de EB nace con la app de ejemplo de AWS; la API real va en el paso 6.
5. 🌐 **DNS de la app**, con los valores de las salidas de la pila:

   | Nombre | Tipo | Valor |
   |---|---|---|
   | `api-origen` | CNAME | `DominioBalanceador` (algo como `awseb-…sa-east-1.elb.amazonaws.com`) |
   | `app` | CNAME | `DominioCloudFront` (algo como `d1abc….cloudfront.net`) |

6. 💲 **Desplegar la API** (sube el zip a S3 y crea la versión; la primera vez siembra el banco
   completo):
   ```bash
   scripts/desplegar-api.sh .despliegue/eureka-api-<versión>.zip
   ```
7. 💲 **Publicar la web** (S3 + invalidación de CloudFront, centavos):
   ```bash
   scripts/publicar-web.sh
   ```
8. 🔒 **Comprobar**:
   ```bash
   curl -s https://app.eurekalatam.com/api/health        # {"ok":true}
   curl -s https://app.eurekalatam.com/api/health/db     # {"ok":true,"db":"ok"}
   curl -sI https://app.eurekalatam.com/ | grep -i -E 'strict-transport|content-security|x-frame'
   curl -s -o /dev/null -w '%{http_code}\n' https://api-origen.eurekalatam.com/api/health  # debe fallar (timeout): el ALB solo acepta a CloudFront
   ```
   Luego, en el navegador: registrarse, crear un perfil, practicar y cerrar sesión; revisar que la
   consola no muestre errores de CSP. **Comprobar `TRUST_PROXY_HOPS`**: equivocarse 10 veces en el
   login desde el wifi de la casa y verificar que desde el 4G del teléfono el login sigue
   funcionando (si también queda bloqueado, el conteo de saltos está mal).

## Publicar una versión nueva

```bash
caffeinate -dims scripts/empaquetar-api.sh --verificar && scripts/desplegar-api.sh .despliegue/eureka-api-<versión>.zip
caffeinate -dims scripts/construir-web.sh && scripts/publicar-web.sh
```

Primero la API, después la web: la web nueva puede usar rutas nuevas de la API, al revés no.
Con una instancia (`AllAtOnce`) hay un corte de ~1 minuto mientras Node reinicia; con dos
(`Rolling`) no hay corte.

**Migraciones compatibles hacia atrás.** Mientras la instancia líder migra, la versión anterior
sigue atendiendo con el esquema nuevo. Cada migración debe funcionar con el código anterior:
agregar columnas opcionales y tablas sí; borrar o renombrar, en dos despliegues (primero el
código deja de usarla, después se borra).

## Volver atrás

- **API**: `scripts/desplegar-api.sh --version <etiqueta-anterior>` (la lista:
  `aws elasticbeanstalk describe-application-versions --application-name eureka --query 'ApplicationVersions[].VersionLabel'`).
  Se guardan las últimas 30. **No deshace migraciones**: por eso tienen que ser compatibles hacia
  atrás. Al volver, el seed corre otra vez con el banco de esa versión: es idempotente, no
  borra lo que la versión nueva agregó.
- **Web**: volver al commit anterior, `scripts/construir-web.sh` y `scripts/publicar-web.sh`. O,
  en una emergencia, restaurar la versión anterior de `index.html` en S3 (el bucket guarda
  versiones 30 días) e invalidar `/*`.
- **Base de datos** (último recurso, pérdida de datos posterior al punto elegido): 💲
  `aws rds restore-db-instance-to-point-in-time` crea una instancia nueva desde cualquier minuto
  de los últimos 7 días; luego se cambia `DB_HOST` del entorno a la nueva y se reinicia. Ensayarlo
  una vez antes de tener usuarios reales.

## Borrar todo

1. 🔒 Quitar la protección de borrado de RDS:
   `aws rds modify-db-instance --db-instance-identifier eureka --no-deletion-protection --apply-immediately`
2. 🔒 Vaciar los buckets `eureka-web-034726292734` y `eureka-api-versiones-034726292734` desde la
   consola de S3 (botón «Vaciar», que también borra las versiones).
3. 🔒 `aws cloudformation delete-stack --region sa-east-1 --stack-name eureka` y
   `aws cloudformation wait stack-delete-complete --region sa-east-1 --stack-name eureka`.
4. Queda una **instantánea final de RDS** (`eureka-snapshot-…`, ≈ USD 1,9/mes por 20 GB): borrarla
   con `aws rds delete-db-snapshot` cuando ya no se necesite. También quedan los grupos de
   CloudWatch Logs de EB y RDS (centavos) y el bucket `elasticbeanstalk-sa-east-1-034726292734`
   que EB crea solo.
5. 🌐 Quitar los CNAME `app` y `api-origen` en Lovable.

## Verificación (2026-10-30)

Nada de esto toca AWS ni la base de desarrollo.

- `scripts/ambiente-test.sh --sin-e2e`: servidor 50 archivos / **300 pruebas** ✅ (lint y tipos
  incluidos); cliente 29 archivos / **151 pruebas** ✅. `client`: `tsc -b --noEmit` ✅.
- `aws cloudformation validate-template` sobre `infra/eureka.yaml` ✅ (solo lectura). La
  plataforma `64bit Amazon Linux 2023 v6.12.0 running Node.js 22` existe en sa-east-1. La
  extracción de una llave JSON del secreto (`…:password`) la admiten las plataformas de EB
  publicadas desde el 13-01-2026, como esta.
- `scripts/empaquetar-api.sh --verificar` ✅: zip de 1,9 MB; `npm ci --omit=dev`; las 21
  migraciones aplicadas sobre una base vacía; seed completo del banco en 228 s (PGlite);
  `NODE_ENV=production` con `TRUST_PROXY_HOPS=3`; `/api/health` → `{"ok":true}`,
  `/api/health/db` → `{"ok":true,"db":"ok"}`; SIGTERM → «Servidor cerrado».
- `scripts/construir-web.sh` ✅: 95 MB, sin `localhost`.
- **CSP**: el build servido con la CSP exacta de la plantilla, en Chrome (`/`, `/login`,
  `/registro`): **0 violaciones**, Comic Neue cargada, imágenes visibles. Solo hubo los 401
  esperados de `/api` (la prueba no tenía API). Queda revisar la consola en el sitio real (paso 8).

## Pendientes

- [ ] **Decidir el límite de gasto** (ver costos). Sin eso, la app se pausaría a mitad de mes.
- [ ] **MFA en la cuenta raíz.** Hoy está apagado y las credenciales del perfil `eureka` son de la
      raíz (`arn:aws:iam::034726292734:root`). Activar MFA antes de crear la pila y, antes de
      usuarios reales, trabajar con un usuario o rol con menos permisos.
- [ ] **Revisión legal (Ley 21.719)** antes de abrir a usuarios reales, incluida la
      **transferencia internacional de datos**: sa-east-1 está en São Paulo, Brasil. Los datos de
      niños (perfiles, intentos, ánimo) y de las familias quedan fuera de Chile. Revisar si basta
      con el consentimiento informado y qué debe decir la política de privacidad.
- [ ] **Límite de intentos en memoria por instancia** (specs/021 y 023). Con 2 instancias el
      límite efectivo se duplica (sigue acotado). Para más instancias, moverlo a Postgres o a
      ElastiCache, o agregar AWS WAF con una regla por IP (≈ USD 6–8/mes).
- [ ] La base usa el usuario maestro para la app y las migraciones. Más adelante: un usuario solo
      de la app, sin permisos de DDL.
- [ ] `prisma migrate deploy` va a RDS con `sslmode=require` (cifra, pero el motor de Prisma no
      verifica el certificado). Va dentro de la VPC y el grupo de RDS solo acepta a la API. La app
      sí verifica (`DB_SSL=verificar`).
- [ ] Ensayar una restauración de RDS a un punto en el tiempo.
- [ ] Alarmas: un presupuesto de AWS Budgets y alarmas de CloudWatch (5xx del ALB, CPU y conexiones
      de RDS, espacio libre) antes de usuarios reales.
