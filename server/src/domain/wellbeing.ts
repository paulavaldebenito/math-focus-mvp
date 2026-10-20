/**
 * Cruce del autorreporte de ánimo (WellbeingCheckIn, 1 por día) con el
 * rendimiento, y selección de contenidos a repasar — funciones puras, sin
 * BD, mismo patrón que exercises/select.ts. Todo es DESCRIPTIVO: muestra
 * coincidencias observadas a la familia, nunca concluye causas ni
 * diagnostica (regla del proyecto: sin lenguaje clínico).
 */

/// Zona horaria de los usuarios (Chile): "hoy" y los días del panel se
/// cuentan en hora local, no en UTC (una práctica a las 21:00 en Santiago
/// ya es "mañana" en UTC).
export const APP_TIME_ZONE = "America/Santiago";

/// Día calendario local (YYYY-MM-DD) de un instante.
export function localDay(date: Date, timeZone: string = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export interface CheckInRow {
  createdAt: Date;
  mood: number | null;
  mathFeeling: number | null;
}

export interface AttemptRow {
  createdAt: Date;
  isCorrect: boolean;
}

export interface WellbeingDay {
  date: string;
  mood: number | null;
  mathFeeling: number | null;
  attempts: number;
  correct: number;
  /** null si ese día no respondió ejercicios. */
  accuracy: number | null;
}

export interface GroupAccuracy {
  days: number;
  accuracy: number | null;
}

export interface WellbeingCross {
  /** Días con check-in respondido (al menos una carita), más reciente primero. */
  days: WellbeingDay[];
  /** Precisión agregada de los días en cada grupo (solo días con ejercicios). */
  comparison: {
    moodLow: GroupAccuracy; // ánimo 1-2
    moodHigh: GroupAccuracy; // ánimo 4-5
    mathNervous: GroupAccuracy; // mathFeeling 1-2
    mathCalm: GroupAccuracy; // mathFeeling 4-5
  };
  /** Promedio de mathFeeling en los últimos días respondidos (null sin datos). */
  recentMathFeeling: number | null;
}

/// Días recientes que se muestran en el panel.
export const WELLBEING_DAYS_SHOWN = 14;
/// Días con ejercicios que necesita CADA grupo antes de comparar — con
/// menos, la diferencia sería ruido y el panel dice "aún pocos días".
export const MIN_DAYS_TO_COMPARE = 2;
/// Cuántos días recientes se promedian para `recentMathFeeling`.
const RECENT_DAYS = 5;

function group(days: WellbeingDay[]): GroupAccuracy {
  const withWork = days.filter((d) => d.attempts > 0);
  const attempts = withWork.reduce((s, d) => s + d.attempts, 0);
  const correct = withWork.reduce((s, d) => s + d.correct, 0);
  return { days: withWork.length, accuracy: attempts > 0 ? correct / attempts : null };
}

export function buildWellbeingCross(checkIns: CheckInRow[], attempts: AttemptRow[]): WellbeingCross {
  const byDay = new Map<string, { attempts: number; correct: number }>();
  for (const a of attempts) {
    const d = localDay(a.createdAt);
    const cur = byDay.get(d) ?? { attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (a.isCorrect) cur.correct += 1;
    byDay.set(d, cur);
  }

  // Un check-in por día; si hubiera más de uno (p. ej. datos anteriores a la
  // regla "una vez al día"), vale el primero respondido de ese día.
  const answered = [...checkIns]
    .filter((c) => c.mood !== null || c.mathFeeling !== null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const checkInByDay = new Map<string, CheckInRow>();
  for (const c of answered) {
    const d = localDay(c.createdAt);
    if (!checkInByDay.has(d)) checkInByDay.set(d, c);
  }

  const allDays: WellbeingDay[] = [...checkInByDay.entries()]
    .map(([date, c]) => {
      const work = byDay.get(date) ?? { attempts: 0, correct: 0 };
      return {
        date,
        mood: c.mood,
        mathFeeling: c.mathFeeling,
        attempts: work.attempts,
        correct: work.correct,
        accuracy: work.attempts > 0 ? work.correct / work.attempts : null,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const recent = allDays.filter((d) => d.mathFeeling !== null).slice(0, RECENT_DAYS);
  return {
    days: allDays.slice(0, WELLBEING_DAYS_SHOWN),
    comparison: {
      moodLow: group(allDays.filter((d) => d.mood !== null && d.mood <= 2)),
      moodHigh: group(allDays.filter((d) => d.mood !== null && d.mood >= 4)),
      mathNervous: group(allDays.filter((d) => d.mathFeeling !== null && d.mathFeeling <= 2)),
      mathCalm: group(allDays.filter((d) => d.mathFeeling !== null && d.mathFeeling >= 4)),
    },
    recentMathFeeling: recent.length > 0 ? recent.reduce((s, d) => s + d.mathFeeling!, 0) / recent.length : null,
  };
}

export interface SkillAttemptRow {
  isCorrect: boolean;
  skill: { id: string; grade: number; name: string; nameEn: string | null };
}

export interface SkillToReview {
  skillId: string;
  grade: number;
  name: string;
  nameEn: string | null;
  attempts: number;
  accuracy: number;
}

/// Intentos mínimos en un contenido antes de sugerir repasarlo (con 1-2
/// respuestas un error suelto no dice nada).
export const MIN_ATTEMPTS_TO_REVIEW = 4;
/// Bajo esta precisión, el contenido se sugiere para repasar.
export const REVIEW_ACCURACY_THRESHOLD = 0.7;
/// Máximo de contenidos sugeridos — para no abrumar a la familia.
export const MAX_SKILLS_TO_REVIEW = 3;

export function skillsToReview(attempts: SkillAttemptRow[]): SkillToReview[] {
  const bySkill = new Map<string, { skill: SkillAttemptRow["skill"]; attempts: number; correct: number }>();
  for (const a of attempts) {
    const cur = bySkill.get(a.skill.id) ?? { skill: a.skill, attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (a.isCorrect) cur.correct += 1;
    bySkill.set(a.skill.id, cur);
  }
  return [...bySkill.values()]
    .filter((s) => s.attempts >= MIN_ATTEMPTS_TO_REVIEW && s.correct / s.attempts < REVIEW_ACCURACY_THRESHOLD)
    .map((s) => ({
      skillId: s.skill.id,
      grade: s.skill.grade,
      name: s.skill.name,
      nameEn: s.skill.nameEn,
      attempts: s.attempts,
      accuracy: s.correct / s.attempts,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, MAX_SKILLS_TO_REVIEW);
}
