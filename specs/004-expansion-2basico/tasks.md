# Tasks — Expansión a 2° básico

**Última revisión:** 2026-08-14

- [x] Decisión de alcance con el usuario: solo Números y Operaciones, empezando por MA02 OA09;
      curso elegible por el adulto al crear el perfil (no todo perfil nuevo en 2°).
- [x] Servidor: `childProfileSchema` acepta `grade` validado contra whitelist `[1, 2]`;
      `children.ts` usa el valor recibido en vez de `MVP_GRADE` hardcodeado.
- [x] `seed.ts` refactorizado (`seedSkill()` reusable) + banco de 12 ejercicios para MA02 OA09
      (grade 2, sin reserva, distractores clasificados). Verificado idempotente (dos corridas
      seguidas, 0 duplicados).
- [x] Cliente: selector de curso en `CreateChildScreen` (mismo patrón `.choice-grid` ya usado en
      `AuthScreen`/`ChooseCompanionScreen`); `createChild` manda el curso elegido.
- [x] Tests actualizados: 7 archivos de servidor que creaban un niño como fixture (agregar
      `grade: 1`), `children.integration.test.ts` (rechazo de curso inválido + creación con curso
      elegido), `exercise-bank.integration.test.ts` (ya no asume "todo es grade 1 / sin oaCode"),
      nuevo test en `next-exercise.integration.test.ts` (2° básico recibe ejercicios de 2°, no de
      1°). Cliente: `CreateChildScreen.test.tsx`, `App.test.tsx`. E2E:
      `full-journey.spec.ts`.
- [x] Suite completa en verde: servidor 87 tests, cliente 27 tests, E2E 1/1 (validado localmente
      con Playwright 1.40 por la limitación de macOS 12 de este entorno), lint y typecheck limpios.

## Ampliación posterior (2026-08-14)

- [x] **Representación pictórica para 2° básico.** `ExerciseVisual` gana un umbral: n ≤ 20 sigue
      renderizando un objeto por unidad (1° básico, sin cambios); n > 20 renderiza bloques de
      decena ("10") + unidades sueltas, descomponiendo también la cantidad tachada (`removed`) en
      su propia decena/unidad — nunca cruza una columna, coherente con "sin reserva". Los 12
      ejercicios de MA02 OA09 quedaron con su `visual` poblado (antes `null`). Sin cambios de
      schema — mismo tipo `ExerciseVisualDescriptor`, solo la lógica de render en el componente.
      Suite completa verde tras el cambio (88 servidor, 27 cliente); no se agregó test dedicado a
      `ExerciseVisual` (componente decorativo, `aria-hidden`, sin tests previos tampoco para
      `combine`/`takeaway`).

## Backlog (explícitamente fuera de esta expansión)

- [ ] Interacciones ricas (arrastrar y soltar, unir elementos, detectar errores en un
      procedimiento) del diseño pedagógico original — el motor de ejercicios solo soporta opción
      múltiple hoy. Proyecto de UI aparte.
- [ ] Los otros 10 OA de Números y Operaciones de 2° básico.
- [ ] Los otros 4 ejes de 2° básico (Patrones y Álgebra, Geometría, Medición, Datos y
      Probabilidades).
- [ ] 3° a 6° básico — `curriculo-mineduc-2-a-6-basico.md` sigue siendo solo referencia.
