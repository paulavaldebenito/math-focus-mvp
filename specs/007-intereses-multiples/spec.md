# Spec — Más intereses, elección múltiple y preguntas temáticas

**Estado:** implementado · **Fecha:** 2026-09-28

## Decisión de alcance

El usuario pidió sumar más intereses, permitir elegir varios y que "gran parte" de las preguntas
estén relacionadas con los intereses del niño. Antes cada niño tenía **un** interés (fútbol,
animales o música) que solo se guardaba: nunca se mostraba ni se podía cambiar, y solo 27
ejercicios de 525 tenían versión temática (toda en suma/resta de 1° y 2°). Decisiones tomadas con
el usuario:

- **10 intereses:** `futbol, animales, musica, videojuegos, espacio, dinosaurios, cocina,
  naturaleza, deportes, vehiculos` (Fútbol, Animales, Música, Videojuegos, Espacio y planetas,
  Dinosaurios, Cocina y repostería, Naturaleza y mar, Otros deportes, Vehículos).
- **Elegir de 1 a 3** intereses (`MAX_INTERESTS = 3`), y poder cambiarlos después desde Inicio.
- **~70 % de las preguntas temáticas** cuando existan variantes para el interés; el resto es
  contenido neutro, que además sirve de respaldo cuando no hay tema disponible.

## Resultado

| Interés | 1° | 2° | 3° | 4° | 5° | 6° | Total |
|---|---|---|---|---|---|---|---|
| futbol | 64 | 40 | 41 | 33 | 31 | 30 | 239 |
| animales | 60 | 50 | 23 | 20 | 15 | 17 | 185 |
| musica | 57 | 39 | 30 | 23 | 20 | 25 | 194 |
| videojuegos | 58 | 22 | 27 | 24 | 21 | 21 | 173 |
| espacio | 47 | 30 | 41 | 31 | 21 | 41 | 211 |
| dinosaurios | 55 | 33 | 28 | 24 | 21 | 16 | 177 |
| cocina | 59 | 48 | 57 | 35 | 30 | 33 | 262 |
| naturaleza | 53 | 46 | 65 | 37 | 41 | 35 | 277 |
| deportes | 33 | 27 | 28 | 31 | 20 | 28 | 167 |
| vehiculos | 35 | 25 | 33 | 22 | 17 | 26 | 158 |
| **Total** | **521** | **360** | **373** | **280** | **237** | **272** | **2.043** |

Sumado al banco neutro (525 ejercicios), el banco completo queda en **2.568 ejercicios**.

**Proporción temática medida** (simulando sesiones de 12 preguntas con la misma lógica de
selección del servidor, 20 combinaciones de 1–3 intereses × 300 sesiones cada una,
`prisma/seed/check.ts simulate <curso>`):

| Curso | 1° | 2° | 3° | 4° | 5° | 6° |
|---|---|---|---|---|---|---|
| % temático promedio | 70 % | 69 % | 68 % | 67 % | 66 % | 70 % |
| mínimo observado | 69 % | 63 % | 60 % | 54 % | 45 % | 67 % |

El promedio general está pegado a la meta de 70 %. El mínimo baja cuando el niño elige un solo
interés con poca cobertura en ese curso (p. ej. "música" sola en 5°, con solo 20 variantes): ahí
el respaldo neutro entra más seguido, pero la sesión **nunca se bloquea** — es la garantía de
diseño, no un error.

## Cómo se produjo

### Modelo y selección (servidor)

- `ChildProfile.interest String?` → `interests String[] @default([])` (migración con backfill:
  `UPDATE ... SET interests = ARRAY[interest]`). `Exercise.baseKey String?` nueva: agrupa un
  ejercicio base con todas sus variantes temáticas del mismo problema.
- `domain/interests.ts`: 10 claves + `MAX_INTERESTS = 3`. `PATCH /children/:id/interests` reemplazó
  a `PATCH /children/:id/interest`, validando 1–3 claves sin repetidos.
