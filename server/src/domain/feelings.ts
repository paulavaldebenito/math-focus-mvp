/**
 * Emociones al terminar una práctica y su uso en el panel familiar
 * (specs/013). Funciones puras, sin BD (mismo patrón que wellbeing.ts).
 * Todo es DESCRIPTIVO y para acompañar en casa: nunca un diagnóstico ni
 * lenguaje clínico. La guía para la familia es de frases concretas («qué
 * decir») y acciones («qué hacer»), sin culpar al niño ni a la familia.
 */
import type { Bilingual } from "./homeGames.js";

export const EMOTIONS = ["orgullo", "alegria", "calma", "aburrimiento", "rabia", "nervios"] as const;
export type Emotion = (typeof EMOTIONS)[number];
/// Emociones que piden acompañar más de cerca (las otras se refuerzan).
export const NEEDS_SUPPORT: readonly Emotion[] = ["aburrimiento", "rabia", "nervios"];

export const HARDEST = ["entender", "cuentas", "concentrarme", "nada"] as const;
export type Hardest = (typeof HARDEST)[number];

/// Pregunta lúdica que acompaña a la de emociones; rota por reflexión.
export const EXTRA_QUESTIONS = ["weather", "energy", "hardest"] as const;
export type ExtraQuestion = (typeof EXTRA_QUESTIONS)[number];

export function extraQuestionFor(previousReflections: number): ExtraQuestion {
  return EXTRA_QUESTIONS[previousReflections % EXTRA_QUESTIONS.length]!;
}

export interface Guidance {
  emoji: string;
  label: Bilingual;
  /** Qué puede estar pasando, en una frase y sin afirmarlo como causa. */
  meaning: Bilingual;
  say: { es: string[]; en: string[] };
  do: { es: string[]; en: string[] };
}

