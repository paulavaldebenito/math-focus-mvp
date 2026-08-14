# Spec — Math Focus MVP v1

**Estado:** implementado (T0–T7, Fase 5, Fase D) · **Última revisión:** 2026-08-13

> Este documento se reconstruyó retroactivamente a partir del historial de commits (`git log`),
> el README y las historias de usuario (`HU1`–`HU4`) que ya existían como etiquetas dentro de los
> tests. El proceso de fases se siguió desde el principio del proyecto; lo que faltaba era
> trackear spec/plan/tasks como archivos versionados en vez de vivir solo en mensajes de commit.

## Problema y audiencia

Niños de 1° básico que practican matemáticas en casa o en el aula, acompañados por un adulto
responsable (apoderado o docente). El diseño asume niños que se distraen con facilidad — sesiones
cortas, sin lenguaje que interprete errores como déficit, con pausas activas siempre disponibles.

## Alcance v1 (aprobado)

- Nivel escolar: 1° básico.
- Eje curricular: Números y operaciones (conteo 0–20, adición y sustracción dentro de 20).
- Registro de adulto responsable + consentimiento explícito, obligatorios antes de crear
  cualquier perfil infantil.
- Motor adaptativo determinista y auditable: reglas explícitas, cada decisión con motivo
  persistido (no un modelo de IA opaco).
- Sin ranking entre estudiantes, sin lenguaje clínico ni diagnóstico.

## Historias de usuario implementadas

Tal como quedaron etiquetadas en la suite de integración del servidor:

| HU | Historia | Cubierta por |
|----|----------|--------------|
| HU1 | Un adulto se registra e inicia sesión | `auth-register.integration.test.ts`, `auth-login.integration.test.ts` |
| HU2 | Un adulto otorga consentimiento explícito antes de crear un perfil infantil | `consent.integration.test.ts` |
| HU3 | Un adulto crea el perfil de su hijo/a (curso fijado por el servidor) | `children.integration.test.ts` |
| HU4 | El niño hace una evaluación inicial breve que calibra su nivel de partida | `initial-assessment.integration.test.ts` |

Sin etiqueta `HU` formal pero con la misma cobertura de integración:

- Sesión de práctica conectada al motor adaptativo, con pistas progresivas y registro de
  decisiones (`sessions.integration.test.ts`, `next-exercise.integration.test.ts`).
- Pausas activas (respiración/movimiento) ofrecidas y nunca obligatorias
  (`pause-events.integration.test.ts`).
- Panel familiar de progreso, sin comparar a un niño con otros (`progress.integration.test.ts`).
- Gamificación con estrellas, elección de compañero y resumen de inicio
  (`stars-companion-home.integration.test.ts`).

## Principios no negociables

Estas reglas aparecen documentadas como comentarios en el schema de Prisma y como decisiones
explícitas en mensajes de commit — se listan aquí para que no dependan de que alguien lea el
código para descubrirlas:

- El motor adaptativo es determinista y auditable: cada cambio de dificultad se persiste con
  `ruleCode` + `reason` (`AdaptiveDecision`), nunca es una decisión opaca.
- Ningún patrón de error se interpreta como diagnóstico clínico (p. ej. "respuesta muy rápida"
  se registra como dato observable, no como evidencia de déficit atencional).
- Sin ranking ni comparación entre estudiantes — el progreso es siempre una fotografía individual
  (`ProgressSnapshot`).
- El consentimiento del adulto precede y es obligatorio para crear cualquier perfil infantil
  (relación 1-a-1 `Consent` ↔ `ChildProfile`).
- Las pausas activas siempre son opcionales; la app nunca bloquea ni castiga por rechazarlas.
- Las estrellas siempre tienen un motivo trazable (`StarEvent.reason`), nunca son aleatorias ni
  comprables con dinero real.
- Ningún código de Objetivo de Aprendizaje (OA/MINEDUC) se completa sin una fuente curricular
  oficial verificada — se deja `null` explícitamente hasta entonces.

## Fuera de alcance en v1 (explícito)

Del mensaje de commit de la Fase D, que es la fuente más reciente y explícita sobre pendientes:

- Los otros 4 ejes curriculares de 1° básico (solo se construyó "Números y operaciones").
- Función de comunidad.
- Motor de pausas con auto-reporte del niño.
- Soporte multi-curso / multi-nivel escolar.

## Riesgos y pendientes conocidos

- **Bug de audio conocido, sin resolver:** en un equipo específico, la narración por voz falla en
  Chrome/Safari (el sistema operativo sí reproduce voz vía `say`, los navegadores no). Descartados
  permisos de sonido y extensiones.
- **Sin CI:** lint, typecheck y tests solo corren si alguien los ejecuta a mano (ver `plan.md`).
- **Códigos OA/MINEDUC:** `MathSkill.oaCode` queda `null` hasta contar con la fuente oficial.

## Historial de auditoría posterior

- **2026-08-13/14:** auditoría de desarrollador encontró y corrigió dos problemas reales (ver
  `tasks.md`, sección "Post-auditoría"): 11 de 14 tablas sin migración committeada, y Vitest
  corriendo cada test del servidor dos veces por recoger también `dist/`.
