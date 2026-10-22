# 015 — Ver en qué se equivocó: su propio error y el de otro

**Fecha:** 2026-10-24 · Pedido de la usuaria: que el niño vea en qué se equivocó, tanto en su propio
ejercicio como en uno mal resuelto por otro. Piloto: fracciones 3°–6° y porcentajes 6° (52 problemas
base, 251 ejercicios).

## Contenido (`server/prisma/seed/traducciones/pasos_resueltos.json`)

Por problema base (`baseKey`, o id del ejercicio si no tiene variantes):
- `steps`: el desarrollo correcto, 2 a 4 pasos, **sin la historia** (solo números y partes), así sirve
  a todas las variantes por interés, que comparten los números.
- `wrong[alternativa]`: `{ step, es, en }` — en qué paso se desvía esa alternativa incorrecta y cómo
  queda ese paso hecho con el error, terminando en la respuesta equivocada ("Se suman arriba y abajo:
  1 + 1 = 2 y 2 + 4 = 6. Respuesta: 2/6."). Escritos en forma impersonal para que sirvan tanto para el
  error propio como para el del amigo. Las alternativas se emparejan por texto normalizado (sin "$" ni
  "monedas").

`applyWorkedSteps.ts` los escribe en `Exercise.solution` y `ExerciseOption.wrongStep` (migración
`20261024120000_desarrollo_paso_a_paso`); el generador está en el scratchpad de la sesión
(`pasos.py`) y en `~/.claude/projects/-Users-pau/bank_review_scripts/`.

## 1. Su propio error

Al responder (nunca antes: delataría la respuesta), `POST /attempts` devuelve `solution` y, si se
equivocó, `wrongStep`. La práctica muestra **"Así se resuelve, paso a paso"** con el paso donde se
desvió marcado: ❌ *Aquí te desviaste* (lo que hizo) y ✅ *Así era*. Tras un acierto, el desarrollo
queda plegado ("Ver cómo se resuelve"). Si el ejercicio no tiene desarrollo, se ve la estrategia
de siempre.

## 2. El ejercicio de otro, mal resuelto ("encuentra el paso equivocado")

En el turno de "detecta el error" (cada 3 preguntas), si el ejercicio tiene desarrollo, se ofrece esta
versión: "Mira cómo lo resolvió tu amigo" con sus pasos (los correctos hasta el error y el paso
equivocado) y "¿En qué paso se equivocó? Tócalo". Solo errores con al menos un paso correcto antes,
y nunca preguntas "¿cuál de estas…?". `POST /find-step-attempts` valida la línea, da una estrella si
la encuentra (no cambia nivel ni racha) y devuelve el paso correcto y el desarrollo, que se muestra
con ❌ *Aquí se equivocó tu amigo* / ✅ *Así era*. Sin desarrollo, sigue la ronda de diagnóstico
anterior (elegir el tipo de error).

## Modo revisión

Al responder se ve el desarrollo y, para revisar el contenido, el **error previsto de cada
alternativa** con su número de paso.

## Pendiente

- Revisión pedagógica de los 52 desarrollos (modo revisión, habilidades del piloto).
- Extender por tandas al resto del banco.
- Limitación conocida: en la ronda del amigo, el paso equivocado es siempre el último que se muestra
  (los pasos posteriores al error no se pueden escribir de forma coherente). Lo que se aprende es
  revisar cada paso anterior y reconocer el error, no adivinar la posición.