export const EMOTION_GUIDANCE: Record<Emotion, Guidance> = {
  orgullo: {
    emoji: "🤩",
    label: { es: "Orgullo", en: "Pride" },
    meaning: { es: "Siente que lo logró.", en: "They feel they did it." },
    say: {
      es: ["«Se nota todo lo que te esforzaste.»", "«¿Cómo lo hiciste? Enséñame.»"],
      en: ["“I can tell how hard you worked.”", "“How did you do it? Teach me.”"],
    },
    do: {
      es: ["Pídele que te explique lo que aprendió: explicar ayuda a que se quede.", "Celebren el esfuerzo, no solo el resultado."],
      en: ["Ask them to explain what they learned: explaining helps it stick.", "Celebrate the effort, not just the result."],
    },
  },
  alegria: {
    emoji: "😊",
    label: { es: "Alegría", en: "Joy" },
    meaning: { es: "Disfrutó la práctica.", en: "They enjoyed the practice." },
    say: {
      es: ["«¿Qué fue lo que más te gustó?»", "«Me encanta verte disfrutar aprendiendo.»"],
      en: ["“What did you like most?”", "“I love seeing you enjoy learning.”"],
    },
    do: {
      es: ["Mantengan el horario y la duración que les funcionaron.", "Jueguen juntos uno de los juegos para la casa."],
      en: ["Keep the time of day and length that worked for you.", "Play one of the home games together."],
    },
  },
  calma: {
    emoji: "😌",
    label: { es: "Calma", en: "Calm" },
    meaning: { es: "Practicó con tranquilidad.", en: "They practiced calmly." },
    say: {
      es: ["«Te vi con mucha concentración.»", "«¿Te animas a probar algo un poco más desafiante?»"],
      en: ["“I saw how focused you were.”", "“Want to try something a bit more challenging?”"],
    },
    do: {
      es: ["Es un buen momento para un desafío pequeño o un tema nuevo del mapa.", "Reconozcan la constancia: practicar seguido es lo que más ayuda."],
      en: ["It’s a good moment for a small challenge or a new topic on the map.", "Recognize the consistency: practicing regularly helps most."],
    },
  },
  aburrimiento: {
    emoji: "🥱",
    label: { es: "Aburrimiento", en: "Boredom" },
    meaning: {
      es: "Puede que le resulte muy fácil, muy repetitivo o que esté con poca energía.",
      en: "It may feel too easy, too repetitive, or they may be low on energy.",
    },
    say: {
      es: ["«¿Fue muy fácil o muy repetido?»", "«¿Qué te gustaría que tuviera la práctica?»"],
      en: ["“Was it too easy or too repetitive?”", "“What would you like the practice to have?”"],
    },
    do: {
      es: [
        "Prueben otro tema del mapa o cambien sus intereses en la app para que las historias le gusten más.",
        "Hagan un juego para la casa con movimiento en vez de otra práctica en pantalla.",
      ],
      en: [
        "Try another topic on the map or change their interests in the app so the stories appeal more.",
        "Play a home game with movement instead of another screen practice.",
      ],
    },
  },
  rabia: {
    emoji: "😤",
    label: { es: "Rabia", en: "Frustration" },
    meaning: { es: "Algo le costó y le dio rabia.", en: "Something was hard and it frustrated them." },
    say: {
      es: ["«Es normal enojarse cuando algo cuesta. Equivocarse es parte de aprender.»", "«¿Qué parte fue la más difícil? Veámosla juntos.»"],
      en: ["“It’s normal to get upset when something is hard. Mistakes are part of learning.”", "“Which part was hardest? Let’s look at it together.”"],
    },
    do: {
      es: ["Hagan una pausa antes de volver a intentarlo: respirar o moverse ayuda.", "Al retomar, empiecen por algo que ya le sale y suban de a poco."],
      en: ["Take a break before trying again: breathing or moving helps.", "When you go back to it, start with something they can already do and build up slowly."],
    },
  },
  nervios: {
    emoji: "😰",
    label: { es: "Nervios", en: "Nerves" },
    meaning: { es: "Sintió inseguridad o miedo a equivocarse.", en: "They felt unsure or afraid of making mistakes." },
    say: {
      es: ["«Equivocarse está permitido: así se aprende.»", "«Lo importante es que lo intentaste.»"],
      en: ["“Mistakes are allowed: that's how we learn.”", "“What matters is that you tried.”"],
    },
    do: {
      es: [
        "Eviten frases como «yo también era malo/a para las matemáticas»: transmiten que no se puede.",
        "Sesiones cortas y tranquilas, empezando por algo que ya domina; el juego para la casa, sin apuro.",
      ],
      en: [
        "Avoid phrases like “I was bad at math too”: they suggest it can’t be done.",
        "Short, calm sessions starting with something they’ve mastered; play the home game without rushing.",
      ],
    },
  },
};

export const HARDEST_GUIDANCE: Record<Exclude<Hardest, "nada">, { emoji: string; label: Bilingual; tip: Bilingual }> = {
  entender: {
    emoji: "🤔",
    label: { es: "Entender qué preguntaban", en: "Understanding the question" },
    tip: {
      es: "Lean juntos el problema y pídanle que lo cuente con sus palabras antes de resolver, sin números todavía.",
      en: "Read the problem together and ask them to retell it in their own words before solving, without numbers yet.",
    },
  },
  cuentas: {
    emoji: "🧮",
    label: { es: "Hacer las cuentas", en: "Doing the math" },
    tip: {
      es: "Unos minutos de cálculo mental jugando (dados, cartas, precios) ayudan a que los números salgan con más soltura.",
      en: "A few minutes of mental math through games (dice, cards, prices) helps the numbers flow more easily.",
    },
  },
  concentrarme: {
    emoji: "🌀",
    label: { es: "Concentrarse", en: "Focusing" },
    tip: {
      es: "Elijan un momento tranquilo, sin ruido ni otras pantallas encendidas, con prácticas cortas, y acepten las pausas que ofrece la app.",
      en: "Pick a quiet time, with no noise or other screens on, keep practices short, and accept the breaks the app offers.",
    },
  },
};

