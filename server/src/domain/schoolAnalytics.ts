/**
 * Métricas de los paneles escolares (specs/014-paneles-escolares). Funciones
 * puras, sin BD (mismo patrón que wellbeing.ts y feelings.ts). Principios:
 * - Todo por OA (habilidad del banco), el idioma del currículum.
 * - Dominio ACTUAL: últimos MASTERY_WINDOW intentos de cada OA.
 * - La docente ve a cada estudiante; lo socioemocional individual solo de
 *   quienes tienen `shareEmotions` (consentimiento aparte de la familia).
 * - Directivos: siempre agregado, y ningún grupo con menos de MIN_GROUP
 *   estudiantes (se marca como "pocos datos" en vez de mostrar el número).
 * - Nada de rankings ni lenguaje clínico.
 */
import { type Emotion, EMOTIONS } from "./feelings.js";

export const MASTERY_WINDOW = 10;
/// Intentos mínimos en un OA para asignar nivel (con menos, "pocos datos").
export const MIN_ATTEMPTS_FOR_LEVEL = 3;
export const LEVEL_DESARROLLO = 0.5;
export const LEVEL_LOGRADO = 0.8;
/// Si al menos esta fracción de quienes practicaron un OA está en Inicial,
/// conviene reenseñarlo a todo el curso (si no, grupo de refuerzo).
export const RETEACH_SHARE = 0.4;
export const INACTIVE_DAYS = 7;
export const EMOTION_WINDOW_DAYS = 14;
/// Emociones difíciles (rabia/nervios) en 14 días para una alerta individual.
export const ALERT_DIFFICULT_TIMES = 3;
/// Respuesta "muy rápida" (posible adivinanza).
export const FAST_RESPONSE_MS = 3000;
/// Tamaño mínimo de grupo para mostrar un agregado a directivos.
export const MIN_GROUP = 5;
/// Grupos de refuerzo que se sugieren a la docente, como máximo.
export const MAX_GROUPS = 5;
/// Minutos máximos que cuenta una sesión (una sesión abierta y olvidada no infla el uso).
const MAX_SESSION_MIN = 30;

const DAY = 24 * 3600 * 1000;

export type Level = "inicial" | "desarrollo" | "logrado" | "pocos" | "sin";

export interface Student {
  id: string;
  name: string;
  shareEmotions: boolean;
}
export interface Skill {
  id: string;
  name: string;
  nameEn: string | null;
  oaCode: string | null;
  axis: string;
  axisEn: string | null;
  order: number;
  grade: number;
}
export interface AttemptRow {
  childId: string;
  skillId: string;
  isCorrect: boolean;
  createdAt: Date;
  errorCode: string | null;
  hintsUsed: number;
  responseTimeMs: number | null;
}
export interface SessionRow {
  childId: string;
  startedAt: Date;
  endedAt: Date | null;
  lastAttemptAt: Date | null;
}
export interface ReflectionRow {
  childId: string;
  skillId: string | null;
  emotion: string | null;
  createdAt: Date;
}
export interface CheckInRow {
  childId: string;
  mood: number | null;
  createdAt: Date;
}
export interface PlayRow {
  childId: string;
  playedAt: Date;
}

export function levelOf(recent: boolean[]): Level {
  if (recent.length === 0) return "sin";
  if (recent.length < MIN_ATTEMPTS_FOR_LEVEL) return "pocos";
  const acc = recent.filter(Boolean).length / recent.length;
  return acc >= LEVEL_LOGRADO ? "logrado" : acc >= LEVEL_DESARROLLO ? "desarrollo" : "inicial";
}

const isEmotion = (e: string | null): e is Emotion => (EMOTIONS as readonly string[]).includes(e ?? "");
const isDifficult = (e: string | null) => e === "rabia" || e === "nervios";
const mostFrequent = <T>(xs: T[]): { value: T; count: number } | null => {
  const m = new Map<T, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  let best: { value: T; count: number } | null = null;
  for (const [value, count] of m) if (!best || count > best.count) best = { value, count };
  return best;
};

