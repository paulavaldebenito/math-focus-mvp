# Plan técnico — Math Focus MVP v1

**Estado:** implementado · **Última revisión:** 2026-08-13

> Reconstruido retroactivamente a partir del código y el historial de commits — describe cómo se
> construyó lo que pide `spec.md`, para que decisiones de arquitectura no vivan solo en el código.

## Stack

| Capa | Tecnología |
|------|-----------|
| Cliente | React 19 + TypeScript + Vite 8, sin router externo (orquestación de pantallas a mano en `App.tsx`) |
| Servidor | Node + TypeScript + Express 5 |
| Base de datos | PostgreSQL vía Prisma 7, sesión httpOnly propia (sin librería de auth externa) |
| Tests | Vitest en ambos paquetes; integración de servidor contra Postgres real, no mocks |
| Lint | oxlint (cliente y servidor) |

## Arquitectura

Dos paquetes independientes (`client/`, `server/`), sin monorepo tooling — cada uno con su propio
`package.json`, tests y lint. El cliente habla con el servidor por `fetch` contra una API tipada
(`client/src/api/`); no hay SSR ni BFF intermedio. La autenticación es una cookie de sesión
httpOnly emitida por el servidor (`server/src/auth/session.ts`); el cliente nunca ve ni maneja un
token directamente.

## Modelo de datos

14 modelos Prisma, agrupados por dominio:

- **Identidad y consentimiento:** `AdultUser`, `Consent`, `ChildProfile`.
- **Banco de ejercicios:** `MathSkill`, `Exercise`, `ExerciseOption`, `ErrorType`.
- **Sesión y motor adaptativo:** `Session`, `Attempt`, `Hint`, `PauseEvent`, `AdaptiveDecision`.
- **Progreso y gamificación:** `StarEvent`, `ProgressSnapshot`.

## Motor adaptativo (`server/src/adaptive/adaptiveEngine.ts`)

Reglas deterministas y explícitas, no un modelo de ML: cada intento actualiza el nivel de
dificultad (1–3) según reglas fijas (aciertos consecutivos sube, errores consecutivos o uso
repetido de pistas baja). Cada cambio queda persistido en `AdaptiveDecision` con `ruleCode`,
`reason`, `previousLevel` y `newLevel` — auditable sin necesidad de leer código.

## Superficie de API

Ver `server/src/index.ts` para los prefijos de montaje. Resumen por dominio:

- `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- `POST /api/consent`
- `GET|POST /api/children`, `PATCH /api/children/:childId/companion`
- `GET /api/children/:childId/initial-assessment`, `POST .../attempts`
- `POST /api/children/:childId/sessions`, `GET /api/children/:childId/next-exercise`
- `GET /api/children/:childId/home`, `GET /api/children/:childId/progress`
- `POST /api/sessions/:sessionId/attempts|pause-events|complete`
- `GET /api/health`

## Secuencia de fases (cómo se construyó)

| Fase | Objetivo |
|------|----------|
| T0 | Estructura inicial del monorepo (client/server) + Postgres local vía `prisma dev` |
| T1 | Modelo de datos completo (identidad → banco de ejercicios → sesión/motor adaptativo) |
| T2 | Identidad: registro, login, sesión httpOnly |
| T3 | Perfil infantil: creación + evaluación inicial con calibración |
| T4 | Motor adaptativo determinista + sesión de práctica conectada a él |
| T5 | Cliente base: API tipada, contexto de auth, y las 6 pantallas del recorrido |
| T6 | Panel familiar de progreso |
| T7 (implícito) | Gamificación: estrellas, compañero, resumen de inicio |
| Fase 5 | Estabilización: lint limpio, corrige sesiones duplicadas por doble efecto en React |
| Fase D | Experiencia infantil completa: rediseño visual, i18n ES/EN, voz, mascota, pausas curadas, banco ampliado de 6 a 24 ejercicios |

`T7` no tiene un commit con ese prefijo explícito — el tag aparece solo en
`stars-companion-home.integration.test.ts`; la funcionalidad se integró dentro de Fase D.

## Estrategia de testing

- **Servidor:** Vitest con `fileParallelism: false` — los tests de integración comparten la misma
  base Postgres local, así que corren en serie para evitar condiciones de carrera sobre las mismas
  tablas. `exclude: ["dist/**", "node_modules/**"]` evita correr dos veces el mismo test (fix
  2026-08-13, ver `tasks.md`).
- **Cliente:** Vitest + Testing Library, sin red real (mocks a nivel de `fetch`).
- Sin mocks de base de datos en el servidor — las pruebas de integración corren contra Postgres
  real para no repetir el incidente típico de "mock verde, prod roto".

## Entorno local

1. `npx prisma dev --name mathfocus` — levanta Postgres local (el puerto cambia en cada arranque;
   actualizar `DATABASE_URL` en `server/.env`).
2. `npx prisma migrate deploy` — aplica la migración consolidada (`20260814020444_esquema_completo`,
   ver `tasks.md` para el contexto de por qué antes esto dejaba tablas afuera).
3. `npx prisma db seed` — siembra tipos de error y banco de ejercicios ficticio.
4. `npm test` en `client/` y en `server/`.

## Deuda técnica abierta

- **Sin CI:** no hay `.github/workflows`; nada bloquea un merge con lint, typecheck o tests rotos.
  Próximo paso natural: workflow que corra los tres en cada push/PR sobre `client/` y `server/`.
- **`prisma migrate dev` no funciona en este entorno:** `prisma dev` replica DDL entre bases del
  mismo servidor vía su WAL interno, lo que rompe el aislamiento que la base sombra de
  `migrate dev` necesita (documentado en `server/prisma.config.ts`). Los cambios de schema se
  iteran con `prisma db push` y se convierten a migración con
  `prisma migrate diff --from-empty --to-schema ... --script` cuando toca congelar el historial.
