# Math Focus — MVP regulado

MVP de "Math Focus" construido bajo un proceso por fases (diagnóstico → definición → plan → implementación → verificación), con reglas estrictas contra alucinaciones y foco en seguridad/privacidad infantil.

**Relación con `math-focus-app/`** (carpeta hermana): ese proyecto es un prototipo anterior (React+JS, sin autenticación, SQLite) que se conserva **solo como referencia visual/UX** — patrones de pausas, pistas y contenido pictórico ya validados ahí guían el diseño de este MVP, pero el código no se reutiliza directamente.

## Alcance del MVP v1 (aprobado)

- Nivel escolar: 1° básico. **Expandido a 2° básico (mismo eje) el 2026-08-14** — ver
  [`specs/004-expansion-2basico/`](specs/004-expansion-2basico/) — y **a 3°–6° básico el 2026-09-28** — ver
  [`specs/006-expansion-3a6-basico/`](specs/006-expansion-3a6-basico/); el resto de este documento
  describe el alcance original de v1.
- Eje: Números y operaciones (conteo 0–20, adición y sustracción dentro de 20).
- Registro de adulto responsable + consentimiento explícito, obligatorios antes de crear cualquier perfil infantil.
- Motor adaptativo determinista y auditable (reglas explícitas, cada decisión con motivo persistido).
- Sin ranking entre estudiantes, sin lenguaje clínico/diagnóstico.

## Stack

- Cliente: `client/` — React + TypeScript (Vite).
- Servidor: `server/` — Node + TypeScript + Express. Base de datos PostgreSQL vía Prisma (pendiente: T0.2).

## Estado

Ver historial de commits y el plan de tareas (T0.x–T6.x) acordado en la fase de planificación. Ningún dato de Objetivo de Aprendizaje curricular está codificado sin marcar su origen; cualquier código de OA queda como "pendiente de validación curricular" hasta contar con la fuente oficial de MINEDUC.

## Spec, plan y tareas

El proceso por fases mencionado arriba está versionado en [`specs/001-mvp-regulado/`](specs/001-mvp-regulado/):

- [`spec.md`](specs/001-mvp-regulado/spec.md) — alcance, historias de usuario, principios no negociables.
- [`plan.md`](specs/001-mvp-regulado/plan.md) — stack, arquitectura, modelo de datos, deuda técnica abierta.
- [`tasks.md`](specs/001-mvp-regulado/tasks.md) — historial de tareas T0–T7 con su commit, y backlog pendiente.

El backlog post-MVP está organizado en dos fases, cada una con su propio spec/plan/tasks:

- [`specs/002-fase1-robustez-tecnica/`](specs/002-fase1-robustez-tecnica/) — CI, E2E, migraciones automatizadas, seguridad de sesiones, control de acceso, errores y reintentos.
- [`specs/003-fase2-preparacion-pedagogica/`](specs/003-fase2-preparacion-pedagogica/) — completar OA, auditar el banco de ejercicios, validar reglas adaptativas, revisar ES/EN, consola mínima de contenido.

Expansión de alcance post-MVP:

- [`specs/004-expansion-2basico/`](specs/004-expansion-2basico/) — 2° básico, eje Números y operaciones, MA02 OA09 (adición y sustracción dentro de 100, sin reserva).
- [`specs/005-ampliacion-1basico-oa04/`](specs/005-ampliacion-1basico-oa04/) — 1° básico, MA01 OA04 (comparar y ordenar números dentro de 20).
- [`specs/006-expansion-3a6-basico/`](specs/006-expansion-3a6-basico/) — 3° a 6° básico y ampliación de 1° y 2°: banco por contenidos (los 5 ejes) escrito por agentes por curso (`.claude/agents/banco-N-basico.md`).
- [`specs/007-intereses-multiples/`](specs/007-intereses-multiples/) — 10 intereses, elección de hasta 3, y ~70 % de las preguntas temáticas mediante variantes ligadas al ejercicio base (`.claude/agents/variantes-tematicas.md`).
- [`specs/008-banco-imagenes-por-curso/`](specs/008-banco-imagenes-por-curso/) — 805 ilustraciones SVG (español/inglés) de 1° a 6° básico, alternativas traducidas al inglés y propuestas para 8 enunciados (`npm run bank:images` en `server/`).
- [`specs/009-animo-y-pausas/`](specs/009-animo-y-pausas/) — check-in opcional de ánimo y de cómo se siente con las matemáticas (5 caritas) al empezar cada práctica, y pausas que no repiten el mismo ejercicio en la sesión.
- [`specs/010-banco-visual-completo/`](specs/010-banco-visual-completo/) — 2.108 ejercicios con imagen del banco visual completo (PNG sin palabras, fondo blanco), vinculados solo por `exerciseId`, con leyendas A/B/C bilingües fuera de la imagen.