export interface Cell {
  level: Level;
  attempts: number;
  /** Precisión de los últimos MASTERY_WINDOW intentos (null sin intentos). */
  recentAccuracy: number | null;
  /** Error más frecuente del estudiante en ese OA (últimos intentos). */
  mainError: string | null;
}

/// Celdas estudiante × OA: el corazón de ambos paneles.
export function masteryCells(attempts: AttemptRow[]): Map<string, Map<string, Cell>> {
  const by = new Map<string, Map<string, AttemptRow[]>>();
  for (const a of attempts) {
    const s = by.get(a.childId) ?? new Map<string, AttemptRow[]>();
    s.set(a.skillId, [...(s.get(a.skillId) ?? []), a]);
    by.set(a.childId, s);
  }
  const out = new Map<string, Map<string, Cell>>();
  for (const [childId, skills] of by) {
    const row = new Map<string, Cell>();
    for (const [skillId, list] of skills) {
      list.sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime());
      const recent = list.slice(-MASTERY_WINDOW);
      const errors = recent.flatMap((a) => (!a.isCorrect && a.errorCode ? [a.errorCode] : []));
      row.set(skillId, {
        level: levelOf(recent.map((a) => a.isCorrect)),
        attempts: list.length,
        recentAccuracy: recent.length ? recent.filter((a) => a.isCorrect).length / recent.length : null,
        mainError: mostFrequent(errors)?.value ?? null,
      });
    }
    out.set(childId, row);
  }
  return out;
}

const cellOf = (cells: Map<string, Map<string, Cell>>, childId: string, skillId: string): Cell =>
  cells.get(childId)?.get(skillId) ?? { level: "sin", attempts: 0, recentAccuracy: null, mainError: null };

// ---------------- Panel de la docente ----------------

export interface SkillSummary {
  skillId: string;
  levels: Record<"inicial" | "desarrollo" | "logrado" | "pocos" | "sin", number>;
  /** Estudiantes con nivel asignado (inicial/desarrollo/logrado). */
  assessed: number;
  topError: { code: string; count: number } | null;
}

export interface ParticipationRow {
  childId: string;
  lastPractice: string | null;
  daysSinceLast: number | null;
  sessions7d: number;
  minutes7d: number;
  inactive: boolean;
  /** Señales de esfuerzo (14 días): fracción de respuestas con pista y muy rápidas. */
  hintRate: number | null;
  fastRate: number | null;
  homeGames: number;
}

export interface StudentAlert {
  childId: string;
  reason: "emociones_dificiles" | "animo_bajo";
  count: number;
  /** OA donde más reportó rabia/nervios. */
  skillId: string | null;
}

export type Recommendation =
  | { kind: "reensenar"; skillId: string; inicial: number; assessed: number; errorCode: string | null }
  | { kind: "grupo"; skillId: string; childIds: string[]; errorCode: string | null }
  | { kind: "inactivos"; childIds: string[] }
  | { kind: "emocion_tema"; skillId: string; reports: number; students: number };

export interface TeacherDashboard {
  students: Student[];
  skills: Skill[];
  /** heatmap[childId][skillId] */
  heatmap: Record<string, Record<string, Cell>>;
  skillSummary: SkillSummary[];
  groups: Array<{ skillId: string; errorCode: string | null; childIds: string[] }>;
  participation: ParticipationRow[];
  week: { activeStudents: number; minutes: number; sessions: number };
  climate: {
    /** Todo el curso (agregado), 14 días. */
    emotionCounts: Record<Emotion, number>;
    reporters: number;
    /** OA con más reportes de rabia/nervios (agregado). */
    difficultSkills: Array<{ skillId: string; reports: number; students: number }>;
    /** Solo estudiantes con shareEmotions. */
    alerts: StudentAlert[];
  };
  /** OA del curso con al menos un estudiante con nivel asignado. */
  coverage: { practiced: number; total: number };
  actions: Recommendation[];
}

function minutesOf(s: SessionRow): number {
  const end = s.endedAt ?? s.lastAttemptAt;
  if (!end) return 0;
  return Math.min(MAX_SESSION_MIN, Math.max(0, (end.getTime() - s.startedAt.getTime()) / 60000));
}

