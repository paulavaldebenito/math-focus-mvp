# Spec — Modo revisión

**Fecha:** 2026-10-21

## Qué

Una revisora (cuenta adulta autorizada) recorre el banco completo de 1° a 6° básico y responde cada
pregunta **como la vería un estudiante**: la misma ilustración, alternativas mezcladas, botón de
pista, tarjeta de feedback de la alternativa elegida y "Así se resuelve" al fallar. Puede dejar
comentarios por pregunta para corregir el banco después.

## Reglas

- Acceso solo para las cuentas listadas en `REVIEWER_EMAILS` (servidor, separadas por coma). Sin la
  variable, nadie es revisora. Una familia cualquiera nunca ve el banco completo ni las respuestas.
- Responder en revisión **no** crea `Session`, `Attempt`, `StarEvent` ni `AdaptiveDecision`: no toca
  el progreso de ningún niño.
- La pregunta se envía igual que en `/next-exercise` modo "solve" (sin `isCorrect`). Recién al
  responder se revela el feedback de la alternativa y, solo para la revisora, cuál era la correcta.
- Comentarios (`ReviewComment`): texto libre por ejercicio, con autora y fecha; la autora puede
  borrarlos. `resolvedAt` lo marca quien corrige el banco cuando el comentario ya se atendió.
- Fuera de alcance: rondas "detecta el error" (se derivan de las alternativas ya revisadas), editar
  el banco desde la app, roles/permisos más allá de la lista de correos.
