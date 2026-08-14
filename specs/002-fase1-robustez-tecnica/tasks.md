# Tasks — Fase 1: Robustez técnica

**Última revisión:** 2026-08-13

- [x] **1.1 CI** — `.github/workflows/ci.yml`: jobs `client` y `server` (lint + typecheck + test),
      servidor con servicio `postgres:16` real + `migrate deploy` + `seed` antes de los tests.
      Corrida real en GitHub Actions: primer intento falló (faltaba `prisma generate` antes del
      typecheck en un checkout limpio — `src/generated/prisma` está gitignored y localmente ya lo
      tenía generado de sesiones anteriores, por eso no se detectó antes). Corregido y verificado
      en verde: https://github.com/paulavaldebenito/math-focus-mvp/actions/runs/31765984262
- [x] **1.2 Migraciones automatizadas** — paso `prisma migrate diff --from-config-datasource
      --to-schema ... --exit-code` agregado al job de servidor en `ci.yml`, después de
      `migrate deploy`. Validado tanto local como en la corrida real de CI enlazada en 1.1.
- [x] **1.3 Pruebas E2E** — Playwright, en `e2e/` (paquete propio, no vive dentro de `client/` ni
      `server/`). `playwright.config.ts` arranca cliente y servidor reales vía `webServer` (array
      de dos entradas) — nada de mocks. Un test (`tests/full-journey.spec.ts`) cubre el recorrido
      completo de `specs/001-mvp-regulado/spec.md`: registro (con auto-login) → consentimiento →
      perfil infantil → elegir compañero → evaluación inicial → sesión de práctica adaptativa
      (incluyendo el camino de pausa ofrecida, si el motor la dispara) → panel familiar.
      Validado localmente con Playwright 1.40 (macOS 12/arm64 de este entorno no soporta los
      binarios de navegador de la versión moderna declarada en `package.json`, `^1.48.0` — CI corre
      en Ubuntu, sin esa limitación): 3/3 corridas en verde, ~6s cada una. Nuevo job `e2e` en
      `ci.yml`: mismo patrón de Postgres real + generate + migrate + seed que el job de servidor,
      más instalación de navegadores y subida del reporte HTML como artefacto en caso de falla.
      Hallazgo real durante la escritura: la evaluación inicial avanza directo entre preguntas (sin
      pantalla de "Continuar" intermedia), a diferencia de la sesión de práctica que sí la tiene —
      un primer intento de reusar la misma función de ayuda para ambas quedó esperando para
      siempre un botón que la evaluación inicial nunca muestra.
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
