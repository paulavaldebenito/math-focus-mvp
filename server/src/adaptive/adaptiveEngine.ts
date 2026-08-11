/**
 * Motor adaptativo: reglas deterministas y auditables, SIN IA.
 *
 * Cada regla está documentada tal como la especificó el equipo del
 * proyecto. Cuando más de una regla podría aplicar sobre el mismo
 * historial, se evalúan en el orden de prioridad de abajo y se devuelve
 * SOLO la primera que aplique — nunca una combinación implícita.
 *
 * Prioridad (de mayor a menor), y por qué:
 *   1. Señales de cansancio → ofrecer pausa.
 *      Regular el estado del niño va antes que ajustar dificultad: no
 *      tiene sentido subir/bajar nivel si primero necesita un descanso.
 *   2. Dos errores conceptuales consecutivos → bajar nivel + representación visual.
 *   3. Error justo después de una respuesta muy rápida → sugerir revisar el enunciado.
 *   4. Uso repetido de pistas → mantener nivel, cambiar la explicación.
 *   5. Tres aciertos sin ayuda → subir nivel.
 */

export type ErrorTypeCode =
  | "conceptual"
  | "procedimiento"
  | "calculo"
  | "comprension_enunciado"
  | "omision"
  | "respuesta_rapida"
  | "abandono"
  | "solicitud_ayuda_repetida";

export interface AttemptRecord {
  isCorrect: boolean;
  errorTypeCode: ErrorTypeCode | null;
  responseTimeMs: number | null;
  hintsUsed: number;
}

export type AdaptiveAction =
  | { type: "OFFER_PAUSE"; ruleCode: "FATIGUE_SIGNAL"; reason: string; blocksProgress: false }
  | {
      type: "LOWER_LEVEL";
      ruleCode: "TWO_CONCEPTUAL_ERRORS";
      reason: string;
      representation: "visual";
    }
  | { type: "SUGGEST_REVIEW_PROMPT"; ruleCode: "FAST_THEN_WRONG"; reason: string }
  | { type: "KEEP_LEVEL_CHANGE_EXPLANATION"; ruleCode: "REPEATED_HINTS"; reason: string }
  | { type: "RAISE_LEVEL"; ruleCode: "THREE_CORRECT_NO_HELP"; reason: string }
  | { type: "NO_CHANGE"; ruleCode: "NO_RULE_TRIGGERED"; reason: string };

// Supuesto de diseño, NO un umbral clínico validado: 2.8s como referencia de
// "respuesta muy rápida", tomado de un documento de trabajo de un proyecto
// relacionado (MateFriendly). Pendiente de validación con el equipo
// psicopedagógico antes de usarse en producción.
const FAST_RESPONSE_THRESHOLD_MS = 2800;

function lastN<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

export function evaluateAdaptiveRules(history: AttemptRecord[]): AdaptiveAction {
  // Regla 1 — cansancio: 3 respuestas incorrectas seguidas, de cualquier tipo.
  const last3 = lastN(history, 3);
  if (last3.length === 3 && last3.every((a) => !a.isCorrect)) {
    return {
      type: "OFFER_PAUSE",
      ruleCode: "FATIGUE_SIGNAL",
      reason: "3 respuestas incorrectas consecutivas — posible señal de cansancio.",
      blocksProgress: false,
    };
  }

  // Regla 2 — 2 errores conceptuales consecutivos.
  const last2 = lastN(history, 2);
  if (
    last2.length === 2 &&
    last2.every((a) => !a.isCorrect && a.errorTypeCode === "conceptual")
  ) {
    return {
      type: "LOWER_LEVEL",
      ruleCode: "TWO_CONCEPTUAL_ERRORS",
      reason: "2 errores conceptuales consecutivos.",
      representation: "visual",
    };
  }

  // Regla 3 — error justo después de una respuesta muy rápida.
  const lastAttempt = history[history.length - 1];
  if (
    lastAttempt &&
    !lastAttempt.isCorrect &&
    lastAttempt.responseTimeMs !== null &&
    lastAttempt.responseTimeMs < FAST_RESPONSE_THRESHOLD_MS
  ) {
    return {
      type: "SUGGEST_REVIEW_PROMPT",
      ruleCode: "FAST_THEN_WRONG",
      reason: `Respuesta en ${lastAttempt.responseTimeMs}ms (menor a ${FAST_RESPONSE_THRESHOLD_MS}ms) seguida de error.`,
    };
  }

  // Regla 4 — uso repetido de pistas en las últimas 2 preguntas.
  if (last2.length === 2 && last2.every((a) => a.hintsUsed >= 1)) {
    return {
      type: "KEEP_LEVEL_CHANGE_EXPLANATION",
      ruleCode: "REPEATED_HINTS",
      reason: "Pistas usadas en las últimas 2 preguntas.",
    };
  }

  // Regla 5 — 3 aciertos seguidos sin pistas.
  if (last3.length === 3 && last3.every((a) => a.isCorrect && a.hintsUsed === 0)) {
    return {
      type: "RAISE_LEVEL",
      ruleCode: "THREE_CORRECT_NO_HELP",
      reason: "3 respuestas correctas consecutivas sin usar pistas.",
    };
  }

  return { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "Ninguna regla aplicó." };
}

export function applyLevelChange(currentLevel: number, action: AdaptiveAction): number {
  if (action.type === "LOWER_LEVEL") return Math.max(1, currentLevel - 1);
  if (action.type === "RAISE_LEVEL") return Math.min(3, currentLevel + 1);
  return currentLevel;
}