// ---------- Resumen para el panel ----------

export interface ReflectionRow {
  createdAt: Date;
  emotion: string | null;
  weather: number | null;
  energy: number | null;
  hardest: string | null;
  skill: { id: string; name: string; nameEn: string | null } | null;
}

/// Días hacia atrás que cuenta el resumen de emociones.
export const FEELINGS_WINDOW_DAYS = 14;
/// Veces que debe aparecer una emoción "para acompañar" antes de destacarla
/// (o ser la más reciente): una sola mala tarde no es un patrón.
export const MIN_TIMES_TO_FOCUS = 2;

export interface FeelingsSummary {
  /** Reflexiones con emoción en la ventana. */
  answered: number;
  counts: Record<Emotion, number>;
  /** Más reciente primero, máx. 5: día, emoción y tema. */
  recent: Array<{ date: string; emotion: Emotion; skill: ReflectionRow["skill"] }>;
  /** Promedios (null sin datos): clima 1-4, energía 1-3. */
  weatherAvg: number | null;
  energyAvg: number | null;
  hardestCounts: Record<Hardest, number>;
  /** Emociones a destacar con su guía: primero las que piden acompañar. */
  focus: Emotion[];
  /** "Lo más difícil" más repetido (≥2), sin contar "nada". */
  hardestFocus: Exclude<Hardest, "nada"> | null;
}

const isEmotion = (e: string | null): e is Emotion => (EMOTIONS as readonly string[]).includes(e ?? "");
const isHardest = (h: string | null): h is Hardest => (HARDEST as readonly string[]).includes(h ?? "");
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function summarizeFeelings(rows: ReflectionRow[], localDay: (d: Date) => string, now: Date = new Date()): FeelingsSummary {
  const since = now.getTime() - FEELINGS_WINDOW_DAYS * 24 * 3600 * 1000;
  const inWindow = rows.filter((r) => r.createdAt.getTime() >= since).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const counts = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
  const hardestCounts = Object.fromEntries(HARDEST.map((h) => [h, 0])) as Record<Hardest, number>;
  const withEmotion = inWindow.filter((r) => isEmotion(r.emotion));
  for (const r of withEmotion) counts[r.emotion as Emotion] += 1;
  for (const r of inWindow) if (isHardest(r.hardest)) hardestCounts[r.hardest] += 1;

  const latest = withEmotion[0]?.emotion as Emotion | undefined;
  const support = NEEDS_SUPPORT.filter((e) => counts[e] >= MIN_TIMES_TO_FOCUS || e === latest).sort((a, b) => counts[b] - counts[a]);
  const positive = EMOTIONS.filter((e) => !NEEDS_SUPPORT.includes(e) && counts[e] > 0).sort((a, b) => counts[b] - counts[a]);
  const focus = [...support.slice(0, 2), ...(support.length < 2 ? positive.slice(0, 1) : [])];

  const hardestTop = (["entender", "cuentas", "concentrarme"] as const)
    .filter((h) => hardestCounts[h] >= MIN_TIMES_TO_FOCUS)
    .sort((a, b) => hardestCounts[b] - hardestCounts[a])[0];

  return {
    answered: withEmotion.length,
    counts,
    recent: withEmotion.slice(0, 5).map((r) => ({ date: localDay(r.createdAt), emotion: r.emotion as Emotion, skill: r.skill })),
    weatherAvg: avg(inWindow.flatMap((r) => (r.weather ? [r.weather] : []))),
    energyAvg: avg(inWindow.flatMap((r) => (r.energy ? [r.energy] : []))),
    hardestCounts,
    focus,
    hardestFocus: hardestTop ?? null,
  };
}

// ---------- Evolución por tema ----------

