import type { AttemptResult } from "../api/types.js";
import { ERROR_FEEDBACK, FEEDBACK_RETRY_VARIANTS, localize, t, type Lang } from "./i18n.js";

/**
 * Mensaje de feedback al equivocarse: prioriza el mensaje propio de la
 * alternativa elegida (si el ejercicio lo tiene) y luego la explicación
 * concreta del tipo de error clasificado (ver ERROR_FEEDBACK) y, en último caso, una variante
 * genérica cálida. Si respondió muy rápido, el aviso "respondiste muy rápido" va delante de
 * cualquiera de ellos (antes se perdía cuando había un mensaje concreto).
 * Se resuelve una sola vez por intento (no en cada render) para que no
 * cambie de texto mientras la tarjeta de feedback sigue en pantalla.
 */
export function wrongFeedbackText(lang: Lang, result: AttemptResult): string {
  // Si respondió muy rápido, el aviso va primero y no se pierde aunque haya un mensaje más concreto.
  const fast = result.action.ruleCode === "FAST_THEN_WRONG" ? `${t(lang, "feedbackReview")} ` : "";
  if (result.feedback) return fast + localize(lang, result.feedback, result.feedbackEn);
  const specific = result.errorCode ? ERROR_FEEDBACK[lang][result.errorCode] : undefined;
  if (specific) return fast + specific;
  if (fast) return t(lang, "feedbackReview");
  const variants = FEEDBACK_RETRY_VARIANTS[lang];
  return variants[Math.floor(Math.random() * variants.length)]!;
}
