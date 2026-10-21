import type { AttemptResult } from "../api/types.js";
import { ERROR_FEEDBACK, FEEDBACK_RETRY_VARIANTS, localize, t, type Lang } from "./i18n.js";

/**
 * Mensaje de feedback al equivocarse: prioriza el mensaje propio de la
 * alternativa elegida (si el ejercicio lo tiene) y luego la explicación
 * concreta del tipo de error clasificado (ver ERROR_FEEDBACK) por sobre el aviso genérico
 * de "responde muy rápido" y, en último caso, una variante genérica cálida.
 * Se resuelve una sola vez por intento (no en cada render) para que no
 * cambie de texto mientras la tarjeta de feedback sigue en pantalla.
 */
export function wrongFeedbackText(lang: Lang, result: AttemptResult): string {
  if (result.feedback) return localize(lang, result.feedback, result.feedbackEn);
  const specific = result.errorCode ? ERROR_FEEDBACK[lang][result.errorCode] : undefined;
  if (specific) return specific;
  if (result.action.ruleCode === "FAST_THEN_WRONG") return t(lang, "feedbackReview");
  const variants = FEEDBACK_RETRY_VARIANTS[lang];
  return variants[Math.floor(Math.random() * variants.length)]!;
}
