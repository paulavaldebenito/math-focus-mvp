/**
 * "Detecta el error": en vez de resolver un ejercicio desde cero, el niño
 * diagnostica una respuesta ajena ya errada y clasificada (reutiliza el
 * mismo ErrorType que ya usan las alternativas normales). Módulo puro y
 * sin BD, mismo patrón que exercises/select.ts y skillPath/skillPath.ts —
 * la ruta (routes/sessions.ts) solo aporta los datos y guarda el resultado.
 */

/// Códigos de ErrorType "diagnosticables" — los que describen por qué UNA
/// alternativa está mal (ver seed.ts). Deja fuera a propósito los patrones
/// de comportamiento (respuesta_rapida/abandono/solicitud_ayuda_repetida):
/// esos son señales de sesión, no algo que se "detecte" mirando una
/// respuesta ajena.
export const SPOT_ERROR_CODES = ["E1_OP", "E2_RES", "E2_CAL", "E3_PREG", "E3_DATO"] as const;

/// Cada cuántas preguntas se ofrece una ronda de este tipo (si hay un
/// ejercicio elegible) en vez de una pregunta normal — decisión de diseño
/// del juego, mismo criterio que STREAK_BONUS_EVERY en routes/sessions.ts.
export const SPOT_ERROR_EVERY = 3;

export interface SpotErrorOption {
  id: string;
  label: string;
  /// Traducción al inglés — null si la alternativa no cambia entre idiomas.
  labelEn?: string | null;
  isCorrect: boolean;
  errorType: { code: string } | null;
}

export interface SpotErrorExercise {
  id: string;
  prompt: string;
  options: SpotErrorOption[];
}

/// true si, dado cuántas preguntas ya se respondieron en la sesión, esta
/// pregunta debería intentar ser una ronda de detectar el error (todavía
/// sujeto a que exista un ejercicio elegible en el pool — ver isEligible).
export function wantsSpotErrorRound(alreadyAttemptedCount: number, every: number = SPOT_ERROR_EVERY): boolean {
  return alreadyAttemptedCount > 0 && alreadyAttemptedCount % every === 0;
}

/// Preguntas del tipo "¿Cuál de estos/estas...?" (comparar, identificar u
/// ordenar entre varias alternativas dadas) no calzan con esta mecánica: en
/// muchas de ellas los valores a comparar existen SOLO en las alternativas,
/// no en el enunciado (p. ej. "¿Cuál de estos valores es el mayor?" con
/// 7/10, 68%, 0,65 y 3/5 solo como opciones). Mostrar una sola alternativa
/// suelta como "la respuesta de tu amigo" deja la pregunta sin sentido —
/// bug real reportado por un usuario ("no se entiende la pregunta"). Se
/// excluyen todas, aunque algunas sí listan los valores en el enunciado,
/// porque no hay forma barata de distinguir unas de otras y el costo de
/// equivocarse (una pregunta incomprensible) es peor que ofrecer una ronda
/// menos de esta mecánica.
const SELECTION_AMONG_OPTIONS_PATTERN = /cu[aá]l(es)?\s+de\s+(est|aquell)/i;

/// Un ejercicio sirve para esta mecánica si su enunciado no depende de ver
/// todas las alternativas juntas, y tiene al menos una alternativa
/// incorrecta con un ErrorType clasificado y diagnosticable.
export function isSpotErrorEligible(ex: SpotErrorExercise): boolean {
  if (SELECTION_AMONG_OPTIONS_PATTERN.test(ex.prompt)) return false;
  return ex.options.some(
    (o) => !o.isCorrect && o.errorType !== null && (SPOT_ERROR_CODES as readonly string[]).includes(o.errorType.code),
  );
}

export interface SpotErrorRound {
  wrongOptionId: string;
  characterAnswerLabel: string;
  characterAnswerLabelEn: string | null;
  correctAnswerLabel: string;
  correctAnswerLabelEn: string | null;
  /// La correcta + 2 distractores, ya mezclados — el cliente los muestra
  /// como botones de diagnóstico (uno de estos códigos, nunca el label).
  explanationOptions: string[];
}

