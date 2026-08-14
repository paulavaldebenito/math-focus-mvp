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
- [x] **1.4 Seguridad de sesiones** — auditoría de `server/src/auth/session.ts`: `httpOnly`,
      `sameSite: lax`, `secure` en producción y `maxAge` de 7 días ya estaban bien. Encontrado y
      corregido: el login no regeneraba el ID de sesión (fijación de sesión) — ahora
      `req.session.regenerate()` corre antes de autenticar. Test de regresión que reproduce el
      escenario real (cookie ya autenticada de un adulto, reutilizada para loguear a otro en el
      mismo navegador) y falla sin el fix, pasa con él —
      `server/src/routes/__tests__/auth-login.integration.test.ts`.
- [x] **1.5 Control de acceso** — auditadas las 8 rutas bajo `childId`/`sessionId`: todas ya
      verificaban pertenencia al adulto autenticado (`getOwnedChild`, o un chequeo inline
      equivalente en `sessions.ts`). Se factorizó el chequeo inline repetido 3 veces en
      `sessions.ts` a un helper compartido (`getOwnedSession`, en `childAccess.ts`) y se agregó
      `access-control.integration.test.ts`: 11 tests que confirman que un segundo adulto recibe
      404 en cada una de esas 8 rutas al intentar acceder a datos de un hijo ajeno, más un control
      positivo. Sin hallazgos de IDOR real — el código ya era correcto, esto lo deja garantizado
      por test.
- [x] **1.6 Errores y reintentos** — dos hallazgos corregidos:
      - Servidor: no había manejador de errores global; una ruta inexistente o una excepción no
        capturada devolvía la página HTML por defecto de Express en vez de JSON (causa raíz de los
        `SyntaxError: Unexpected token '<'` vistos durante la auditoría de `specs/001-mvp-regulado/`).
        Agregado un fallback 404 y un manejador de errores en `server/src/index.ts`, ambos
        devolviendo `{ error: "..." }` — mismo formato que ya usaba el resto de las rutas, sin
        romper el contrato existente. Test de regresión en `error-handling.integration.test.ts`.
      - Cliente: `submitAttempt` podía fallar a mitad de una sesión de práctica y dejar al niño sin
        salida (solo un mensaje genérico, sin reintento). Agregado reintento automático con backoff
        exponencial en `api/client.ts` para fallos de red (cuando `fetch` mismo falla, nunca cuando
        el servidor sí respondió — evita duplicar una escritura que sí llegó), y un botón "Intentar
        de nuevo" visible en la pantalla de error de `PracticeScreen` para cuando los reintentos
        automáticos se agotan, que reintenta exactamente la última acción que falló (cargar sesión,
        cargar ejercicio, o enviar la respuesta ya seleccionada).
      - **Limitación conocida, no resuelta:** el reintento de red no garantiza exactly-once — si la
        request sí llegó al servidor y solo se perdió la respuesta, un reintento podría duplicar el
        intento registrado. Resolverlo de verdad requiere claves de idempotencia en el servidor;
        fuera de alcance de este pase.

## Notas

- Orden sugerido y razones en `spec.md` ("Cómo se prioriza dentro de la fase").
- 1.1 y 1.2 comparten archivo (`ci.yml`) — conviene resolverlas juntas en el próximo commit sobre
  esta fase.
- Suite completa tras 1.4–1.6: servidor 18 archivos / 85 tests, cliente 10 archivos / 26 tests,
  lint y typecheck limpios en ambos.
