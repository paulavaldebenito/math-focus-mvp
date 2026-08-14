# Spec — Expansión a 2° básico

**Estado:** implementado · **Última revisión:** 2026-08-14

## Decisión de alcance

El usuario pidió explícitamente expandir el MVP más allá de 1° básico. Elegida entre tres
opciones de amplitud, la más chica: **solo el eje Números y Operaciones, empezando por MA02
OA09** (adición y sustracción dentro de 100, sin reserva) — no los 5 ejes de 2° básico completos,
ni los 11 OA de Números y Operaciones de ese curso. Es la continuación directa de lo que 1°
básico ya cubre (adición/sustracción, un paso más de dificultad).

## Alcance

- El adulto elige el curso de su hijo/a (1° o 2° básico) al crear el perfil — antes estaba fijo
  en el servidor.
- Banco de ejercicios nuevo: `MathSkill` grade=2, axis="Números y operaciones", OA verificado
  contra la fuente oficial (`MA02 OA09`, ver
  `specs/003-fase2-preparacion-pedagogica/actividades-oa09-2basico.md`).
- 12 ejercicios (4 por nivel de dificultad 1–3), todos sin reserva/canje, con distractores
  clasificados por tipo de error (conceptual/cálculo/comprensión de enunciado) — mismo patrón que
  el banco de 1° básico.
- El resto del recorrido (evaluación inicial, motor adaptativo, sesión de práctica, panel
  familiar, gamificación) no cambia: ya filtraba ejercicios por `child.grade` dinámicamente, así
  que funciona para 2° básico sin tocar esa lógica.

## Fuera de alcance de esta expansión (simplificaciones explícitas)

- **Solo formato de opción múltiple.** El diseño pedagógico original de
  `actividades-oa09-2basico.md` incluía interacciones ricas (arrastrar y soltar, unir elementos,
  detectar errores en un procedimiento ya resuelto) que el motor de ejercicios actual no soporta
  — solo `prompt` + opciones. Se adaptó el contenido matemático de esas 6 actividades a ejercicios
  de opción múltiple, perdiendo la interacción rica. Construir esos tipos de interacción es un
  proyecto de UI aparte, no incluido acá.
- **Sin representación pictórica (`visual`).** El componente `ExerciseVisual` cuenta objetos con
  emoji uno por uno — funciona para cifras hasta ~20 (1° básico) pero no escala a números de dos
  dígitos sin verse mal o requerir un componente nuevo (bloques de decenas/unidades). Los
  ejercicios de 2° básico quedan sin `visual` (`null`) — solo texto narrado por voz, que ya es el
  contenido accesible principal según el propio componente.
- **Otros 10 OA de Números y Operaciones de 2° básico** (conteo, comparación, cálculo mental,
  decenas/unidades como concepto explícito, tablas de multiplicar 2/5/10) — no construidos.
- **Los otros 4 ejes de 2° básico** (Patrones y Álgebra, Geometría, Medición, Datos y
  Probabilidades) — no construidos.
- **3° a 6° básico** — el resto de `curriculo-mineduc-2-a-6-basico.md` sigue siendo solo
  referencia.

## Principios que se mantienen

Los mismos de `specs/001-mvp-regulado/spec.md`: motor adaptativo determinista, sin ranking, sin
lenguaje clínico, consentimiento previo. El curso ahora es elegible por el adulto, pero sigue
siendo un valor cerrado (whitelist `[1, 2]` en el servidor, no un rango abierto) — no se acepta
cualquier número para no reabrir por error la cobertura de curso antes de tener contenido real.
