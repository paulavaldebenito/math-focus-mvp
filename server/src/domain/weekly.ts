/**
 * «La semana de…» (specs/018): lo primero que ve la familia al entrar al panel. Tres tarjetas con un
 * estado simple y descriptivo —aprendizaje, cómo se siente y con los demás— comparando esta semana
 * (lunes a domingo, hora de Chile) con la anterior. Nunca un diagnóstico: el estado solo dice si
 * conviene mirar el detalle o conversar. Módulo puro, sin acceso a BD.
 */
import { weekKey, type SocialSummary } from "./social.js";
import type { Emotion } from "./feelings.js";

export type CardStatus = "bien" | "atento" | "conversar" | "atencion" | "sin_datos" | "desactivado";

export interface WeeklyInput {
  now: Date;
  sessions: Array<{ startedAt: Date }>;
  attempts: Array<{ createdAt: Date; isCorrect: boolean; skill: { id: string; name: string; nameEn: string | null } }>;
  reflections: Array<{ createdAt: Date; emotion: string | null }>;
  checkIns: Array<{ createdAt: Date; mood: number | null }>;
  /** Temas que hoy necesitan apoyo (topicProgress con needsHelp), en su orden de prioridad. */
  topicsNeedingHelp: Array<{ name: string; nameEn: string | null }>;
  socialEnabled: boolean;
  social: SocialSummary;
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
  feelings: {
    status: CardStatus;
    topEmotion: Emotion | null;
    topEmotionPrev: Emotion | null;
    moodAvg: number | null;
    moodAvgPrev: number | null;
  };
  social: {
    status: CardStatus;
    answeredThisWeek: boolean;
  };
}

const DIFFICULT: string[] = ["rabia", "nervios"];
const MIN_ATTEMPTS_FOR_ACCURACY = 8;

function previousWeekKey(now: Date): string {
  return weekKey(new Date(now.getTime() - 7 * 86400000));
}

function mode(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | null = null;
  for (const [v, n] of counts) if (best === null || n > counts.get(best)!) best = v;
  return best;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function weeklySummary(input: WeeklyInput): WeeklySummary {
  const thisWeek = weekKey(input.now);
  const prevWeek = previousWeekKey(input.now);
  const inWeek = (d: Date, k: string) => weekKey(d) === k;

  const practices = input.sessions.filter((s) => inWeek(s.startedAt, thisWeek)).length;
  const practicesPrev = input.sessions.filter((s) => inWeek(s.startedAt, prevWeek)).length;
  const att = input.attempts.filter((a) => inWeek(a.createdAt, thisWeek));
  const attPrev = input.attempts.filter((a) => inWeek(a.createdAt, prevWeek));
  const acc = (xs: typeof att) => (xs.length >= MIN_ATTEMPTS_FOR_ACCURACY ? xs.filter((a) => a.isCorrect).length / xs.length : null);
  const accuracy = acc(att);
  const topicsMap = new Map(att.map((a) => [a.skill.id, { name: a.skill.name, nameEn: a.skill.nameEn }]));
  const focusTopic = input.topicsNeedingHelp[0] ?? null;
  // El tema para reforzar se muestra como dato; la tarjeta solo pide atención si la semana fue
  // difícil en general (casi siempre hay algún tema por reforzar y una alerta permanente se ignora).
  const learningStatus: CardStatus = practices === 0 ? "sin_datos" : accuracy !== null && accuracy < 0.5 ? "atento" : "bien";

  const emotions = input.reflections.filter((r) => r.emotion && inWeek(r.createdAt, thisWeek)).map((r) => r.emotion!);
  const emotionsPrev = input.reflections.filter((r) => r.emotion && inWeek(r.createdAt, prevWeek)).map((r) => r.emotion!);
  const moods = input.checkIns.filter((c) => c.mood !== null && inWeek(c.createdAt, thisWeek)).map((c) => c.mood!);
  const moodsPrev = input.checkIns.filter((c) => c.mood !== null && inWeek(c.createdAt, prevWeek)).map((c) => c.mood!);
  const moodAvg = avg(moods);
  const difficultShare = emotions.length ? emotions.filter((e) => DIFFICULT.includes(e)).length / emotions.length : 0;
  // Con un solo registro no se concluye nada: hacen falta al menos 2 para sugerir conversar.
  const feelingsStatus: CardStatus =
    emotions.length === 0 && moods.length === 0
      ? "sin_datos"
      : (emotions.length >= 2 && difficultShare >= 0.5) || (moods.length >= 2 && moodAvg !== null && moodAvg <= 2)
        ? "conversar"
        : "bien";

  // «Sin señales» solo si respondió esta semana: no responder no es lo mismo que estar bien.
  const answeredThisWeek = input.social.latest?.weekKey === thisWeek;
  const socialStatus: CardStatus = !input.socialEnabled
    ? "desactivado"
    : input.social.signal
      ? input.social.signal.level
      : answeredThisWeek
        ? "bien"
        : "sin_datos";

  return {
    weekKey: thisWeek,
    learning: {
      status: learningStatus,
      practices,
      practicesPrev,
      attempts: att.length,
      accuracy,
      accuracyPrev: acc(attPrev),
      topics: [...topicsMap.values()],
      focusTopic,
    },
    feelings: {
      status: feelingsStatus,
      topEmotion: mode(emotions) as Emotion | null,
      topEmotionPrev: mode(emotionsPrev) as Emotion | null,
      moodAvg,
      moodAvgPrev: avg(moodsPrev),
    },
    social: { status: socialStatus, answeredThisWeek },
  };
}
