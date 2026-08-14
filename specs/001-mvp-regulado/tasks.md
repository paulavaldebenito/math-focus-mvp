# Tasks — Math Focus MVP v1

**Última revisión:** 2026-08-13

> Historial reconstruido desde `git log` (todas las tareas T0–T6 ya estaban completas antes de
> este documento; se listan aquí para que el registro quede versionado, no solo en mensajes de
> commit). Formato: `[x]` completado con hash y fecha, `[ ]` pendiente.

## Fase 0 — Fundación

- [x] **T0.1** Estructura inicial del MVP, client TS + server TS — `2d7577b` · 2026-08-11
- [x] **T0.2** PostgreSQL local vía `prisma dev` + esquema Prisma inicial vacío — `d7f06c5` · 2026-08-11

## Fase 1 — Modelo de datos

- [x] **T1.1** `AdultUser` / `Consent` / `ChildProfile` + Vitest como suite real — `de3c15a`
- [x] **T1.2** Banco de ejercicios: `MathSkill` / `Exercise` / `ExerciseOption` / `ErrorType` — `ef908c1`
- [x] **T1.3** Modelo completo: `Session`, `Attempt`, `Hint`, `PauseEvent`, `AdaptiveDecision`, `ProgressSnapshot` — `2c5f407`

## Fase 2 — Identidad y consentimiento (HU1, HU2)

- [x] **T2.1** Registro de adulto responsable (`POST /api/auth/register`) — `d6ed334`
- [x] **T2.2** Login + sesión httpOnly (`POST /api/auth/login`, `/logout`, `/me`) — `a7cea34`
- [x] **T2.3** `POST /api/consent` — protegido, ligado al adulto autenticado — `37716a3`

## Fase 3 — Perfil infantil (HU3, HU4)

- [x] **T3.1** `POST /api/children` — perfil infantil con curso fijo en el servidor — `c6d5c34`
- [x] **T3.2** Evaluación inicial breve (GET + POST attempts) con calibración — `fd542fb`

## Fase 4 — Motor adaptativo

- [x] **T4.1** Motor adaptativo determinista (`adaptiveEngine.ts`) — `192f45a`
- [x] **T4.2** Sesión de práctica conectada al motor adaptativo — `38d66e0`
- [x] **T4.3** Nivel de dificultad real en ejercicios + endpoint de siguiente ejercicio + CORS — `2d320b1`

## Fase 5 — Cliente base y recorrido completo

- [x] **T5.1** Base del cliente: API tipada, contexto de auth, Vitest — `38f2d74`
- [x] **T5.2** Pantalla de registro/login del adulto — `6555ff7`
- [x] Backend: `GET /api/children` (listar hijos del adulto autenticado) — `a6aa9da`
- [x] **T5.3 + T5.4** Pantallas de consentimiento y perfil infantil + orquestación — `ee4d59b`
- [x] **T5.5** Pantalla de evaluación inicial — `e7d47d0`
- [x] Backend: registro de pausas activas (`POST /api/sessions/:id/pause-events`) — `e17291f`
- [x] **T5.6** Pantalla de sesión de práctica — recorrido vertical completo — `176095d`

## Fase 6 — Panel familiar

- [x] **T6.1** `GET /api/children/:childId/progress` — panel familiar (backend) — `b65d3b8`
- [x] **T6.2** Pantalla de panel familiar — MVP completo T0–T6 — `a2a6c1d`

## Fase 7 — Gamificación e inicio (sin prefijo de commit formal)

- [x] Estrellas, compañero y resumen de inicio — tag `T7` visible en
      `stars-companion-home.integration.test.ts`; entregado dentro del commit de Fase D.

## Estabilización

- [x] Lint limpio en servidor y cliente — `490501b`
- [x] Corrige sesiones duplicadas por doble invocación de efectos (React) — `3a2dd3e`

## Fase D — Experiencia infantil completa

- [x] Rediseño visual (paleta violeta/teal/dorado), tipografía y botones 3D — `e3f12e4`
- [x] Sistema i18n real ES/EN (interfaz y contenido de ejercicios) con selector desde el registro
- [x] Ejercicios pictóricos con emoji, narrados por voz (con mitigaciones para bugs de Chrome)
- [x] Mascota elegible con reacciones simples durante la sesión
- [x] Sistema de estrellas, racha y pantalla de inicio reales (`StarEvent`, `/home`, `/companion`)
- [x] Pausas de respiración/movimiento curadas para TDAH, ofrecidas antes y durante la sesión,
      nunca bloqueantes
- [x] Evaluación inicial con apertura/cierre cálidos y preguntas rotadas al azar
- [x] Banco de "Números y operaciones" 1° básico ampliado de 6 a 24 ejercicios, verificado
      aritméticamente por script, con distractores clasificados por tipo de error real

## Post-auditoría (developer report + fixes)

- [x] Auditoría de estado: corrida real de la suite completa (94 tests), lint y typecheck en
      ambos paquetes — 2026-08-12/13
- [x] **H1** Detectado: 11 de 14 tablas sin migración committeada (solo T1.1 tenía SQL real;
      T1.2–T6.2 se aplicaron vía `db push` sin congelar historial). Corregido: migración única
      `20260814020444_esquema_completo`, validada de punta a punta (`migrate deploy` sobre DB
      nueva + seed + 72 tests en verde) y baseline aplicado en la DB real sin tocar datos —
      `c4cb535` · 2026-08-13
- [x] **H2** Detectado: Vitest del servidor corría cada test dos veces por recoger también
      `dist/**/*.test.js` compilado. Corregido: `exclude: ["dist/**", "node_modules/**"]` en
      `vitest.config.ts` — `c4cb535` · 2026-08-13

## Backlog (no iniciado)

- [ ] **H3** CI: workflow de GitHub Actions que corra lint + typecheck + tests de `client/` y
      `server/` en cada push/PR.
- [ ] Resolver bug de audio de voz en Chrome/Safari (reproducido en un equipo específico, sin
      causa raíz identificada aún).
- [ ] Construir los otros 4 ejes curriculares de 1° básico (hoy solo existe "Números y operaciones").
- [ ] Función de comunidad (mencionada como fuera de alcance en Fase D).
- [ ] Motor de pausas con auto-reporte del niño.
- [ ] Validar y completar códigos de Objetivo de Aprendizaje (`MathSkill.oaCode`) contra la fuente
      oficial de MINEDUC — hoy quedan `null` a propósito.