- `server/src/exercises/select.ts` (nuevo, con pruebas unitarias de `rng` fijo):
  `allowedThemeWhere` (neutro o de los intereses del niño, **nunca** de un tema ajeno),
  `notAttemptedWhere` (excluye lo ya respondido y cualquier variante del mismo `baseKey`, para no
  repetir el mismo problema con otra historia), y `pickExercise` (70 % temático cuando el pool
  tiene, reparte parejo entre los intereses presentes, nunca entre ejercicios — así un interés con
  más variantes no tapa a los demás). `sessions.ts` (próximo ejercicio) e `initialAssessment.ts`
  (evaluación inicial, un ejercicio por `baseKey`) usan el mismo módulo.

### Contenido: variantes ligadas al ejercicio base

Formato en `server/prisma/seed/themes/<interés>.ts`: cada variante da `grade`, `skill`, el
`base` (prompt neutro exacto) y solo la historia nueva (`prompt`, `promptEn`, `procedureNote`,
`procedureNoteEn`, `emoji?`). `themes/lib.ts` (`withThemes`) copia del base las opciones, la
respuesta correcta, los tipos de error y el nivel — **la matemática queda garantizada por
construcción**, quien escribe una variante solo reescribe la historia. Valida además: base
existente, mismos números en el enunciado (ES y EN, comparando dígitos), prompt único, y que la
pista no revele la respuesta. `check.ts` se amplió con `bases <curso>` (lista los ejercicios
re-temables para que un agente sepa qué escribir), `coverage` (tabla interés × curso) y
`simulate <curso>` (proporción temática medida).

**Diez agentes** (`.claude/agents/variantes-tematicas.md`), uno por interés, escribieron sus
archivos en paralelo con vocabulario y reglas de seguridad propias (apto para niños, sin
violencia/apuestas/marcas/personajes reales). Se detectaron y corrigieron a mano tras la
validación: un paréntesis sin cerrar (fútbol), tres casos de números que no coincidían con el
base por una palabra reescrita en vez de mantenerse como dígito, y dos coincidencias de historia
idéntica entre dos temas distintos para el mismo problema (fútbol/deportes) — se reescribió uno
de los dos. El agente de videojuegos se cortó por un límite de sesión tras escribir solo 1°
básico (58 variantes); el resto (2° a 6°, 115 variantes) se completó a mano siguiendo el mismo
formato y vocabulario.

### Cliente

- `lib/interests.ts`: los 10 intereses (emoji, color, es/en) y `MAX_INTERESTS`.
- `ChooseInterestScreen`: selección múltiple con `aria-pressed`, contador "n/3", las tarjetas no
  elegidas se deshabilitan al llegar a 3, "¡Listo, empezar!" exige al menos 1; recibe `initial`
  (para editar) y entrega la selección a `onDone`.
- Botón **"Cambiar mis intereses"** en Home lleva a la misma pantalla con lo elegido marcado y
  vuelve a Home al terminar — antes no había forma de corregir la elección.
- `api/types.ts`, `api/endpoints.ts` (`setInterests`) y `lib/i18n.ts` (es/en) actualizados.

## Fuera de alcance y pendientes

- **Revisión docente/de redacción de las variantes.** Se verificó estructura, números y
  seguridad automáticamente (`check.ts`) y con las reglas de los agentes, pero no hubo una
  revisión humana de naturalidad del texto como la que sí tuvo el banco neutro (spec 006).
- **Visuales nuevos:** las variantes de 1°–2° con visual solo cambian el emoji del ya existente
  (`combine`/`takeaway`/`compare`); no hay visuales específicos por interés.
- **Cobertura pareja por interés:** "vehiculos" y "deportes" quedaron con menos variantes
  (158–167) que "naturaleza" o "cocina" (262–277) porque no todos los contenidos de cada curso se
  prestan igual de bien a esas historias (geometría/fracciones puras, donde el objeto es parte del
  concepto, se dejaron sin tematizar).
- **El motor adaptativo sigue sin usar el interés** — el nivel de dificultad se decide solo por
  las reglas de `adaptiveEngine.ts`; el interés únicamente cambia qué historia cuenta el
  ejercicio, no su dificultad.
- Intereses personalizados escritos por el niño, e intereses que cambien la mascota, quedan fuera.
