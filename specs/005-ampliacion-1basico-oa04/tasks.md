# Tasks — Ampliación de 1° básico: MA01 OA04

**Última revisión:** 2026-08-14

- [x] Verificar MA01 OA04 contra curriculumnacional.mineduc.cl (página individual, no un resumen).
- [x] Completar `oaCode: "MA01 OA09"` en la habilidad de adición/sustracción ya sembrada
      (también verificado en la misma sesión, antes de esta ampliación).
- [x] Bug encontrado y corregido en `seedSkill()`: no actualizaba campos (incluido `oaCode`) de
      una habilidad ya existente, solo la buscaba y seguía — el fix de arriba no llegaba a la DB
      real hasta corregir esto.
- [x] Nuevo tipo de visual `compare` (cliente: `types.ts` + `ExerciseVisual.tsx`).
- [x] Nueva habilidad + 12 ejercicios para MA01 OA04 en `seed.ts` (4 por nivel de dificultad,
      progresión concreto→simbólico→contexto).
- [x] Pistas diseñadas desde el principio sin revelar la respuesta (aplicando la lección de la
      sesión anterior).
- [x] Test de OA verificados corregido: indexado por nombre de habilidad, no por `grado:eje`
      (ya no es una clave única con dos habilidades en el mismo grado y eje).
- [x] Seed verificado idempotente (corrida repetida, 0 duplicados).
- [x] Suite completa en verde: servidor 88 tests, lint y typecheck limpios.

## Notas / efectos secundarios documentados

- Una sesión de práctica de 1° básico ahora puede mezclar preguntas de "adición/sustracción" y de
  "comparar/ordenar" — las rutas filtran por grado, no por habilidad. Documentado como decisión
  consciente en `spec.md`, no un bug.

## Backlog (explícitamente fuera de esta ampliación)

- [ ] El resto de Números y Operaciones de 1° básico (OA1, OA2, OA3, OA5, OA6, OA8, OA10).
- [ ] Los otros 4 ejes de 1° básico.
- [ ] UI de arrastrar-para-ordenar (el OA real pide "ordenar", acá se aproximó con opción
      múltiple sobre grupos chicos — mismo tipo de simplificación que en `specs/004`).
- [ ] Generalizar el test de "la pista no revela la respuesta" (hoy acotado a resta) al resto del
      banco, si se sigue ampliando contenido.
