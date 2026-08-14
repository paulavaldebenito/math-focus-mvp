export interface AdultUser {
  id: string;
  email: string;
}

export interface Consent {
  id: string;
  scope: string;
  grantedAt: string;
}

export interface ChildProfile {
  id: string;
  displayName: string;
  grade: number;
  language: string;
  companion?: string | null;
}

export interface HomeSummary {
  companion: string | null;
  totalStars: number;
  starsToday: number;
  streak: number;
}

export interface ExerciseOptionPublic {
  id: string;
  label: string;
}

/**
 * Representación concreta/pictórica de un ejercicio, para niños que aún no
 * leen con soltura: dos grupos a combinar (suma), o un grupo del que se
 * quita una cantidad (resta).
 */
export type ExerciseVisualDescriptor =
  | { kind: "combine"; a: number; b: number; emoji?: string }
  | { kind: "takeaway"; total: number; removed: number; emoji?: string }
  | { kind: "compare"; a: number; b: number; emoji?: string };

export interface ExercisePublic {
  id: string;
  prompt: string;
  /** Traducción al inglés — puede faltar; el contenido cae de vuelta al español si es así. */
  promptEn?: string | null;
  difficultyLevel?: number;
  options: ExerciseOptionPublic[];
  /** Ausente si el ejercicio todavía no tiene una representación concreta cargada. */
  visual?: ExerciseVisualDescriptor | null;
  /** Solo presente en /next-exercise. Se muestra únicamente si el niño pide una pista. */
  procedureNote?: string;
  procedureNoteEn?: string | null;
}

export interface InitialAssessmentResponse {
  exercises: ExercisePublic[];
}

export interface InitialAssessmentResult {
  sessionId: string;
  correctCount: number;
  total: number;
  initialLevel: number;
}

export interface StartSessionResponse {
  sessionId: string;
  currentLevel: number;
}

export type AdaptiveAction =
  | { type: "OFFER_PAUSE"; ruleCode: "FATIGUE_SIGNAL"; reason: string }
  | { type: "LOWER_LEVEL"; ruleCode: "TWO_CONCEPTUAL_ERRORS"; reason: string; representation: "visual" }
  | { type: "SUGGEST_REVIEW_PROMPT"; ruleCode: "FAST_THEN_WRONG"; reason: string }
  | { type: "KEEP_LEVEL_CHANGE_EXPLANATION"; ruleCode: "REPEATED_HINTS"; reason: string }
  | { type: "RAISE_LEVEL"; ruleCode: "THREE_CORRECT_NO_HELP"; reason: string }
  | { type: "NO_CHANGE"; ruleCode: "NO_RULE_TRIGGERED"; reason: string };

export interface AttemptResult {
  isCorrect: boolean;
  action: AdaptiveAction;
  level: number;
}

export interface ProgressResponse {
  child: { id: string; displayName: string; grade: number };
  currentLevel: number;
  totalSessions: number;
  lastSessionAt: string | null;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number | null;
  errorBreakdown: Record<string, number>;
}
