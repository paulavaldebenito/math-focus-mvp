# Plan técnico — Expansión a 2° básico

**Última revisión:** 2026-08-14

## Qué cambió

| Archivo | Cambio |
|---------|--------|
| `server/src/auth/schemas.ts` | `childProfileSchema` ahora exige `grade`, validado contra whitelist `SUPPORTED_GRADES = [1, 2]` (no un rango abierto). |
| `server/src/routes/children.ts` | Se quita la constante `MVP_GRADE = 1`; usa `parsed.data.grade` directamente. |
| `server/prisma/seed.ts` | Refactorizado: la lógica de siembra (idempotente por habilidad y por ejercicio) se extrajo a `seedSkill()`, reusada para 1° y 2° básico — antes solo existía inline para 1°. |
| `client/src/screens/CreateChildScreen.tsx` | Selector de curso (mismo patrón `.choice-grid`/`.choice-card` que ya usan `AuthScreen` e `ChooseCompanionScreen`). `Continuar` deshabilitado hasta elegir curso. |
| `client/src/api/endpoints.ts` | `createChild(consentId, displayName, grade)` — nuevo parámetro. |

**Nada cambió** en `sessions.ts` (next-exercise), `initialAssessment.ts`, `progress.ts`,
`adaptiveEngine.ts` ni `initialCalibration.ts` — ya filtraban por `child.grade` en vez de asumir
grade=1, así que 2° básico funciona sin tocarlos. Confirmado antes de escribir código, no
asumido.

## Por qué no hay migración de schema

`ChildProfile.grade` y `MathSkill.grade` ya eran `Int` desde T1.1/T1.2 — el modelo de datos nunca
asumió un solo curso, solo el código de aplicación lo forzaba. Esta expansión es 100% seed de
datos + validación de servidor + UI, cero cambios de schema.

## Verificación curricular

MA02 OA09 se verificó contra `curriculumnacional.mineduc.cl` antes de escribir cualquier
ejercicio (no contra el resumen de trabajo guardado el día anterior, que resultó tener un error —
ver `specs/003-fase2-preparacion-pedagogica/curriculo-mineduc-2-a-6-basico.md`, sección
"Corrección conocida"). Los 12 ejercicios se diseñaron a mano verificando que ningún par
suma/resta requiera reserva (columna de unidades y columna de decenas se resuelven cada una sin
reagrupar).

## Tests agregados/modificados

- `server/src/routes/__tests__/children.integration.test.ts`: reemplaza el test que asumía que el
  servidor ignoraba `grade` del cliente por dos tests — rechaza un curso fuera de la whitelist
  (400) y crea el perfil con el curso elegido (2° básico en este caso, para no duplicar cobertura
  de 1° que ya prueban otros archivos).
- 7 archivos de test de servidor que creaban un perfil infantil como fixture (para probar otra
  cosa) necesitaron agregar `grade: 1` a su body — antes no los tocaba la validación porque el
  campo no existía.
- `server/src/db/__tests__/exercise-bank.integration.test.ts`: las dos aserciones que asumían
  "todo es grade 1" y "ningún oaCode" se actualizaron para reflejar que ahora hay dos grados
  soportados y un oaCode legítimamente verificado.
- `server/src/routes/__tests__/next-exercise.integration.test.ts`: nuevo test — un niño de 2°
  básico recibe ejercicios cuyo `mathSkill.grade` es 2, no el banco de 1°.
- `client/src/screens/CreateChildScreen.test.tsx`: nuevo test de "no permite continuar sin curso"
  + actualiza el test de creación para elegir curso y pasar el parámetro nuevo.
- `client/src/App.test.tsx`: el recorrido de onboarding ahora incluye el click de curso.
- `e2e/tests/full-journey.spec.ts`: mismo ajuste — un click más antes de "Continuar" en el
  perfil infantil. Validado localmente (Playwright 1.40, ver limitación de macOS 12 documentada
  en memoria de sesión) antes de restaurar la versión moderna declarada en `package.json`.

Suite completa tras el cambio: servidor 87 tests, cliente 27 tests, E2E 1/1, lint y typecheck
limpios en ambos paquetes.