export function buildTeacherDashboard(input: {
  students: Student[];
  skills: Skill[];
  attempts: AttemptRow[];
  sessions: SessionRow[];
  reflections: ReflectionRow[];
  checkIns: CheckInRow[];
  plays: PlayRow[];
  localDay: (d: Date) => string;
  now?: Date;
}): TeacherDashboard {
  const now = input.now ?? new Date();
  const ids = new Set(input.students.map((s) => s.id));
  const attempts = input.attempts.filter((a) => ids.has(a.childId));
  const skills = [...input.skills].sort((a, b) => a.order - b.order);
  const cells = masteryCells(attempts);

  const heatmap: TeacherDashboard["heatmap"] = {};
  for (const st of input.students) {
    heatmap[st.id] = {};
    for (const sk of skills) heatmap[st.id]![sk.id] = cellOf(cells, st.id, sk.id);
  }

  const skillSummary: SkillSummary[] = skills.map((sk) => {
    const levels = { inicial: 0, desarrollo: 0, logrado: 0, pocos: 0, sin: 0 };
    const errs: string[] = [];
    for (const st of input.students) {
      const c = heatmap[st.id]![sk.id]!;
      levels[c.level] += 1;
    }
    for (const a of attempts) if (a.skillId === sk.id && !a.isCorrect && a.errorCode) errs.push(a.errorCode);
    const top = mostFrequent(errs);
    return { skillId: sk.id, levels, assessed: levels.inicial + levels.desarrollo + levels.logrado, topError: top ? { code: top.value, count: top.count } : null };
  });

  // Grupos de refuerzo: por OA, estudiantes en Inicial agrupados por su error
  // principal; solo los MAX_GROUPS más grandes (una lista larga no ayuda a decidir).
  let groups: TeacherDashboard["groups"] = [];
  for (const sk of skills) {
    const weak = input.students.filter((st) => heatmap[st.id]![sk.id]!.level === "inicial");
    if (weak.length < 2) continue;
    const byErr = new Map<string | null, string[]>();
    for (const st of weak) {
      const e = heatmap[st.id]![sk.id]!.mainError;
      byErr.set(e, [...(byErr.get(e) ?? []), st.id]);
    }
    for (const [errorCode, childIds] of byErr) groups.push({ skillId: sk.id, errorCode, childIds });
  }
  groups = groups.filter((g) => g.childIds.length >= 2).sort((a, b) => b.childIds.length - a.childIds.length).slice(0, MAX_GROUPS);

  const since7 = now.getTime() - 7 * DAY;
  const since14 = now.getTime() - EMOTION_WINDOW_DAYS * DAY;
  const participation: ParticipationRow[] = input.students.map((st) => {
    const mine = attempts.filter((a) => a.childId === st.id);
    const last = mine.reduce<Date | null>((m, a) => (!m || a.createdAt > m ? a.createdAt : m), null);
    const days = last ? Math.floor((now.getTime() - last.getTime()) / DAY) : null;
    const ses = input.sessions.filter((s) => s.childId === st.id && s.startedAt.getTime() >= since7 && s.lastAttemptAt);
    const recent = mine.filter((a) => a.createdAt.getTime() >= since14);
    return {
      childId: st.id,
      lastPractice: last ? input.localDay(last) : null,
      daysSinceLast: days,
      sessions7d: ses.length,
      minutes7d: Math.round(ses.reduce((m, s) => m + minutesOf(s), 0)),
      inactive: days === null || days >= INACTIVE_DAYS,
      hintRate: recent.length ? recent.filter((a) => a.hintsUsed > 0).length / recent.length : null,
      fastRate: recent.length ? recent.filter((a) => a.responseTimeMs !== null && a.responseTimeMs < FAST_RESPONSE_MS).length / recent.length : null,
      homeGames: input.plays.filter((p) => p.childId === st.id).length,
    };
  });

  const refl = input.reflections.filter((r) => ids.has(r.childId) && r.createdAt.getTime() >= since14);
  const emotionCounts = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
  for (const r of refl) if (isEmotion(r.emotion)) emotionCounts[r.emotion] += 1;
  const reporters = new Set(refl.filter((r) => isEmotion(r.emotion)).map((r) => r.childId)).size;
  const difficultBySkill = new Map<string, { reports: number; students: Set<string> }>();
  for (const r of refl) {
    if (!isDifficult(r.emotion) || !r.skillId) continue;
    const cur = difficultBySkill.get(r.skillId) ?? { reports: 0, students: new Set<string>() };
    cur.reports += 1;
    cur.students.add(r.childId);
    difficultBySkill.set(r.skillId, cur);
  }
  const difficultSkills = [...difficultBySkill.entries()]
    .map(([skillId, v]) => ({ skillId, reports: v.reports, students: v.students.size }))
    .sort((a, b) => b.reports - a.reports);

  const alerts: StudentAlert[] = [];
  for (const st of input.students.filter((s) => s.shareEmotions)) {
    const hard = refl.filter((r) => r.childId === st.id && isDifficult(r.emotion));
    if (hard.length >= ALERT_DIFFICULT_TIMES) {
      alerts.push({ childId: st.id, reason: "emociones_dificiles", count: hard.length, skillId: mostFrequent(hard.flatMap((r) => (r.skillId ? [r.skillId] : [])))?.value ?? null });
      continue;
    }
    const moods = input.checkIns
      .filter((c) => c.childId === st.id && c.mood !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3);
    if (moods.length === 3 && moods.reduce((s, c) => s + c.mood!, 0) / 3 <= 2) alerts.push({ childId: st.id, reason: "animo_bajo", count: 3, skillId: null });
  }

  const actions: Recommendation[] = [];
  const weakest = skillSummary
    .filter((s) => s.assessed >= 2 && s.levels.inicial >= 2)
    .sort((a, b) => b.levels.inicial / b.assessed - a.levels.inicial / a.assessed)[0];
  if (weakest) {
    if (weakest.levels.inicial / weakest.assessed >= RETEACH_SHARE)
      actions.push({ kind: "reensenar", skillId: weakest.skillId, inicial: weakest.levels.inicial, assessed: weakest.assessed, errorCode: weakest.topError?.code ?? null });
    else {
      const g = groups.find((x) => x.skillId === weakest.skillId);
      if (g) actions.push({ kind: "grupo", skillId: g.skillId, childIds: g.childIds, errorCode: g.errorCode });
    }
  }
  const inactive = participation.filter((p) => p.inactive).map((p) => p.childId);
  if (inactive.length) actions.push({ kind: "inactivos", childIds: inactive });
  const hot = difficultSkills.find((d) => d.reports >= ALERT_DIFFICULT_TIMES);
  if (hot) actions.push({ kind: "emocion_tema", skillId: hot.skillId, reports: hot.reports, students: hot.students });

  return {
    students: input.students,
    skills,
    heatmap,
    skillSummary,
    groups,
    participation,
    week: {
      activeStudents: participation.filter((p) => p.sessions7d > 0).length,
      minutes: participation.reduce((m, p) => m + p.minutes7d, 0),
      sessions: participation.reduce((m, p) => m + p.sessions7d, 0),
    },
    climate: { emotionCounts, reporters, difficultSkills, alerts },
    coverage: { practiced: skillSummary.filter((s) => s.assessed > 0).length, total: skills.length },
    actions: actions.slice(0, 3),
  };
}

