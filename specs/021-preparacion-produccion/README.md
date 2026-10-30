# 021 · Preparar la app para publicarla en AWS

**Pedido (2026-10-27):** «arreglemos la app antes de publicarla». Va antes del despliegue en AWS
(proyecto EurekaLatam, Región **sa-east-1**). En este spec no se crea ningún recurso en la nube.

**Contexto AWS (2026-10-27):** App Runner, el servicio del plan original, **no existe en
sa-east-1**. Además, el proyecto todavía no tiene servicios habilitados (RDS, ECS y Lightsail
responden «subscription required»), porque los créditos están pendientes. La arquitectura
propuesta es Elastic Beanstalk (Node.js, sin Docker) + RDS Postgres + S3/CloudFront. Falta que
la apruebe la dueña del proyecto.

## Qué cambió

1. **Sesiones de login en Postgres.** Antes se guardaban en memoria del proceso
   (`MemoryStore`): cada reinicio o despliegue cerraba la sesión de todas las familias, y no se
   podía correr más de una instancia. Ahora viven en la tabla `http_session` (migración
   `20261027180000_sesiones_http`, solo agrega esa tabla), a través de
   `PrismaSessionStore` (`server/src/auth/sessionStore.ts`). El bloqueo por intentos fallidos
   del PIN familiar está en la sesión, así que ahora también sobrevive a un reinicio. Las
   sesiones vencidas se borran cada 15 minutos.
2. **`trust proxy` en producción.** En AWS, el balanceador o CloudFront recibe la conexión por
   HTTPS y la reenvía al servidor por HTTP. Sin `trust proxy`, Express cree que la conexión no es
   segura, nunca manda la cookie `secure` y nadie puede iniciar sesión. También hace que el
   límite de intentos vea la IP real del cliente.
3. **Límite de intentos por IP** (`server/src/auth/rateLimit.ts`, express-rate-limit):
   - login: 10 intentos cada 15 minutos;
   - registro: 10 por hora;
   - cambio de PIN familiar, que pide la contraseña: 10 cada 15 minutos;
   - códigos de colegio y de curso: 20 cada 15 minutos. El código de colegio da acceso docente
     a datos de niños y tiene 5 caracteres de un alfabeto de 31.

   Al pasar el límite responde `429 {"error":"too_many_attempts"}`, y la pantalla de login
   muestra «Demasiados intentos. Espera unos minutos…». Solo se activa en producción: en local y
   en E2E todo llega desde 127.0.0.1 y la suite registra muchas cuentas seguidas. Se prueba
   aparte en `rateLimit.test.ts`.
4. **Validaciones al arrancar en producción.** Si `NODE_ENV=production`, el servidor no arranca
   cuando `SESSION_SECRET` tiene menos de 32 caracteres o es el de ejemplo, o cuando falta
   `CLIENT_ORIGIN`.
5. **Dependencias.** Se actualizaron `body-parser`, `fast-uri`, `proxy-addr` y `zod` (4.6.7)
   para cerrar avisos de `npm audit`. Quedan 4 avisos dentro de Prisma 7.9.1: `mysql2`, que no
   se usa (la app es Postgres), y `deepmerge-ts`, que solo usa la configuración del CLI. Para
   cerrarlos habría que pasar a Prisma 8, que todavía está en rc.

## Entorno local: `PG_POOL_MAX=1`

`prisma dev` corre sobre PGlite, que es **una sola sesión de Postgres** para todas las
conexiones. Al leer y guardar la sesión en cada petición, empezó a haber consultas simultáneas, y
en PGlite se pisan (`bind message supplies 3 parameters, but prepared statement "" requires 0`):
fallaban entre 5 y 36 pruebas de forma intermitente. Por eso en local el pool usa 1 conexión
(`PG_POOL_MAX=1`, en `.env.example`). En CI y en AWS, que usan Postgres real, no se define.

## Verificación (2026-10-27)

- Servidor: typecheck, lint y 276/276 pruebas, en tres corridas seguidas con `PG_POOL_MAX=1`.
  Cliente: 151/151.
- Prueba nueva `session-store.integration.test.ts`: el login crea la fila en `http_session`,
  `/me` la usa y el logout la borra.
- Arranque con `NODE_ENV=production`: rechaza el secreto de ejemplo, rechaza la falta de
  `CLIENT_ORIGIN` y arranca bien con la configuración correcta (`/api/health` → `{"ok":true}`).

- E2E local: 23/23 (2026-10-28). Dos pruebas, `all-mascots` y `screenshot-tour`, ya fallaban
  antes de estos cambios con una base local con muchos intentos: no sabían responder la ronda
  «detecta el error» y cortaban la evaluación de ubicación a las 10 respuestas (puede llegar a
  15). Ahora usan los helpers compartidos `e2e/tests/helpers/practice.ts`.

## Pendiente para el despliegue

- [ ] Elegir la arquitectura. Propuesta: Elastic Beanstalk + RDS + S3/CloudFront en sa-east-1.
- [ ] Servir cliente y API **desde el mismo dominio**, con CloudFront enviando `/api/*` al
      servidor. Así la cookie `sameSite: "lax"` funciona sin cambios. Si quedan en dominios
      distintos, habría que usar `sameSite: "none"` y revisar CORS.
- [ ] Correr `prisma migrate deploy` en cada despliegue, antes de arrancar el servidor.
- [ ] Guardar los secretos (`SESSION_SECRET`, `DATABASE_URL`) en Secrets Manager o en la
      configuración del entorno, nunca en el repo.
- [ ] Respaldos automáticos de RDS antes de tener datos reales de niños.
- [ ] Revisión legal (Ley 21.719) antes de abrir la app a usuarios reales.
