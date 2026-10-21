# Tasks — Modo revisión

**Última revisión:** 2026-10-21

- [x] Alcance con la usuaria: modo revisión dentro de la app (no página aparte ni niños de prueba),
      con comentarios por pregunta; acceso a todos los cursos solo para revisar.
- [x] Servidor: `reviewer.ts`, `routes/review.ts`, `isReviewer` en login/me, `ReviewComment` +
      migración, `REVIEWER_EMAILS` en `.env.example`.
- [x] Test de integración `review.integration.test.ts`: 401/403, cursos 1–6, ejercicio sin
      `isCorrect`, responder no crea intentos, correcta revelada, comentarios (solo la autora borra).
- [x] Cliente: `ReviewScreen` + test, textos ES/EN, estilos, entrada en `App.tsx`.
- [x] Verificado en la app real (Chrome, 420 px): curso → habilidad → pregunta, respuesta errada
      con feedback de la alternativa, estrategia y correcta; comentario guardado y contado.
- [ ] Al desplegar en AWS: definir `REVIEWER_EMAILS` en el entorno del servidor.
