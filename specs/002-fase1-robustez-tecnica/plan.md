# Plan técnico — Fase 1: Robustez técnica

**Última revisión:** 2026-08-13

## 1. CI

`.github/workflows/ci.yml`, dos jobs independientes (`client`, `server`), en paralelo:

- **client:** `npm ci` → `npm run lint` → `npm run typecheck` → `npm test`.
- **server:** igual, más un servicio `postgres:16` real (no `prisma dev`/pglite — evita la
  limitación de base sombra documentada en `server/prisma.config.ts`) y, antes de los tests,
  `npx prisma migrate deploy` + `npx prisma db seed`.

Node 22 fijado en ambos jobs (versión usada en desarrollo local). Corre en `push` a `main` y en
todo `pull_request`.

**Sin validar contra Docker local** (no disponible en este entorno) — la primera corrida real en
GitHub Actions es la validación de punta a punta; si falla, revisar primero permisos del servicio
Postgres y que `DATABASE_URL` en el job coincida con el puerto expuesto (`5432`).

## 2. Migraciones automatizadas

Ya cubierto por el job de servidor en CI: si alguien cambia `schema.prisma` sin generar la
migración correspondiente, `prisma migrate deploy` no falla (deploy solo aplica lo que existe en
`migrations/`), así que el chequeo real es **drift**, no ausencia de migración. Agregar un paso
`prisma migrate diff --from-config-datasource --to-schema ./prisma/schema.prisma --exit-code`
después del deploy: sale con código 2 si el schema y la DB migrada difieren, lo que en CI se
traduce en un job rojo — señal de que falta commitear una migración.

## 3. Pruebas E2E

Candidato: Playwright (levanta cliente + servidor reales, sin mocks de red). Cubre el recorrido de
`specs/001-mvp-regulado/spec.md` como flujo único, no endpoint por endpoint. Requiere:

- Un modo de arranque conjunto (cliente en :5173, servidor en :4100, Postgres de test) — hoy no
  existe un script `dev:full` a nivel de repo (sí existe patrón similar en el proyecto hermano
  `math-focus-app/`, revisar antes de reinventarlo).
- Aislar el estado entre corridas (reset de DB o datos con prefijo desechable) para que E2E no
  choque con los tests de integración que ya usan la misma base.

## 4. Seguridad de sesiones

Auditar `server/src/auth/session.ts` contra: `httpOnly` (ya presente), `Secure` (debe activarse
condicionalmente — en local sobre HTTP no aplica, sí en cualquier despliegue real), `SameSite`
(`Lax` o `Strict` según si hay flujos cross-site legítimos), expiración explícita, y que el login
emita una cookie/ID de sesión nuevo en vez de reutilizar uno previo (mitiga fijación de sesión).

## 5. Control de acceso

Revisar cada ruta bajo `/api/children/:childId/...` y `/api/sessions/:sessionId/...`
(`server/src/routes/*.ts`) para confirmar que además de `requireAuth` hay una verificación de
pertenencia — que el `childId`/`sessionId` de la URL realmente cuelga del `adultUserId` de la
sesión activa. Si falta en alguna ruta, es una vulnerabilidad IDOR real, no teórica: cualquier
adulto autenticado podría leer o escribir datos de un niño ajeno adivinando o enumerando IDs.
Formalizar el patrón como un middleware reusable (`server/src/routes/childAccess.ts` ya existe —
confirmar que todas las rutas lo usan, no solo algunas).

## 6. Errores y reintentos

- **Servidor:** formato de error consistente (`{ error: { code, message } }` o similar) en vez de
  mensajes ad hoc por ruta.
- **Cliente:** qué pasa cuando `POST /api/sessions/:id/attempts` falla a mitad de una sesión de
  práctica — hoy no hay reintento ni indicación visible al niño/adulto. Definir: reintento
  automático con backoff corto para fallos de red transitorios, y un estado de error visible (no
  silencioso) si el reintento también falla.
