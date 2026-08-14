# Tasks — Fase 2: Preparación pedagógica

**Última revisión:** 2026-08-13

- [ ] **2.1 Completar OA** — bloqueado: requiere fuente oficial de MINEDUC (1° básico, Números y
      operaciones) antes de poder ejecutarse.
- [ ] **2.2 Auditar el banco de ejercicios** — requiere: script que exporte los 24 ejercicios
      actuales (prompt, dificultad, opciones, `errorTypeId`) a un formato revisable por un docente,
      luego la revisión misma (criterio humano).
- [ ] **2.3 Validar reglas adaptativas** — requiere: documentar cada regla de `adaptiveEngine.ts`
      en lenguaje no técnico junto a su `ruleCode`, luego revisión pedagógica de los umbrales.
- [ ] **2.4 Revisar español e inglés** — requiere: extraer las cadenas de `client/src/lib/i18n.ts`
      a un formato revisable, luego revisión por hablante nativo en ambos idiomas.
- [ ] **2.5 Consola mínima de contenido** — único ítem puramente técnico de esta fase: CLI que
      cargue ejercicios desde un archivo estructurado (JSON/CSV) en vez de tenerlos hardcodeados en
      `seed.ts`.

## Notas

- Bloqueos detallados en `spec.md` ("Bloqueos conocidos"). 2.1, 2.2 y 2.4 no pueden cerrarse sin
  un insumo humano/externo — lo que sí puede avanzar ahora es la preparación técnica que los
  destraba (scripts de exportación, documentación de reglas).
- 2.5 es independiente del resto y puede ejecutarse en cualquier momento.
