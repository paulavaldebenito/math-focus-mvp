# Spec — Ampliación del banco a 1°–6° básico (por contenidos)

**Estado:** implementado · **Fecha:** 2026-09-28

## Decisión de alcance

El usuario pidió un agente por curso (1° a 6°) que robustezca el banco de preguntas "según el
currículum nacional, por contenidos", y que quede incorporado a la app. Antes había 75 ejercicios y
3 OAs (todos "Números y operaciones", solo 1° y 2° básico). Decisiones tomadas con el usuario:

- **Volumen:** núcleo (~60-100 por curso), no el banco completo. Cada curso cubre los **5 ejes**
  (Números y operaciones, Patrones y álgebra, Geometría, Medición, Datos y probabilidades) con
  6-9 contenidos y los 3 niveles de dificultad en cada uno.
- **Visuales:** solo texto (`visual: null`) en los contenidos nuevos. Los tipos de visual
  actuales (`combine`, `takeaway`, `compare`, hasta ~99) no sirven para fracciones, centenas,
  geometría ni gráficos; crear visuales nuevos es un proyecto aparte.

## Resultado

| Curso | Contenidos | Ejercicios | Niveles 1/2/3 |
|---|---|---|---|
| 1° | 8 (6 nuevos) | 114 | 39/43/32 |
| 2° | 7 (6 nuevos) | 99 | 37/34/28 |
| 3° | 9 | 92 | 27/36/29 |
| 4° | 8 | 72 | 24/24/24 |
| 5° | 7 | 77 | 26/30/21 |
| 6° | 7 | 71 | 21/29/21 |
| **Total** | **46** | **525** | |

Todos los contenidos nuevos llevan `oaCode`. El adulto ahora elige entre los seis cursos al crear
el perfil (`SUPPORTED_GRADES = [1..6]` en servidor y cliente).

## Cómo se produjo

- **Un agente por curso** (`.claude/agents/banco-{1..6}-basico.md`). Cada uno escribe solo su
  módulo `server/prisma/seed/grade{N}.ts`. El seed se partió en módulos por curso (`lib.ts` con
  tipos puros, `persist.ts` con `seedSkill`, `grade1..6.ts`), sin cambio de comportamiento: el
  seed sigue siendo idempotente y **nunca actualiza las opciones de ejercicios ya sembrados**
  (un `prompt` editado crea un ejercicio nuevo; si hace falta corregir uno, hay que borrar la
  fila vieja).
- **Reglas de formato** (las hace cumplir `server/prisma/seed/check.ts` y los tests): 4
  alternativas, una sola correcta (la primera; el servidor las mezcla), etiquetas únicas, al menos
  un distractor clasificado con los 5 códigos de error existentes (`E1_OP`, `E2_RES`, `E2_CAL`,
  `E3_PREG`, `E3_DATO`), ≥ 3 ejercicios por nivel en cada contenido, ≥ 6 por nivel por curso en
  3°-6°, prompts únicos por contenido. Pistas: enseñan estrategia y no revelan la respuesta.
- **Formato numérico (Chile):** coma decimal, punto de miles, `$`, `−` (U+2212), `×`, `÷`;
  `promptEn` usa la convención inglesa.

## Verificación de los OA

Cada `oaCode` se verificó **abriendo la página individual del OA** en `curriculumnacional.cl`
(`curriculumnacional.mineduc.cl` redirige ahí con un 301): `.../matematica/{N}-basico/ma0{N}-oa-XX`.
Los agentes de 1°, 3°, 4° y 6° abrieron cada página; en 2° y 5° los agentes solo leyeron la lista
oficial del curso, así que sus 13 OAs (MA02 OA07/11/12/15/18/22 y MA05 OA01/04/07/15/16/21/23) se
volvieron a verificar a mano, uno por uno. Los 43 nuevos están en `VERIFIED_OA` del test
`exercise-bank.integration.test.ts`; todo otro `oaCode` debe ser `null`.

## Verificación de la matemática (revisión ciega)

Un segundo agente por curso resolvió **sin ver la respuesta marcada** los 525 ejercicios (volcado
con `check.ts blind`, comparación con `check.ts compare`). Resultado: **524 de 525 coinciden**. La
única discrepancia (g1-071, patrón rojo-azul-rojo-azul-rojo) fue un descuido del revisor: la
respuesta marcada (azul) es la correcta. Los revisores marcaron además 10 observaciones de
redacción; se reescribieron las tres que afectaban a un niño (1° "banco de clips", 1° "contar
hacia atrás hasta el 30", 2° "figura con 3 lados + 1"). Quedan como observaciones menores:
distractores de otro tipo que la pregunta (3° "¿Quién?" con una fracción), una opción larga con
vocabulario pesado (4° paralelogramo) y una razón sin simplificar como correcta (6° `6 : 2`).

## Fuera de alcance y pendientes

- **Revisión docente.** Los ejercicios siguen siendo `isFictitious: true`: los verificó el modelo y
  una revisión ciega, no un profesor. Antes de un uso real con niños hace falta revisión
  pedagógica, en especial las preguntas de criterio (unidad más conveniente para medir una sala,
  "¿todos los rectángulos tienen los 4 lados iguales?").
- **Visuales nuevos** (fracciones, centenas, geometría, gráficos): hoy los enunciados de
  geometría, gráficos y fracciones van solo en texto.
- **OAs sin cubrir** en cada curso (por ejemplo decimales y cálculo mental en 4°, comparar y ordenar
  en 2°, probabilidades). Los mismos agentes sirven para una segunda pasada.
- ~~Sin ejercicios temáticos en los contenidos nuevos~~ — resuelto en
  [`specs/007-intereses-multiples/`](../007-intereses-multiples/spec.md) con variantes temáticas
  ligadas a cada ejercicio base.
- **Evaluación inicial:** toma 5 ejercicios al azar del curso (ahora solo neutros o de los
  intereses del niño, sin repetir un problema base), sin balancear por contenido ni por nivel.
