# Spec — Ampliación de 1° básico: MA01 OA04

**Estado:** implementado · **Última revisión:** 2026-08-14

## Decisión de alcance

El usuario pidió ampliar 1° básico y pegó el currículum completo (5 ejes, 20 OA) como fuente
"oficial". Verificado contra páginas de OA individuales antes de construir nada — la numeración
que pegó no coincidía con la oficial (ver
`specs/003-fase2-preparacion-pedagogica/curriculo-1basico.md`). Entre tres opciones de amplitud,
la más chica: **un OA nuevo dentro de Números y Operaciones**, no el eje completo ni los 5 ejes.
El OA elegido, de una lista de verificados/candidatos: **MA01 OA04 — Comparar y ordenar números
del 0 al 20**.

## Alcance

- Nueva habilidad `MathSkill` (grade=1, axis="Números y operaciones",
  name="Comparar y ordenar números dentro de 20", oaCode="MA01 OA04", verificado).
- 12 ejercicios nuevos (4 por nivel de dificultad), cubriendo tanto "comparar" (mayor/menor entre
  2 números) como "ordenar" (identificar el mayor/menor de un grupo de 3, o entre dos cantidades
  en un problema de contexto).
- Nuevo tipo de representación pictórica: `visual.kind: "compare"` — dos grupos de objetos
  separados por "vs", sin operador ni resultado (a diferencia de "combine"/"takeaway", una
  comparación no se "resuelve" con un número calculado).

## Fuera de alcance (simplificación explícita)

- **"Ordenar" sin arrastrar-para-ordenar.** El OA real habla de ordenar una secuencia; el motor
  de ejercicios solo soporta opción múltiple. Se adaptó a "identificar el mayor/menor de un grupo
  pequeño" — mismo tipo de simplificación que ya se documentó para 2° básico en
  `specs/004-expansion-2basico/spec.md`.
- El resto de Números y Operaciones de 1° básico (OA1, OA2, OA3, OA5, OA6, OA8, OA10) — no
  construido.
- Los otros 4 ejes de 1° básico — no construidos.

## Efecto secundario no trivial: dos habilidades comparten grado y eje

Hasta ahora, cada combinación grado+eje tenía una sola `MathSkill`. Con esta ampliación, 1°
básico/Números y operaciones tiene **dos**: la original (adición/sustracción) y esta nueva
(comparar/ordenar). Las rutas que eligen ejercicios (`next-exercise`, `initial-assessment`)
filtran por `grade` solamente, no por habilidad específica — así que una sesión de práctica de 1°
básico ahora puede mezclar preguntas de ambas habilidades. No se restringió esto a propósito: es
una mezcla razonable dentro del mismo eje, no un error. Si en el futuro se quiere controlar el
mix (por ejemplo, no mezclar hasta que el niño domine la primera habilidad), es una decisión de
producto explícita, no algo que deba resolverse silenciosamente en código.
