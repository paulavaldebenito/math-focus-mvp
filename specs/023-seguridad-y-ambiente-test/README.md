# 023 · Revisión de seguridad y ambiente de test aislado

**Pedido (2026-10-28):** hacer una prueba end-to-end, una prueba de seguridad del código y de
condiciones conocidas, y armar un ambiente de test.

## Ambiente de test: `scripts/ambiente-test.sh`

El script crea una base Postgres **nueva y vacía** (`prisma dev --name eureka-test`), separada
de la base de desarrollo, y corre sobre ella lo mismo que CI:

1. Migraciones (`migrate deploy`), chequeo de drift contra el esquema y seed.
2. Servidor: lint, typecheck y pruebas.
3. Cliente: lint, typecheck y pruebas.
4. E2E con Playwright. El servidor y el cliente corren en **puertos propios** (4200 y 5273),
   así que funciona con un `npm run dev` abierto sin reutilizarlo ni tocar la base de desarrollo.
5. Al final apaga la base de test.

Opciones: `--sin-e2e` (más rápido) y `--dejar` (deja la base corriendo para inspeccionarla).

Tiene dos protecciones:

- Lee la dirección real de la base que imprime `prisma dev`, porque esa herramienta ignora el
  puerto que se le pide.
- Se detiene si esa dirección coincide con la de `server/.env`, para no correr nunca
  migraciones, seed ni pruebas sobre la base de desarrollo.

Para que esto funcione, `e2e/playwright.config.ts` acepta ahora `E2E_SERVER_PORT`,
`E2E_CLIENT_PORT` y `E2E_AISLADO`. Si no se definen, todo sigue igual que antes: 4100/5173 y
reutiliza el `npm run dev` abierto.

## Revisión de seguridad

### Chequeos automáticos

| Chequeo | Resultado |
|---|---|
| `npm audit` del cliente, dependencias de producción | ✅ 0 vulnerabilidades |
| `npm audit` del servidor, dependencias de producción | ⚠️ 4 avisos dentro de Prisma 7.9.1: `mysql2`, que no se usa, y `deepmerge-ts`, que solo usa el CLI. Ver specs/021. |
| Secretos en el historial de git (claves AWS, llaves privadas, tokens) | ✅ ninguno |
| `.env` o llaves versionados alguna vez | ✅ nunca |
| Cuentas con contraseña conocida en el seed | ✅ no hay. `demo:colegio` las crea, pero se niega a correr con `NODE_ENV=production`. |

### Revisión manual (OWASP)

| Área | Resultado |
|---|---|
| Control de acceso | ✅ Las 51 rutas exigen sesión, salvo registro, login y logout. Toda ruta de un niño o de una sesión pasa por `getOwnedChild`/`getOwnedSession`. Las de un curso pasan por `classroomAccess`, y las de dirección, por el rol. Ya había pruebas de acceso cruzado (IDOR). |
| Inyección SQL | ✅ No hay SQL escrito a mano (`$queryRaw`); todo pasa por Prisma. |
| XSS | ✅ El cliente no usa `dangerouslySetInnerHTML`, `innerHTML` ni `eval`. React escapa el texto. |
| Contraseñas | ✅ scrypt con sal aleatoria y comparación de tiempo constante. |
| Sesión | ✅ Cookie `httpOnly` y `sameSite: lax`; `secure` en producción. Se regenera al iniciar sesión (contra fijación de sesión) y se destruye al salir. Desde specs/021 se guarda en Postgres. |
| CSRF | ✅ `sameSite: lax` impide mandar la cookie en un POST desde otro sitio. Además, la API solo lee JSON, y CORS solo permite `CLIENT_ORIGIN`. |
| Validación de datos | ✅ Todo pasa por zod, y los esquemas sensibles usan `.strict()`. |
| Fuerza bruta | ✅ Límite de intentos en producción (specs/021). El PIN familiar se bloquea tras varios intentos fallidos. |
| Errores | ✅ Nunca se envían al cliente el mensaje ni el stack de un error interno. |
| `localStorage` | ✅ Solo guarda el idioma y si el sonido está apagado; ningún dato personal. |

### Hallazgos corregidos

| # | Hallazgo | Riesgo | Corrección |
|---|---|---|---|
| S1 | No había cabeceras de seguridad, y la respuesta delataba `X-Powered-By: Express`. | Medio | `helmet`: nosniff, `X-Frame-Options` y `frame-ancestors` contra clickjacking, HSTS, `Referrer-Policy` y CSP. |
| S2 | Un JSON mal formado o un cuerpo sobre 100 KB respondían **500** y llenaban el log de errores. | Bajo | Ahora responden 400 `invalid_body` o 413 `payload_too_large`. |
| S3 | La contraseña no tenía largo máximo. Se aceptó una de 90 KB, y scrypt (síncrono) bloquea el servidor mientras la procesa. | Medio | Máximo de 128 caracteres en registro, login y cambio de PIN familiar. |

Todos quedaron cubiertos por `server/src/routes/__tests__/security.integration.test.ts`:
cabeceras, 400, 413, contraseña larga, rutas sin sesión y login sin revelar si el correo existe.

### Riesgos aceptados (documentados, sin cambio)

- **El registro revela si un correo ya tiene cuenta** (409 `email_already_registered`). La
  pantalla lo necesita para decir «inicia sesión», y el registro tiene límite de intentos en
  producción. Cerrarlo exigiría confirmar el correo por email.
- **Los límites de intentos viven en la memoria del proceso.** Con varias instancias, cada una
  cuenta por separado.
- **Las cabeceras del cliente:** cuando el cliente se sirva desde S3/CloudFront, hay que poner
  las mismas cabeceras (HSTS, nosniff, frame-ancestors y CSP) en una *response headers policy*
  de CloudFront. `helmet` solo cubre la API.

### Condiciones para el despliegue (desde specs/021)

`trust proxy` y cookie `secure` en producción, un `SESSION_SECRET` propio de al menos 32
caracteres, `CLIENT_ORIGIN` obligatorio, secretos en Secrets Manager, respaldos de RDS y la
revisión legal (Ley 21.719) antes de abrir a usuarios reales.
