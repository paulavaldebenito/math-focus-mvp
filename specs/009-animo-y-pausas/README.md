# 009 — Ánimo con caritas y pausas sin repetir

## Check-in de ánimo (inicio de cada práctica)

- **Cuándo:** **una vez al día**, en la primera práctica del día (hora de Chile), antes de "Antes de empezar". El servidor lo indica con `checkInDue` al iniciar la sesión. Tiene dos preguntas de 5 caritas y es **opcional**: basta con responder una, y "Saltar" también se registra (con valores vacíos) para no volver a preguntar ese día. Nunca bloquea ni cambia la práctica, aunque falle el registro.
- **Preguntas:**
  - `mood`: "¿Cómo te sientes hoy?" (😢 1 = muy triste … 😄 5 = ¡muy bien!)
  - `mathFeeling`: "¿Cómo te sientes con las matemáticas hoy?" (😰 1 = muy nervioso/a … 😎 5 = ¡muy tranquilo/a!)
  - Las dos escalas van en el mismo sentido: izquierda peor, derecha mejor. **Ansiedad matemática autorreportada = 6 − mathFeeling.**
- **Datos:** tabla `WellbeingCheckIn` (childProfileId, sessionId, mood, mathFeeling, createdAt), uno por sesión (`POST /api/sessions/:sessionId/check-in`, uno por día; 409 si ya hay uno ese día). Al estar ligada a la sesión, se puede cruzar a futuro con los `Attempt` de esa misma sesión, por ejemplo para ver si una baja de precisión coincide con un ánimo bajo.
- **Límites:** es un autorreporte, nunca un diagnóstico. No se muestra a otros niños ni lo usa el motor adaptativo. El texto de consentimiento (ConsentScreen) ahora lo menciona.

## Panel familiar: cruce ánimo × aciertos y qué repasar

- **Cruce** (`GET /api/children/:id/progress` → `wellbeing`, lógica pura en `server/src/domain/wellbeing.ts`):
  - Cada día con check-in se cruza con la precisión de los ejercicios de ese mismo día (hora de Chile). El panel muestra los últimos 7 días con sus caritas y aciertos.
  - Muestra una comparación como "los días en que dijo sentirse nervioso/a con las matemáticas acertó un 42 %; los días en que se sintió tranquilo/a, un 93 %", y lo mismo con el ánimo, solo si cada grupo tiene al menos 2 días con ejercicios. Con menos datos dice que aún hay pocos días.
  - La comparación siempre va acompañada de "es una coincidencia observada, no una conclusión". El panel no usa la palabra "ansiedad" ni ningún lenguaje clínico.
  - Si el promedio de los últimos 5 días en "matemáticas" es 2,5 o menos, se agrega una sugerencia de cómo acompañar los nervios: normalizar el error, valorar el esfuerzo, sesiones cortas y empezar por lo que ya le sale.
- **Qué repasar y cómo** (`skillsToReview`): muestra hasta 3 contenidos con menos del 70 % de aciertos y al menos 4 intentos, cada uno con una sugerencia concreta para la casa, sin pantalla y con objetos cotidianos. Hay una sugerencia por cada una de las 46 habilidades, en español e inglés (`server/src/domain/familyTips.ts`); una prueba exige que cada habilidad del banco tenga la suya. Los tips por tipo de error que ya existían se mantienen.

## Pausas sin repetir

- Hay 5 ejercicios de respiración y 5 de movimiento (`client/src/lib/pauses.ts`). Dentro de una sesión, cada pausa elige uno que **no se haya hecho antes** en esa sesión. Si ya se hicieron todos, vuelve a elegir entre el catálogo completo; nunca deja al niño sin pausa.
- **Movimientos matemáticos por curso** (`MATH_MOVEMENT_EXERCISES` en `client/src/lib/pauses.ts`): 18 movimientos que repasan contenidos mientras el niño se mueve. Cada uno trae versión sentado/a, en español e inglés. En la práctica, la pausa de movimiento elige primero uno de su curso que no haya hecho en la sesión; si ya los hizo todos, uno genérico no repetido.

  | Curso | Movimientos |
  |---|---|
  | 1.º | contar saltando del 1 al 10 y hacia atrás · formas de hacer 5 con los dedos · patrón aplauso-aplauso-salto · figuras en el aire |
  | 2.º | patrón · figuras en el aire · saltar de 2 en 2 · decenas y unidades con saltos y aplausos · marcha de 5 en 5 |
  | 3.º | decenas y unidades · marcha de 5 en 5 · tabla del 3 o del 4 saltando · de 10 en 10 con cabeza-hombros-rodillas · perímetro en pasos |
  | 4.º | tabla saltando · perímetro en pasos · poses simétricas · ángulos con los brazos · giros de 1/4 y 1/2 vuelta |
  | 5.º | perímetro en pasos · ángulos · giros en fracciones · pasos en el plano cartesiano · múltiplos de 3 y 5 |
  | 6.º | ángulos · múltiplos · giros de 90° y 180° · sentadillas con porcentajes · razón 2 : 1 con pasos y aplausos |
- **La mascota hace el ejercicio junto al niño:** durante la pausa de movimiento aparece más grande, contenta y moviéndose en bucle según el ejercicio: saltar, marchar, caminar, girar, sentadilla, estirarse, aplaudir, dibujar un círculo, empujar o moverse y congelarse (campo `motion` de cada ejercicio; animaciones `mascot-motion-*` en App.css). Si el niño elige hacerlo sentado/a, se mueve más suave. Con "reducir movimiento" activado en el dispositivo queda quieta (regla global de index.css).
- `PauseEvent.exerciseKey` registra qué ejercicio se hizo (p. ej. "globo", "saltos-estrella").

## Pendientes para decidir

1. **Consentimiento de perfiles existentes:** los perfiles creados antes de este cambio aceptaron el texto anterior, que no menciona el ánimo. Hoy todos son de prueba. Antes de tener usuarios reales, decidir si se pide reconsentimiento o si el check-in se omite para esos perfiles.
2. **Revisión pedagógica de los 46 tips** para la familia y del texto sobre los nervios.
3. **Umbrales:** 2 días por grupo para comparar, menos del 70 % de aciertos con al menos 4 intentos para "repasar", y 2,5 o menos de promedio para la sugerencia sobre los nervios. Son decisiones de producto, ajustables en `wellbeing.ts` y `FamilyInsights.tsx`.
