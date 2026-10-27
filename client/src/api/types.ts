export interface AdultUser {
  id: string;
  email: string;
  /** true si la cuenta está en REVIEWER_EMAILS del servidor (modo revisión). */
  isReviewer?: boolean;
  /** true si tiene un rol (docente/directiva) en algún colegio (specs/014). */
  isStaff?: boolean;
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
  /** Hay una señal social para la familia (specs/018): «Para la familia» muestra un punto. */
  familyAlert?: boolean;
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
  /** Depende de una base de su Repaso aún no superada (specs/020): se recomienda hacer antes el repaso. */
  afterReview?: boolean;
}

/** Habilidad de un curso anterior que el niño debe reforzar (su Repaso, specs/020). */
export interface ReviewNode {
  id: string;
  grade: number;
  name: string;
  nameEn: string | null;
  oaCode: string | null;
  status: SkillStatus;
  correctCount: number;
}

export interface SkillPathResult {
  grade: number;
  skills: SkillNode[];
  review?: ReviewNode[];
  placedAt?: string | null;
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

/** Paso del desarrollo, en ambos idiomas (specs/015). */
export interface WorkedStep {
  es: string;
  en: string;
}
/** Paso donde una alternativa incorrecta se desvía, y cómo queda hecho con el error. */
export interface WrongStep extends WorkedStep {
  step: number;
}

/**
 * Ronda "encuentra el paso equivocado" (specs/015): el desarrollo de un
 * personaje, con los pasos correctos hasta el error y el paso equivocado; el
 * niño toca la línea donde se equivocó.
 */
export interface FindStepExercisePublic {
  mode: "find_step";
  id: string;
  prompt: string;
  promptEn?: string | null;
  difficultyLevel?: number;
  visual?: ExerciseVisualDescriptor | null;
  image?: ExerciseImagePublic | EmojiPictographPublic | null;
  lines: WorkedStep[];
  characterAnswerLabel: string;
  characterAnswerLabelEn: string | null;
  wrongOptionId: string;
}

export type NextExercisePublic = ExercisePublic | SpotErrorExercisePublic | FindStepExercisePublic;

/** Un paso de la evaluación de ubicación adaptativa (specs/020): la siguiente pregunta o el resultado. */
export type PlacementStep =
  | { done: false; sessionId?: string; exercise: ExercisePublic; answered: number; maxQuestions: number }
  | InitialAssessmentResult;

export interface InitialAssessmentResult {
  done: true;
  sessionId: string;
  correctCount: number;
  total: number;
  initialLevel: number;
  /** Habilidades de cursos anteriores que quedaron en su Repaso. */
  reviewCount: number;
}

export interface StartSessionResponse {
  sessionId: string;
  currentLevel: number;
  /** true en la primera práctica del día: toca preguntar el ánimo con caritas. */
  checkInDue?: boolean;
  /** Pregunta lúdica del cierre de esta sesión (rota entre sesiones). */
  reflectionQuestion?: ReflectionQuestion;
}

// ---- Reflexión al cerrar la práctica y panel familiar (specs/013) ----

export type Emotion = "orgullo" | "alegria" | "calma" | "aburrimiento" | "rabia" | "nervios";
export type Hardest = "entender" | "cuentas" | "concentrarme" | "nada";
export type ReflectionQuestion = "weather" | "energy" | "hardest";

export interface ReflectionInput {
  emotion?: Emotion;
  weather?: number;
  energy?: number;
  hardest?: Hardest;
}

type Bi = { es: string; en: string };

export interface HomeGame {
  emoji: string;
  name: Bi;
  minutes: number;
  materials: Bi;
  steps: { es: string[]; en: string[] };
}

export interface EmotionGuidance {
  emotion: Emotion;
  emoji: string;
  label: Bi;
  meaning: Bi;
  say: { es: string[]; en: string[] };
  do: { es: string[]; en: string[] };
}

export interface FeelingsSummary {
  answered: number;
  counts: Record<Emotion, number>;
  recent: Array<{ date: string; emotion: Emotion; skill: { id: string; name: string; nameEn: string | null } | null }>;
  weatherAvg: number | null;
  energyAvg: number | null;
  hardestCounts: Record<Hardest, number>;
  focus: Emotion[];
  guidance: EmotionGuidance[];
  hardestGuidance: { key: Exclude<Hardest, "nada">; emoji: string; label: Bi; tip: Bi } | null;
}

export interface TopicProgress {
  skillId: string;
  grade: number;
  name: string;
  nameEn: string | null;
  attempts: number;
  accuracy: number;
  trend: "up" | "down" | "steady" | null;
  lastPracticed: string;
  lastEmotion: Emotion | null;
  recentAttempts: number;
  recentCorrect: number;
  needsHelp: Array<"aciertos" | "emocion">;
  game: HomeGame | null;
  timesPlayed: number;
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
  /** Desarrollo paso a paso (specs/015), recién después de responder. */
  solution?: WorkedStep[] | null;
  /** Si se equivocó: el paso donde su alternativa se desvía. */
  wrongStep?: WrongStep | null;
  /** Solo en "encuentra el paso equivocado": la línea correcta y cómo debía ser. */
  correctLine?: number;
  correctStep?: WorkedStep | null;
}

export type CardStatus = "bien" | "atento" | "conversar" | "atencion" | "sin_datos" | "desactivado";
export type SocialReason =
  | "excluded_often"
  | "excluded_repeated"
  | "excluded_once"
  | "excluded_recent"
  | "alone_and_no_confidant"
  | "alone_recess"
  | "no_confidant";
export interface SocialAnswer {
  weekKey: string;
  recess: number | null;
  confidant: number | null;
  excluded: string | null;
}
export interface WeeklySummary {
  weekKey: string;
  learning: {
    status: CardStatus;
    practices: number;
    practicesPrev: number;
    attempts: number;
    accuracy: number | null;
    accuracyPrev: number | null;
    topics: Array<{ name: string; nameEn: string | null }>;
    focusTopic: { name: string; nameEn: string | null } | null;
  };
  feelings: { status: CardStatus; topEmotion: string | null; topEmotionPrev: string | null; moodAvg: number | null; moodAvgPrev: number | null };
  social: { status: CardStatus; answeredThisWeek: boolean };
}
export interface SocialPanelData {
  enabled: boolean;
  answeredWeeks: number;
  latest: SocialAnswer | null;
  history: SocialAnswer[];
  signal: { level: "conversar" | "atencion"; reasons: SocialReason[] } | null;
  notes: Array<{ key: string } & Bi>;
  guidance: {
    open: Bi[];
    avoid: Bi[];
    school: Bi;
    professional: Bi;
    urgent: Bi;
    resources: Bi;
    reasons: Array<{ key: SocialReason } & Bi>;
  } | null;
}

export interface ProgressResponse {
  /** "familia" (panel completo) o "gratis" (resumen básico). Piloto: todos en "familia". */
  plan?: "familia" | "gratis";
  week?: WeeklySummary;
  social?: SocialPanelData;
  /** Ubicación adaptativa y repaso de bases de cursos anteriores (specs/020). */
  placement?: { placedAt: string | null; review: ReviewNode[] };
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
  /** Emociones al cerrar las prácticas (14 días) con la guía para acompañar. */
  feelings?: FeelingsSummary;
  /** Evolución de cada tema practicado, con su juego para la casa. */
  topics?: TopicProgress[];
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
  game: HomeGame | null;
}

// ---- Modo revisión (specs/011-modo-revision) — solo cuentas revisoras ----

export interface ReviewSkill {
  id: string;
  name: string;
  nameEn: string | null;
  axis: string;
  axisEn: string | null;
  oaCode: string | null;
  exerciseCount: number;
  openComments: number;
}

export interface ReviewExerciseSummary {
  id: string;
  prompt: string;
  theme: string | null;
  /** Problema base: sus variantes temáticas comparten la misma clave. */
  groupKey: string;
  difficultyLevel: number;
  openComments: number;
}

export interface ReviewComment {
  id: string;
  text: string;
  createdAt: string;
  resolvedAt: string | null;
  author: string;
}

export interface ReviewExercise extends ExercisePublic {
  theme: string | null;
  skill: { id: string; grade: number; name: string; nameEn: string | null; oaCode: string | null };
  comments: ReviewComment[];
}

export interface ReviewAnswerResult extends AttemptResult {
  correctOptionId: string | null;
  /** Para revisar el contenido: el paso equivocado previsto de cada alternativa incorrecta. */
  allWrongSteps?: Array<{ label: string; labelEn: string | null; wrongStep: WrongStep }>;
}

export interface ReviewPendingComment extends ReviewComment {
  exercise: { id: string; prompt: string; theme: string | null; skill: { id: string; grade: number; name: string } };
}

// ---- Paneles escolares (specs/014-paneles-escolares) ----

export type MasteryLevel = "inicial" | "desarrollo" | "logrado" | "pocos" | "sin";

export interface SchoolMembership {
  schoolId: string;
  schoolName: string;
  role: "director" | "teacher";
  staffCode: string | null;
  classrooms: Array<{ id: string; name: string; grade: number; joinCode: string; students: number; mine: boolean }>;
}

export interface SchoolSkill {
  id: string;
  name: string;
  nameEn: string | null;
  oaCode: string | null;
  axis: string;
  axisEn: string | null;
  order: number;
  grade: number;
}

export interface MasteryCell {
  level: MasteryLevel;
  attempts: number;
  recentAccuracy: number | null;
  mainError: string | null;
}

export interface ParticipationRow {
  childId: string;
  lastPractice: string | null;
  daysSinceLast: number | null;
  sessions7d: number;
  minutes7d: number;
  inactive: boolean;
  hintRate: number | null;
  fastRate: number | null;
  homeGames: number;
}

export type TeacherRecommendation =
  | { kind: "reensenar"; skillId: string; inicial: number; assessed: number; errorCode: string | null }
  | { kind: "grupo"; skillId: string; childIds: string[]; errorCode: string | null }
  | { kind: "inactivos"; childIds: string[] }
  | { kind: "emocion_tema"; skillId: string; reports: number; students: number };

export interface TeacherDashboardData {
  classroom: { id: string; name: string; grade: number; joinCode: string };
  students: Array<{ id: string; name: string; shareEmotions: boolean }>;
  skills: SchoolSkill[];
  heatmap: Record<string, Record<string, MasteryCell>>;
  skillSummary: Array<{ skillId: string; levels: Record<MasteryLevel, number>; assessed: number; topError: { code: string; count: number } | null }>;
  groups: Array<{ skillId: string; errorCode: string | null; childIds: string[] }>;
  participation: ParticipationRow[];
  week: { activeStudents: number; minutes: number; sessions: number };
  climate: {
    emotionCounts: Record<Emotion, number>;
    reporters: number;
    difficultSkills: Array<{ skillId: string; reports: number; students: number }>;
    alerts: Array<{ childId: string; reason: "emociones_dificiles" | "animo_bajo"; count: number; skillId: string | null }>;
  };
  coverage: { practiced: number; total: number };
  actions: TeacherRecommendation[];
}

export interface StudentFileData {
  student: { id: string; name: string; shareEmotions: boolean };
  /** Ubicación adaptativa y repaso de bases de cursos anteriores (specs/020). */
  placement?: { placedAt: string | null; review: ReviewNode[] };
  skills: SchoolSkill[];
  cells: Record<string, MasteryCell>;
  trends: Record<string, "up" | "down" | "steady" | null>;
  errorBreakdown: Record<string, number>;
  participation: ParticipationRow;
  emotions: Array<{ date: string; emotion: Emotion; skillId: string | null }> | null;
  notes: Array<{ id: string; text: string; createdAt: string; author: string }>;
}

export type Guarded<T> = { ok: true; value: T; students: number } | { ok: false; students: number };

export interface DirectorDashboardData {
  school: { id: string; name: string; staffCode: string };
  skills: SchoolSkill[];
  totals: { classes: number; students: number; activeStudents7d: number; teachersUsingPanel7d: number; teachers: number };
  masteryByGradeAxis: Array<{ grade: number; axis: string; axisEn: string | null; logrado: Guarded<number> }>;
  monthly: Array<{ grade: number; month: string; accuracy: Guarded<number> }>;
  classes: Array<{
    id: string;
    name: string;
    grade: number;
    teacherEmail: string;
    teacherLastPanelAt: string | null;
    enrolled: number;
    active7d: number;
    minutes7d: number;
    logrado: Guarded<number>;
    difficultEmotionShare: Guarded<number>;
    homeGames: number;
  }>;
  parallel: Array<{ grade: number; skillId: string; byClass: Array<{ classId: string; logrado: Guarded<number> }> }>;
  wellbeingByGrade: Array<{ grade: number; counts: Guarded<Record<Emotion, number>> }>;
  alerts: Array<
    | { kind: "baja_aciertos"; grade: number; before: number; after: number }
    | { kind: "emociones_dificiles"; classId: string; share: number }
    | { kind: "baja_participacion"; classId: string; share: number }
  >;
}

export interface ChildEnrollment {
  classroomName: string;
  schoolName: string;
  grade: number;
  shareEmotions: boolean;
}