function shuffleWithRng<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/// Arma una ronda a partir de un ejercicio ya elegible (`isSpotErrorEligible`
/// debe haber devuelto true) — null si no lo era, para que el llamador
/// pueda decidir caer de vuelta a una pregunta normal en vez de reventar.
/// `rng` inyectable (mismo patrón que pickExercise) para pruebas
/// determinísticas: cuál alternativa se muestra y qué distractores salen.
export function buildSpotErrorRound(ex: SpotErrorExercise, rng: () => number = Math.random): SpotErrorRound | null {
  const classifiedWrong = ex.options.filter(
    (o) => !o.isCorrect && o.errorType !== null && (SPOT_ERROR_CODES as readonly string[]).includes(o.errorType.code),
  );
  const correctOption = ex.options.find((o) => o.isCorrect);
  if (classifiedWrong.length === 0 || !correctOption) return null;

  const wrongOption = classifiedWrong[Math.floor(rng() * classifiedWrong.length)]!;
  const realCode = wrongOption.errorType!.code;
  const otherCodes = SPOT_ERROR_CODES.filter((c) => c !== realCode);
  const distractorCodes = shuffleWithRng(otherCodes, rng).slice(0, 2);

  return {
    wrongOptionId: wrongOption.id,
    characterAnswerLabel: wrongOption.label,
    characterAnswerLabelEn: wrongOption.labelEn ?? null,
    correctAnswerLabel: correctOption.label,
    correctAnswerLabelEn: correctOption.labelEn ?? null,
    explanationOptions: shuffleWithRng([realCode, ...distractorCodes], rng),
  };
}

// ---------- "Encuentra el paso equivocado" (specs/015) ----------

export interface Bilingual {
  es: string;
  en: string;
}
export interface WrongStep extends Bilingual {
  step: number;
}
export interface FindStepExercise extends SpotErrorExercise {
  solution: unknown;
  options: Array<SpotErrorOption & { wrongStep: unknown }>;
}
export interface FindStepRound {
  wrongOptionId: string;
  /** Desarrollo del personaje: pasos correctos hasta el error y el paso equivocado (el último). */
  lines: Bilingual[];
  characterAnswerLabel: string;
  characterAnswerLabelEn: string | null;
}

const asSteps = (x: unknown): Bilingual[] | null => (Array.isArray(x) && x.every((s) => s && typeof s.es === "string") ? (x as Bilingual[]) : null);
const asWrong = (x: unknown): WrongStep | null => (x && typeof (x as WrongStep).step === "number" ? (x as WrongStep) : null);

/// Alternativas que sirven para la ronda: incorrectas, con su paso equivocado
/// y con al menos un paso correcto antes (si el error está en el primer paso,
/// no hay nada que revisar antes de encontrarlo).
function findStepCandidates(ex: FindStepExercise) {
  const steps = asSteps(ex.solution);
  if (!steps || SELECTION_AMONG_OPTIONS_PATTERN.test(ex.prompt)) return [];
  return ex.options.filter((o) => {
    const w = asWrong(o.wrongStep);
    return !o.isCorrect && w !== null && w.step >= 1 && w.step < steps.length;
  });
}

export function isFindStepEligible(ex: FindStepExercise): boolean {
  return findStepCandidates(ex).length > 0;
}

export function buildFindStepRound(ex: FindStepExercise, rng: () => number = Math.random): FindStepRound | null {
  const candidates = findStepCandidates(ex);
  const steps = asSteps(ex.solution);
  if (candidates.length === 0 || !steps) return null;
  const option = candidates[Math.floor(rng() * candidates.length)]!;
  const w = asWrong(option.wrongStep)!;
  return {
    wrongOptionId: option.id,
    lines: [...steps.slice(0, w.step), { es: w.es, en: w.en }],
    characterAnswerLabel: option.label,
    characterAnswerLabelEn: option.labelEn ?? null,
  };
}