// ---------------- Panel directivo (siempre agregado, mín. MIN_GROUP) ----------------

/// Un agregado que se muestra solo si lo respaldan MIN_GROUP estudiantes o más.
export type Guarded<T> = { ok: true; value: T; students: number } | { ok: false; students: number };
const guard = <T>(students: number, value: () => T): Guarded<T> => (students >= MIN_GROUP ? { ok: true, value: value(), students } : { ok: false, students });

export interface ClassInput {
  id: string;
  name: string;
  grade: number;
  teacherEmail: string;
  teacherLastPanelAt: Date | null;
  studentIds: string[];
}

export interface DirectorDashboard {
  totals: { classes: number; students: number; activeStudents7d: number; teachersUsingPanel7d: number; teachers: number };
  /** dominio[grade][axis] = % de celdas estudiante×OA en Logrado. */
  masteryByGradeAxis: Array<{ grade: number; axis: string; axisEn: string | null; logrado: Guarded<number> }>;
  /** Precisión mensual por curso-nivel, últimos 6 meses (YYYY-MM). */
  monthly: Array<{ grade: number; month: string; accuracy: Guarded<number> }>;
  classes: Array<{
    id: string;
    name: string;
    grade: number;
    teacherEmail: string;
    teacherLastPanelAt: Date | null;
    enrolled: number;
    active7d: number;
    minutes7d: number;
    logrado: Guarded<number>;
    difficultEmotionShare: Guarded<number>;
    homeGames: number;
  }>;
  /** Cursos paralelos: mismo nivel, por OA. */
  parallel: Array<{ grade: number; skillId: string; byClass: Array<{ classId: string; logrado: Guarded<number> }> }>;
  wellbeingByGrade: Array<{ grade: number; counts: Guarded<Record<Emotion, number>> }>;
  alerts: Array<
    | { kind: "baja_aciertos"; grade: number; before: number; after: number }
    | { kind: "emociones_dificiles"; classId: string; share: number }
    | { kind: "baja_participacion"; classId: string; share: number }
  >;
}

