# Plan técnico — Ampliación de 1° básico: MA01 OA04

**Última revisión:** 2026-08-14

## Qué cambió

| Archivo | Cambio |
|---------|--------|
| `client/src/api/types.ts` | `ExerciseVisualDescriptor` gana un tercer miembro: `{ kind: "compare"; a; b; emoji? }`. |
| `client/src/components/ExerciseVisual.tsx` | Nuevo branch de render: dos grupos de emoji separados por "vs" (reusa `.pictorial-row`/`.pictorial-icon`/`.pictorial-op`, sin CSS nuevo). |
| `server/prisma/seed.ts` | Nueva llamada a `seedSkill()` con la habilidad + 12 ejercicios de MA01 OA04. |
| `server/src/db/__tests__/exercise-bank.integration.test.ts` | El mapa de OA verificados pasa a indexarse por nombre de habilidad, no por `grado:eje` — ya no es único ahora que hay dos habilidades en el mismo grado+eje. |

**Nada cambió** en `sessions.ts`, `initialAssessment.ts` ni el motor adaptativo — ya filtraban por
`child.grade`, no por habilidad específica, así que la nueva habilidad entra al mismo pool sin
tocar esas rutas (ver la nota de "efecto secundario" en `spec.md`).

## Diseño de contenido

12 ejercicios, progresión de dificultad:

- **Nivel 1** (4): comparación directa de 2 números con apoyo visual (`compare`), diferencia
  grande entre los números (3 vs 9, 15 vs 6, 8 vs 2, 4 vs 17) — fácil de ver a simple vista.
- **Nivel 2** (4): 2 comparaciones simbólicas sin visual con números más cercanos (11 vs 9, 14 vs
  16) + 2 ejercicios de "elegir el mayor/menor de 3" (5,12,8 y 18,3,10) — la aproximación a
  "ordenar" que permite el formato de opción múltiple.
- **Nivel 3** (4): problemas de contexto ("Ana tiene 8 stickers y Pedro 13, ¿quién tiene más?")
  — la respuesta es un nombre, no un número; el distractor es la otra persona, clasificado
  `comprension_enunciado` (confundir quién tiene más/menos, no un error de cálculo).

## Pistas (aplicando la lección del commit anterior)

Ninguna pista revela la respuesta:

- Nivel 1 (con visual): "Cuenta los dos grupos de objetos — el [mayor/menor] es el que tiene
  [más/menos] objetos." — describe la estrategia de conteo/comparación uno a uno que pide el OA
  oficial (ver indicadores de evaluación en `curriculo-1basico.md`), no resuelve cuál es.
- Nivel 2 (simbólico): "Cuenta desde 1: el número que dices [antes/después] es el [menor/mayor]."
  para pares; "Compara los números de a dos" para grupos de 3 — ninguna nombra el resultado.
- Nivel 3 (contexto): "Cuenta cuánto tiene cada uno y compara" — sin nombrar quién gana.

El test de regresión de la sesión anterior (`ninguna pista de resta revela la respuesta`) queda
acotado a resta por diseño — no se extendió a este contenido nuevo porque ya se diseñó sin el
problema desde el principio, pero valdría la pena generalizarlo si se sigue ampliando el banco.

## Verificación curricular

MA01 OA04 verificado contra su página individual en curriculumnacional.mineduc.cl (no un
resumen) — texto completo e indicadores de evaluación citados en `curriculo-1basico.md`.

## Tests

- `exercise-bank.integration.test.ts`: mapa de OA verificados corregido (indexado por nombre de
  habilidad). Los tests de "una alternativa correcta", "distractor clasificado" e idempotencia ya
  cubrían la nueva habilidad automáticamente por iterar sobre todo el banco.
- Sin tests nuevos de rutas: `next-exercise`/`initial-assessment` ya estaban probadas para
  "cualquier ejercicio de ese grado", que ahora incluye ambas habilidades sin cambiar el
  contrato de la API.

Suite completa: servidor 88 tests, lint y typecheck limpios en cliente y servidor. Seed verificado
idempotente (corrida repetida, 0 duplicados).