export interface TopicAttemptRow {
  createdAt: Date;
  isCorrect: boolean;
  skill: { id: string; grade: number; name: string; nameEn: string | null };
}

export interface TopicProgress {
  skillId: string;
  grade: number;
  name: string;
  nameEn: string | null;
  attempts: number;
  accuracy: number;
  /** Comparación de los últimos RECENT_ATTEMPTS con los anteriores; null si aún hay pocos. */
  trend: "up" | "down" | "steady" | null;
  lastPracticed: string;
  lastEmotion: Emotion | null;
  /** Últimos RECENT_ATTEMPTS (o menos): con ellos se decide "le está costando". */
  recentAttempts: number;
  recentCorrect: number;
  /** Por qué conviene un juego en casa: pocos aciertos y/o una emoción difícil reciente. */
  needsHelp: Array<"aciertos" | "emocion">;
}

/// Intentos recientes contra los que se compara la tendencia.
export const RECENT_ATTEMPTS = 8;
/// Diferencia de precisión que cuenta como subida o bajada.
const TREND_DELTA = 0.1;
/// Mismo umbral que skillsToReview (wellbeing.ts): menos del 70 % con 4+ intentos
/// (aquí sobre los últimos RECENT_ATTEMPTS).
const WEAK_ACCURACY = 0.7;
const WEAK_MIN_ATTEMPTS = 4;

export function topicProgress(attempts: TopicAttemptRow[], reflections: ReflectionRow[], localDay: (d: Date) => string): TopicProgress[] {
  const bySkill = new Map<string, TopicAttemptRow[]>();
  for (const a of attempts) bySkill.set(a.skill.id, [...(bySkill.get(a.skill.id) ?? []), a]);
  const out: TopicProgress[] = [];
  for (const [skillId, list] of bySkill) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const correct = list.filter((a) => a.isCorrect).length;
    const accuracy = correct / list.length;
    let trend: TopicProgress["trend"] = null;
    if (list.length >= RECENT_ATTEMPTS + 4) {
      const recent = list.slice(-RECENT_ATTEMPTS);
      const before = list.slice(0, -RECENT_ATTEMPTS);
      const d = recent.filter((a) => a.isCorrect).length / recent.length - before.filter((a) => a.isCorrect).length / before.length;
      trend = d >= TREND_DELTA ? "up" : d <= -TREND_DELTA ? "down" : "steady";
    }
    const lastEmotionRow = reflections
      .filter((r) => r.skill?.id === skillId && isEmotion(r.emotion))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    const lastEmotion = (lastEmotionRow?.emotion as Emotion | undefined) ?? null;
    const needsHelp: TopicProgress["needsHelp"] = [];
    // Debilidad ACTUAL: con suficientes intentos se miran los recientes, para
    // no seguir marcando un tema que ya mejoró.
    const current = list.slice(-RECENT_ATTEMPTS);
    const currentAccuracy = current.filter((a) => a.isCorrect).length / current.length;
    if (list.length >= WEAK_MIN_ATTEMPTS && currentAccuracy < WEAK_ACCURACY) needsHelp.push("aciertos");
    if (lastEmotion === "rabia" || lastEmotion === "nervios") needsHelp.push("emocion");
    const s = list[0]!.skill;
    out.push({
      skillId,
      grade: s.grade,
      name: s.name,
      nameEn: s.nameEn,
      attempts: list.length,
      accuracy,
      recentAttempts: current.length,
      recentCorrect: current.filter((a) => a.isCorrect).length,
      trend,
      lastPracticed: localDay(list[list.length - 1]!.createdAt),
      lastEmotion,
      needsHelp,
    });
  }
  // Primero los que necesitan ayuda, luego los más practicados recientemente.
  return out.sort((a, b) => b.needsHelp.length - a.needsHelp.length || (a.lastPracticed < b.lastPracticed ? 1 : -1));
}
