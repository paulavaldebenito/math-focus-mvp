# 013 — Cómo se siente al aprender, y un panel familiar para acompañar en casa

**Fecha:** 2026-10-22 · Alcance elegido por la usuaria: preguntas entretenidas al **cerrar** la
práctica; en el panel, **cómo se siente y cómo orientarlo**, **juegos para la casa por tema débil** y
**evolución por tema**.

## Niño: cierre de la práctica (`SessionReflection`)

- Al terminar las 6 preguntas, bajo "¡Sesión terminada!": **«¿Qué sentiste hoy practicando?»** con 6
  emociones en emoji: 🤩 Orgullo · 😊 Alegría · 😌 Calma · 🥱 Aburrimiento · 😤 Rabia · 😰 Nervios.
  Sustantivos, para no marcar género. Botón 🔊 para escuchar la pregunta (1°–2°).
- **Una pregunta lúdica que rota** por reflexión (`extraQuestionFor`, el servidor la manda en
  `reflectionQuestion` al iniciar la sesión): clima de la práctica ⛈️🌧️⛅☀️ (1–4), energía 🪫🔋⚡ (1–3)
  o lo más difícil 🤔 entender · 🧮 cuentas · 🌀 concentrarme · 😎 nada.
- Todo opcional; "Saltar" se registra vacío. La mascota agradece con una frase según la emoción. Nunca
  bloquea "Volver al inicio", aunque falle el guardado.
- Datos: `SessionReflection` (una por sesión, 409 si se repite, ligada a `mathSkillId` de la sesión:
  así la emoción queda asociada al **tema**). `POST /api/sessions/:id/reflection`.

## Panel familiar

1. **💛 Cómo se ha sentido al practicar** (14 días, `summarizeFeelings`): barras por emoción, clima y
   energía promedio, últimas prácticas con su tema, y **Cómo acompañar**: para cada emoción destacada,
   qué puede estar pasando, **💬 qué decir** (frases textuales) y **🤝 qué hacer**
   (`EMOTION_GUIDANCE`). Se destacan primero las emociones que piden acompañar (aburrimiento, rabia,
   nervios) si aparecen 2+ veces o son la más reciente; si no hay, se refuerza la positiva más
   frecuente. "Lo más difícil" repetido (2+) agrega un consejo (`HARDEST_GUIDANCE`). Siempre con la
   aclaración de que es lo que contó el niño, no un diagnóstico.
2. **🎲 Juegos para la casa**: hasta 3 temas que necesitan apoyo, por **pocos aciertos recientes** (menos
   del 70 % en los últimos 8 intentos, con al menos 4) y/o **una emoción difícil** (rabia o nervios) la
   última vez que practicó ese tema. Cada uno con su juego (`HOME_GAMES`, 46, uno por habilidad, ES/EN):
   emoji, nombre, minutos, materiales de la casa y 3 pasos. Botón **«¡Lo jugamos! ✅»** →
   `HomeGamePlay` (`POST /api/children/:id/home-games`) y contador "Jugado N veces 🎉".
3. **📈 Cómo va en cada tema** (`topicProgress`): barra de aciertos, tendencia (↗ mejorando / → estable
   / ↘ le está costando más, comparando los últimos 8 intentos con los anteriores; requiere 12+),
   emoción más reciente en ese tema y su juego desplegable.
4. Se mantienen el cruce ánimo × aciertos del check-in diario (spec 009) y los tips por tipo de error.

Los juegos reemplazan a las sugerencias de una línea de `familyTips.ts` (misma idea, ahora como juego).
El consentimiento menciona la pregunta del cierre.

## Pendiente de revisión humana

- Revisión pedagógica de los 46 juegos y de las frases de «qué decir / qué hacer».
- Umbrales (2 veces para destacar una emoción, 70 % / 8 intentos, tendencia ±10 puntos): decisiones de
  producto en `server/src/domain/feelings.ts`.
