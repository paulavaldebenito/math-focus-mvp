import { describe, expect, it } from "vitest";
import { buildDirectorDashboard, buildTeacherDashboard, levelOf, type AttemptRow, type Skill } from "../schoolAnalytics.js";

const NOW = new Date("2026-10-23T15:00:00Z");
const ago = (days: number, min = 0) => new Date(NOW.getTime() - days * 86400000 + min * 60000);
const day = (d: Date) => d.toISOString().slice(0, 10);
const skill = (id: string, axis = "Números y operaciones", order = 0): Skill => ({ id, name: id, nameEn: null, oaCode: `MA03 ${id}`, axis, axisEn: null, order, grade: 3 });
const tries = (childId: string, skillId: string, pattern: string, errorCode = "E1_OP", daysAgo = 1): AttemptRow[] =>
  [...pattern].map((c, i) => ({ childId, skillId, isCorrect: c === "1", createdAt: ago(daysAgo, i), errorCode: c === "1" ? null : errorCode, hintsUsed: 0, responseTimeMs: 8000 }));

describe("levelOf", () => {
  it("Inicial < 50 %, En desarrollo < 80 %, Logrado ≥ 80 %, y con menos de 3 intentos «pocos»", () => {
    expect(levelOf([])).toBe("sin");
    expect(levelOf([true, true])).toBe("pocos");
    expect(levelOf([true, false, false, false])).toBe("inicial");
    expect(levelOf([true, true, false, false])).toBe("desarrollo");
    expect(levelOf([true, true, true, true, false])).toBe("logrado");
  });
});

describe("buildTeacherDashboard", () => {
  const students = ["a", "b", "c", "d"].map((id) => ({ id, name: id.toUpperCase(), shareEmotions: id !== "d" }));
  const skills = [skill("frac", "Números y operaciones", 1), skill("geo", "Geometría", 2)];
  const attempts = [
    ...tries("a", "frac", "0001", "E3_PREG"),
    ...tries("b", "frac", "0010", "E3_PREG"),
    ...tries("c", "frac", "1111"),
    // el dominio es ACTUAL: d empezó mal pero los últimos 10 son buenos
    ...tries("d", "frac", "000001111111111", "E1_OP", 2),
  ];
  const sessions = [{ childId: "a", startedAt: ago(1), endedAt: ago(1, 12), lastAttemptAt: ago(1, 4) }];
  const reflections = [0, 1, 2].flatMap((i) => [
    { childId: "a", skillId: "frac", emotion: "nervios", createdAt: ago(i + 1) },
    { childId: "d", skillId: "frac", emotion: "rabia", createdAt: ago(i + 1) },
  ]);
  const dash = buildTeacherDashboard({ students, skills, attempts, sessions, reflections, checkIns: [], plays: [{ childId: "a", playedAt: ago(1) }], localDay: day, now: NOW });

  it("arma el mapa de calor OA × estudiante con el dominio actual", () => {
    expect(dash.heatmap.a!.frac!.level).toBe("inicial");
    expect(dash.heatmap.c!.frac!.level).toBe("logrado");
    expect(dash.heatmap.d!.frac!.level).toBe("logrado");
    expect(dash.heatmap.a!.geo!.level).toBe("sin");
    expect(dash.skillSummary[0]).toMatchObject({ skillId: "frac", assessed: 4, levels: { inicial: 2, logrado: 2 }, topError: { code: "E3_PREG" } });
    expect(dash.coverage).toEqual({ practiced: 1, total: 2 });
  });

  it("agrupa para reforzamiento por OA y error principal, y recomienda reenseñar si ≥ 40 % está en Inicial", () => {
    expect(dash.groups[0]).toEqual({ skillId: "frac", errorCode: "E3_PREG", childIds: ["a", "b"] });
    expect(dash.actions[0]).toMatchObject({ kind: "reensenar", skillId: "frac", inicial: 2, assessed: 4, errorCode: "E3_PREG" });
  });

  it("participación: minutos, inactivos y señales de esfuerzo", () => {
    const a = dash.participation.find((p) => p.childId === "a")!;
    expect(a).toMatchObject({ sessions7d: 1, minutes7d: 12, inactive: false, homeGames: 1, hintRate: 0, fastRate: 0 });
    expect(dash.week).toEqual({ activeStudents: 1, minutes: 12, sessions: 1 });
  });

  it("el clima del curso cuenta a todos, pero las alertas individuales son solo con consentimiento", () => {
    expect(dash.climate.emotionCounts).toMatchObject({ nervios: 3, rabia: 3 });
    expect(dash.climate.reporters).toBe(2);
    expect(dash.climate.difficultSkills[0]).toEqual({ skillId: "frac", reports: 6, students: 2 });
    expect(dash.climate.alerts.map((x) => x.childId)).toEqual(["a"]); // d no autorizó
    expect(dash.actions.some((x) => x.kind === "emocion_tema")).toBe(true);
  });
});

describe("buildDirectorDashboard", () => {
  const skills = [skill("frac"), skill("geo", "Geometría")];
  const ids = (p: string, n: number) => Array.from({ length: n }, (_, i) => `${p}${i}`);
  const classes = [
    { id: "A", name: "3° A", grade: 3, teacherEmail: "t1@x", teacherLastPanelAt: ago(2), studentIds: ids("a", 6) },
    { id: "B", name: "3° B", grade: 3, teacherEmail: "t2@x", teacherLastPanelAt: null, studentIds: ids("b", 3) },
  ];
  const attempts = [...ids("a", 6).flatMap((c) => tries(c, "frac", "1111")), ...ids("b", 3).flatMap((c) => tries(c, "frac", "0000"))];
  const dash = buildDirectorDashboard({ classes, skills, attempts, sessions: [], reflections: [], plays: [], now: NOW });

  it("agrega por eje y nivel, y oculta los grupos con menos de 5 estudiantes", () => {
    const num = dash.masteryByGradeAxis.find((m) => m.axis === "Números y operaciones")!;
    expect(num.logrado).toEqual({ ok: true, value: 6 / 9, students: 9 });
    expect(dash.masteryByGradeAxis.find((m) => m.axis === "Geometría")!.logrado).toEqual({ ok: false, students: 0 });
    expect(dash.classes.find((c) => c.id === "A")!.logrado).toMatchObject({ ok: true, value: 1 });
    expect(dash.classes.find((c) => c.id === "B")!.logrado).toEqual({ ok: false, students: 3 });
    const frac = dash.parallel.find((p) => p.skillId === "frac")!;
    expect(frac.byClass.map((b) => b.logrado.ok)).toEqual([true, false]);
  });

  it("cuenta docentes que usan el panel y alerta baja participación", () => {
    expect(dash.totals).toMatchObject({ classes: 2, students: 9, teachers: 2, teachersUsingPanel7d: 1 });
    expect(dash.alerts).toContainEqual({ kind: "baja_participacion", classId: "A", share: 0 });
  });
});
