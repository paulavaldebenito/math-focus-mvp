# Plan — Modo revisión

- **Servidor:** `src/auth/reviewer.ts` (`isReviewerEmail`, `requireReviewer`, `adultPublic` con
  `isReviewer` en `/auth/login` y `/auth/me`); `src/routes/review.ts` montado en `/api/review`:
  - `GET /skills?grade=1..6` — habilidades con nº de ejercicios y comentarios pendientes.
  - `GET /skills/:id/exercises` — lista ordenada por nivel y problema base (variantes juntas,
    neutra primero).
  - `GET /exercises/:id` — formato "solve" + tema, habilidad y comentarios.
  - `POST /exercises/:id/answer` — mismo contenido que un intento real + `correctOptionId`; no
    escribe nada.
  - `POST /exercises/:id/comments`, `DELETE /comments/:id` (solo la autora), `GET /comments`
    (pendientes).
- **Schema:** modelo `ReviewComment` (migración `20261021120000_comentarios_de_revision`).
- **Cliente:** `ReviewScreen` (curso → habilidad → ejercicio, anterior/siguiente, "ir al
  ejercicio", responder de nuevo, comentarios, lista de pendientes). Reutiliza
  `ExerciseIllustration`, las clases de `PracticeScreen` y `wrongFeedbackText` (movida a
  `lib/feedback.ts`). Botón flotante "🔍 Revisar preguntas" solo si `adult.isReviewer`; se puede
  entrar antes de crear un niño y al salir el flujo normal sigue donde estaba.
