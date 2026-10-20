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
  /** Nombre propio que el niño le puso a su mascota — null usa el nombre
   * por defecto del personaje (ver companions.ts). */
  mascotName?: string | null;
  interests?: string[];
}

export interface HomeSummary {
  companion: string | null;
  mascotName: string | null;
  /** Nombre propio que el niño le puso a cada mascota (por clave). */
  mascotNames?: Record<string, string>;
  interests: string[];
  totalStars: number;
  starsToday: number;
  streak: number;
  rank: number;
  starsIntoRank: number;
  starsToNextRank: number;
}

export type SkillStatus = "locked" | "available" | "completed";

export interface SkillNode {
  id: string;
  grade: number;
  axis: string;
  name: string;
  /** Traducción al inglés — null cae de vuelta al español si falta. */
  axisEn: string | null;
  nameEn: string | null;
  oaCode: string | null;
  order: number;
  status: SkillStatus;
  correctCount: number;
}

export interface SkillPathResult {
  grade: number;
  skills: SkillNode[];
}

export interface ExerciseOptionPublic {
  id: string;
  label: string;
  /** Traducción al inglés — ausente/null si la alternativa no cambia entre idiomas. */
  labelEn?: string | null;
}

/**
 * Ilustración SVG del banco de imágenes por curso, una por idioma. Si está,
 * se muestra en lugar de `visual`; el enunciado sigue siendo texto.
 */
export interface ExerciseImagePublic {
  kind: string;
  /** "banco_visual" = banco visual completo 1°–6° (sin palabras incrustadas). */
  source?: string;
  size: Record<"es" | "en", { width: number; height: number }>;
  src: Record<"es" | "en", string>;
  alt: Record<"es" | "en", string>;
  /** Qué significan las letras A, B, C dibujadas — texto de interfaz, fuera de la imagen. */
  legend?: ImageLegend;
}

/**
 * Pictograma de emojis (1.° y 2.° básico, 1 dibujo = 1): cada fila es una
 * categoría con su emoji repetido y su nombre — sin letras ni leyenda aparte.
 */
export interface EmojiPictographPublic {
  kind: "pictograph";
  source: "emoji_pictograph";
  rows: Array<{ emoji: string; count: number; label: Record<"es" | "en", string> | null }>;
  alt: Record<"es" | "en", string>;
}

export function isEmojiPictograph(image: ExerciseImagePublic | EmojiPictographPublic): image is EmojiPictographPublic {
  return image.source === "emoji_pictograph";
}

export interface ImageLegendItem {
  key: string;
  label: Record<"es" | "en", string>;
  /** La letra corresponde a esta alternativa (se muestra su texto actual, aunque se mezclen). */
  optionId?: string;
}

export type ImageLegend =
  | { type: "none" }
  | { type: "named"; source: string; items: ImageLegendItem[] }
  | { type: "generic"; text: Record<"es" | "en", string>; reason?: string };

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
  /** Ausente en fixtures viejos de prueba — tratar como "solve" si falta. */
  mode?: "solve";
  id: string;
  prompt: string;
  /** Traducción al inglés — puede faltar; el contenido cae de vuelta al español si es así. */
  promptEn?: string | null;
  difficultyLevel?: number;
  options: ExerciseOptionPublic[];
  /** Ausente si el ejercicio todavía no tiene una representación concreta cargada. */
  visual?: ExerciseVisualDescriptor | null;
  /** Ausente/null si el ejercicio no tiene ilustración — se usa `visual`. */
  image?: ExerciseImagePublic | EmojiPictographPublic | null;
  /** Solo presente en /next-exercise. Se muestra únicamente si el niño pide una pista. */
  procedureNote?: string;
  procedureNoteEn?: string | null;
}

/**
 * Ronda "detecta el error": en vez de resolver desde cero, se le muestra al
 * niño una respuesta ajena ya errada y clasificada, y elige qué le pasó —
 * las alternativas son códigos de ErrorType (ver ERROR_FEEDBACK/DIAGNOSIS_CHIPS
 * en lib/i18n.ts para su texto localizado), nunca la explicación en texto
 * plano (así el servidor decide qué mostrar en cada idioma, mismo patrón
 * que prompt/promptEn).
 */
export interface SpotErrorExercisePublic {
  mode: "spot_error";
  id: string;
  prompt: string;
  promptEn?: string | null;
  difficultyLevel?: number;
  visual?: ExerciseVisualDescriptor | null;
  image?: ExerciseImagePublic | EmojiPictographPublic | null;
  /** La respuesta (incorrecta) que dio el personaje — segura de mostrar. */
  characterAnswerLabel: string;
  characterAnswerLabelEn?: string | null;
  /** Se revela recién en el feedback, tras diagnosticar. */
  correctAnswerLabel: string;
  correctAnswerLabelEn?: string | null;
  /** Se manda de vuelta al enviar el diagnóstico — identifica cuál
   * alternativa real está representando esta ronda. */
  wrongOptionId: string;
  /** La correcta + 2 distractores, ya mezclados. */
  explanationOptions: string[];
  procedureNote?: string;
  procedureNoteEn?: string | null;
}

export type NextExercisePublic = ExercisePublic | SpotErrorExercisePublic;

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
  /** true en la primera práctica del día: toca preguntar el ánimo con caritas. */
  checkInDue?: boolean;
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
  /** Código del tipo de error (p.ej. "E1_OP"), null si acertó o si esa
   * alternativa aún no está clasificada — el cliente cae de vuelta al
   * mensaje genérico cuando no hay código. */
  errorCode: string | null;
  /** Mensaje propio de la alternativa elegida (acierto o error), solo si el
   * ejercicio lo tiene; si no, el cliente usa el mensaje del tipo de error
   * o una variante genérica. */
  feedback?: string | null;
  feedbackEn?: string | null;
  /** true si esta respuesta correcta completó una racha de 3 (o múltiplo)
   * y sumó una estrella extra, aditiva — nunca se resta al cortar la racha. */
  bonusStarAwarded: boolean;
  /** Solo en respuestas de una ronda "detecta el error": el código real,
   * revelado recién después de diagnosticar (haya acertado o no). */
  correctCode?: string;
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
  /** Cruce del ánimo autorreportado (1 por día) con la precisión de ese día. */
  wellbeing?: WellbeingCross;
  /** Contenidos con menos aciertos, cada uno con una sugerencia para la casa. */
  skillsToReview?: SkillToReview[];
}

export interface WellbeingDay {
  date: string;
  mood: number | null;
  mathFeeling: number | null;
  attempts: number;
  correct: number;
  accuracy: number | null;
}

export interface GroupAccuracy {
  days: number;
  accuracy: number | null;
}

export interface WellbeingCross {
  days: WellbeingDay[];
  comparison: { moodLow: GroupAccuracy; moodHigh: GroupAccuracy; mathNervous: GroupAccuracy; mathCalm: GroupAccuracy };
  recentMathFeeling: number | null;
}

export interface SkillToReview {
  skillId: string;
  grade: number;
  name: string;
  nameEn: string | null;
  attempts: number;
  accuracy: number;
  tip: { es: string; en: string } | null;
}