const pctLogrado = (cells: Cell[]) => {
  const assessed = cells.filter((c) => ["inicial", "desarrollo", "logrado"].includes(c.level));
  return assessed.length ? assessed.filter((c) => c.level === "logrado").length / assessed.length : 0;
};

export function buildDirectorDashboard(input: {
  classes: ClassInput[];
  skills: Skill[];
  attempts: AttemptRow[];
  sessions: SessionRow[];
  reflections: ReflectionRow[];
  plays: PlayRow[];
  now?: Date;
}): DirectorDashboard {
  const now = input.now ?? new Date();
  const since7 = now.getTime() - 7 * DAY;
  const since14 = now.getTime() - EMOTION_WINDOW_DAYS * DAY;
  const cells = masteryCells(input.attempts);
  const studentsWithCell = (studentIds: string[], skillIds: string[]) => {
    const list: Cell[] = [];
    const who = new Set<string>();
    for (const st of studentIds)
      for (const sk of skillIds) {
        const c = cellOf(cells, st, sk);
        if (["inicial", "desarrollo", "logrado"].includes(c.level)) {
          list.push(c);
          who.add(st);
        }
      }
    return { list, students: who.size };
  };
  const studentsOfGrade = (g: number) => input.classes.filter((c) => c.grade === g).flatMap((c) => c.studentIds);
  const grades = [...new Set(input.classes.map((c) => c.grade))].sort();
  const active = (ids: string[]) => new Set(input.sessions.filter((s) => ids.includes(s.childId) && s.startedAt.getTime() >= since7 && s.lastAttemptAt).map((s) => s.childId)).size;

  const masteryByGradeAxis: DirectorDashboard["masteryByGradeAxis"] = [];
  for (const g of grades) {
    const axes = [...new Map(input.skills.filter((s) => s.grade === g).map((s) => [s.axis, s])).values()];
    for (const ax of axes) {
      const { list, students } = studentsWithCell(studentsOfGrade(g), input.skills.filter((s) => s.grade === g && s.axis === ax.axis).map((s) => s.id));
      masteryByGradeAxis.push({ grade: g, axis: ax.axis, axisEn: ax.axisEn, logrado: guard(students, () => pctLogrado(list)) });
    }
  }

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const monthly: DirectorDashboard["monthly"] = [];
  for (const g of grades) {
    const ids = new Set(studentsOfGrade(g));
    for (const m of months) {
      const list = input.attempts.filter((a) => ids.has(a.childId) && a.createdAt.toISOString().slice(0, 7) === m);
      const students = new Set(list.map((a) => a.childId)).size;
      monthly.push({ grade: g, month: m, accuracy: guard(students, () => list.filter((a) => a.isCorrect).length / list.length) });
    }
  }

  const gradeSkills = (g: number) => input.skills.filter((s) => s.grade === g).map((s) => s.id);
  const classes: DirectorDashboard["classes"] = input.classes.map((c) => {
    const { list, students } = studentsWithCell(c.studentIds, gradeSkills(c.grade));
    const refl = input.reflections.filter((r) => c.studentIds.includes(r.childId) && r.createdAt.getTime() >= since14 && isEmotion(r.emotion));
    const reporters = new Set(refl.map((r) => r.childId)).size;
    const ses = input.sessions.filter((s) => c.studentIds.includes(s.childId) && s.startedAt.getTime() >= since7 && s.lastAttemptAt);
    return {
      id: c.id,
      name: c.name,
      grade: c.grade,
      teacherEmail: c.teacherEmail,
      teacherLastPanelAt: c.teacherLastPanelAt,
      enrolled: c.studentIds.length,
      active7d: active(c.studentIds),
      minutes7d: Math.round(ses.reduce((m, s) => m + minutesOf(s), 0)),
      logrado: guard(students, () => pctLogrado(list)),
      difficultEmotionShare: guard(reporters, () => refl.filter((r) => isDifficult(r.emotion)).length / refl.length),
      homeGames: input.plays.filter((p) => c.studentIds.includes(p.childId)).length,
    };
  });

  const parallel: DirectorDashboard["parallel"] = [];
  for (const g of grades) {
    const cls = input.classes.filter((c) => c.grade === g);
    if (cls.length < 2) continue;
    for (const sk of gradeSkills(g)) {
      parallel.push({
        grade: g,
        skillId: sk,
        byClass: cls.map((c) => {
          const { list, students } = studentsWithCell(c.studentIds, [sk]);
          return { classId: c.id, logrado: guard(students, () => pctLogrado(list)) };
        }),
      });
    }
  }

  const wellbeingByGrade = grades.map((g) => {
    const ids = new Set(studentsOfGrade(g));
    const refl = input.reflections.filter((r) => ids.has(r.childId) && r.createdAt.getTime() >= since14 && isEmotion(r.emotion));
    return {
      grade: g,
      counts: guard(new Set(refl.map((r) => r.childId)).size, () => {
        const counts = Object.fromEntries(EMOTIONS.map((e) => [e, 0])) as Record<Emotion, number>;
        for (const r of refl) counts[r.emotion as Emotion] += 1;
        return counts;
      }),
    };
  });

  const alerts: DirectorDashboard["alerts"] = [];
  for (const g of grades) {
    const ids = new Set(studentsOfGrade(g));
    const win = (from: number, to: number) => input.attempts.filter((a) => ids.has(a.childId) && a.createdAt.getTime() >= from && a.createdAt.getTime() < to);
    const after = win(now.getTime() - 30 * DAY, now.getTime() + 1);
    const before = win(now.getTime() - 60 * DAY, now.getTime() - 30 * DAY);
    const nStu = (l: AttemptRow[]) => new Set(l.map((a) => a.childId)).size;
    if (nStu(after) >= MIN_GROUP && nStu(before) >= MIN_GROUP) {
      const acc = (l: AttemptRow[]) => l.filter((a) => a.isCorrect).length / l.length;
      if (acc(before) - acc(after) >= 0.1) alerts.push({ kind: "baja_aciertos", grade: g, before: acc(before), after: acc(after) });
    }
  }
  for (const c of classes) {
    if (c.difficultEmotionShare.ok && c.difficultEmotionShare.value >= 0.4) alerts.push({ kind: "emociones_dificiles", classId: c.id, share: c.difficultEmotionShare.value });
    if (c.enrolled >= MIN_GROUP && c.active7d / c.enrolled < 0.5) alerts.push({ kind: "baja_participacion", classId: c.id, share: c.active7d / c.enrolled });
  }

  const teachers = new Map(input.classes.map((c) => [c.teacherEmail, c.teacherLastPanelAt]));
  return {
    totals: {
      classes: input.classes.length,
      students: new Set(input.classes.flatMap((c) => c.studentIds)).size,
      activeStudents7d: active(input.classes.flatMap((c) => c.studentIds)),
      teachers: teachers.size,
      teachersUsingPanel7d: [...teachers.values()].filter((d) => d && d.getTime() >= since7).length,
    },
    masteryByGradeAxis,
    monthly,
    classes,
    parallel,
    wellbeingByGrade,
    alerts,
  };
}
