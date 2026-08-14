# Spec — Fase 2: Preparación pedagógica

**Estado:** no iniciada · **Última revisión:** 2026-08-13

## Objetivo

El motor y el recorrido técnico ya funcionan (`specs/001-mvp-regulado/`); esta fase valida que lo
que el motor enseña y decide sea correcto y presentable ante un adulto responsable, no solo que el
código no falle.

## Alcance

1. **Completar OA** — `MathSkill.oaCode` está `null` a propósito en todo el banco actual. Requiere
   la fuente curricular oficial de MINEDUC para 1° básico, eje Números y operaciones — sin eso, no
   se completa (regla del proyecto: nada de OA sin fuente verificada).
2. **Auditar el banco de ejercicios** — 24 ejercicios sembrados (`server/prisma/seed.ts`),
   marcados `isFictitious: true`. Revisar que la dificultad (`difficultyLevel` 1–3) esté bien
   calibrada, que los distractores (`ExerciseOption.errorTypeId`) representen errores reales y no
   arbitrarios, y decidir si "ficticio" sigue siendo aceptable para uso real o si hace falta
   contenido validado por un docente.
3. **Validar reglas adaptativas** — `adaptiveEngine.ts` tiene reglas deterministas ya testeadas
   unitariamente, pero nunca revisadas por criterio pedagógico: ¿cuántos aciertos/errores
   consecutivos deberían mover el nivel? ¿el uso de pistas debería bajar el nivel tan rápido como
   hoy? Eso es una decisión pedagógica, no técnica.
4. **Revisar español e inglés** — el sistema i18n (Fase D) traduce interfaz y contenido de
   ejercicios; falta una revisión por alguien con criterio en ambos idiomas (no solo que el texto
   exista, sino que suene natural y sea apropiado para un niño de 6-7 años).
5. **Consola mínima de contenido** — hoy el banco de ejercicios se edita solo vía
   `server/prisma/seed.ts` + migración manual. Antes de escalar el contenido, definir una vía
   mínima (aunque sea un script o panel interno) para que alguien sin tocar código pueda revisar o
   ajustar ejercicios.

## Fuera de alcance

- Los otros 4 ejes curriculares de 1° básico (ver `specs/001-mvp-regulado/spec.md`, "Fuera de
  alcance en v1") — esta fase audita lo que ya existe, no expande la cobertura curricular.
- Cualquier cambio a la arquitectura técnica — eso es Fase 1
  (`specs/002-fase1-robustez-tecnica/`).

## Referencia disponible para una expansión futura

El usuario aportó el currículum MINEDUC de 2° a 6° básico (los 5 ejes), guardado en
[`curriculo-mineduc-2-a-6-basico.md`](curriculo-mineduc-2-a-6-basico.md). **No desbloquea el ítem 1
de esta fase**: el banco de ejercicios actual es 100% 1° básico y ese documento empieza en 2°, así
que no completa ningún `oaCode` existente. Queda como insumo para cuando se decida expandir a
otros cursos — una decisión de alcance explícita, no algo que esta fase dispare por sí sola.

## Bloqueos conocidos

Este roadmap se documenta ahora, pero varios ítems no son ejecutables sin un insumo externo:

- **1 (OA)** bloqueado hasta tener la fuente oficial de MINEDUC para 1° básico específicamente
  (ver nota arriba: lo ya aportado es de 2°-6° básico y no cubre este curso).
- **2 y 4** requieren criterio humano (docente de 1° básico; hablante nativo de inglés) — no son
  auditorías que el código o un modelo puedan cerrar solos con confianza suficiente para contenido
  dirigido a niños.
- **3** es una decisión de producto/pedagogía, no algo que se resuelva con más tests.

El ítem **5** (consola mínima) sí es puramente técnico y puede ejecutarse sin esperar a los demás.
