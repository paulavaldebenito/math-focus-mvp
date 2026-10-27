# 020 · Ubicación adaptativa y repaso entre cursos

**Pedido (2026-10-27):** que la evaluación le dé a cada niño ejercicios a su nivel y lo haga subir de
a poco. Un niño puede estar en 5° básico y no saber las tablas de 2°. Antes, la app solo trabajaba
dentro del curso del niño: una evaluación de 3 preguntas al azar fijaba la dificultad (1–3), y el
mapa y los ejercicios eran siempre de su curso.

**Decisiones de la profesora (product owner):**
- Esta versión cubre solo el eje **Números y operaciones**, donde los vacíos se encadenan.
- El niño ve «Repaso», nunca el curso de origen.
- El mapa de prerrequisitos lo valida un agente pedagógico.

## Cómo funciona

1. **Mapa de prerrequisitos entre cursos.** Está en `server/src/domain/prerequisites.ts`: 23
   habilidades y sus bases directas, cada una con su porqué curricular. Un agente pedagógico lo
   revisó contra las Bases Curriculares 2012 (`revision_prerrequisitos.md`) y sus correcciones ya
   están aplicadas.
2. **Evaluación de ubicación.** Está en `server/src/assessment/placement.ts`. Es una función pura y
   determinista, sin IA, y las preguntas llegan de a una.
   - **1ª pasada:** 2 preguntas por cada habilidad de Números de su curso. Con 2 de 2 la domina; con
     0 de 2 debe reforzarla; con 1 de 2 se hace una tercera pregunta. Una sola respuesta nunca
     ubica al niño.
   - **2ª pasada:** desde cada habilidad que falló, baja por sus prerrequisitos de un curso a otro
     hasta encontrar lo que domina.
   - **Inferencia:** si domina una habilidad, se dan por dominadas sus bases. Pero si una de esas
     bases es prerrequisito de algo que falló, se pregunta igual.
   - **Tope:** 15 preguntas, unos 10 minutos.
3. **Repaso.** Las habilidades «reforzar» de cursos anteriores aparecen arriba del mapa como «🔁 Tu
   repaso», de la base más básica a la más avanzada. Cada una se abre al superar las anteriores de
   su cadena y se da por superada con 5 aciertos practicando, igual que un nodo del mapa. Los temas
   de su curso que dependen del repaso siguen abiertos con el aviso «Después de tu repaso»: es una
   recomendación, no un bloqueo.
4. **Detección durante la práctica.** Si el niño ya está en la dificultad más baja de una habilidad
   de Números y vuelve a tener 2 errores conceptuales seguidos, sus bases directas que no domina
   comprobadamente se agregan al repaso; si la base es de su curso, se baja hasta las de cursos
   anteriores (`flagPrerequisitesFromPractice`).
5. **Quién ve qué:**
   - **Niño:** solo «Tu repaso».
   - **Familia** («🧭 Ubicación y repaso», en todos los planes): ve cada base con su curso y su
     avance, y puede repetir la evaluación.
   - **Docente** (ficha del estudiante): ve OA, curso y avance.

## Revisión independiente (aplicada)

Un revisor independiente, con mirada pedagógica y técnica, revisó textos y lógica. Se corrigió:

- **Doble toque o reintento:** cada pregunta servida se «reclama» de forma atómica
  (`Session.pendingExerciseId`). Una respuesta nunca cuenta dos veces y el cliente no puede
  responder otra pregunta que la servida.
- **Rutas de práctica:** ya no aceptan una sesión de ubicación (`getOwnedSession` exige
  `kind: "practica"`).
- **Estadísticas:** racha, aviso a la familia, precisión, panel docente y nodos del mapa cuentan
  solo la práctica.
- **Banco sin ejercicios:** una habilidad sin ejercicios disponibles se salta, en vez de cortar la
  evaluación. Si no queda un problema base distinto, se acepta repetir la historia.
- **Avance del repaso:** cuenta solo los aciertos posteriores a la detección. Una base inferida
  no pisa lo que detectó la práctica.
- **Evaluación repetida:** conserva el nivel de dificultad ganado practicando.
- **«🤔 Todavía no lo sé»:** cuenta como no dominada y evita que el niño adivine; con 2 de 2 al azar
  quedaría «dominada».
- **Bases detectadas en la práctica:** si la base es de su propio curso, se sigue bajando hasta
  las de cursos anteriores.
- **Textos para el niño:** más cortos y sin sugerir bloqueos.
- **Textos para familia y docente:** describen exactamente lo que hace el sistema (el repaso se
  propone primero, pero no bloquea) y lo que no evalúa todavía (los otros ejes).

## Datos

- `Session.kind`: «practica» (por defecto) o «ubicacion». `Session.pendingExerciseId`: la pregunta
  servida que se espera responder.
- `SkillPlacement`: una fila por niño y habilidad, con status «dominada» o «reforzar», source
  «ubicacion» o «practica» y la marca `direct` (respondida o inferida).
- Migración: `20261027120000_ubicacion_adaptativa` (solo agrega).
- API:
  - `POST /api/children/:id/initial-assessment`: empieza la evaluación o la repite.
  - `POST /api/children/:id/initial-assessment/:sessionId/answers`: responde y devuelve la
    siguiente pregunta o el resultado. Acepta `selectedOptionId` o `dontKnow: true`, solo para la
    pregunta servida y una sola vez. La corrección la decide el servidor.

## Pendiente (de la revisión pedagógica)

- **Renombrar MA06 OA03** «Razones y proporciones» a «Razones»: el OA oficial no habla de
  proporciones. Antes hay que revisar los ejercicios del banco.
- **Contextos para niños mayores en el repaso:** un niño de 5° que repasa contenidos de 1°–2° ve
  ejercicios con dibujos de 1°–2°. Conviene preferir ítems simbólicos o neutros, o escribir ítems de
  repaso para niños mayores.
- **Ítems de ubicación fijos por habilidad:** hoy son 2 ítems al azar de dificultad media. Conviene
  elegir ítems que toquen lo crítico de cada OA, por ejemplo restas con canje en MA03 OA06.
- **Extender a los otros ejes**, si la profesora lo decide.
