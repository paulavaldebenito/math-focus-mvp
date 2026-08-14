# Tasks — Fase 1: Robustez técnica

**Última revisión:** 2026-08-13

- [x] **1.1 CI** — `.github/workflows/ci.yml`: jobs `client` y `server` (lint + typecheck + test),
      servidor con servicio `postgres:16` real + `migrate deploy` + `seed` antes de los tests.
      Pendiente de primera corrida real en GitHub Actions (no validable con Docker en este entorno).
- [x] **1.2 Migraciones automatizadas** — paso `prisma migrate diff --from-config-datasource
      --to-schema ... --exit-code` agregado al job de servidor en `ci.yml`, después de
      `migrate deploy`. Sintaxis y exit code (0, sin diferencia) validados localmente contra la DB
      real.
- [ ] **1.3 Pruebas E2E** — elegir herramienta (Playwright candidato), definir arranque conjunto
      cliente+servidor+DB de test, cubrir el recorrido completo de `specs/001-mvp-regulado/spec.md`.
- [ ] **1.4 Seguridad de sesiones** — auditar `server/src/auth/session.ts`: flags de cookie
      (`Secure`, `SameSite`), expiración, rotación en login, invalidación en logout.
- [ ] **1.5 Control de acceso** — confirmar que todas las rutas bajo `/api/children/:childId/...`
      y `/api/sessions/:sessionId/...` verifican pertenencia al adulto autenticado, no solo sesión
      válida (riesgo IDOR si falta en alguna).
- [ ] **1.6 Errores y reintentos** — formato de error consistente en el servidor; reintento con
      backoff + estado de error visible en el cliente para fallos de red durante una sesión.

## Notas

- Orden sugerido y razones en `spec.md` ("Cómo se prioriza dentro de la fase").
- 1.1 y 1.2 comparten archivo (`ci.yml`) — conviene resolverlas juntas en el próximo commit sobre
  esta fase.
