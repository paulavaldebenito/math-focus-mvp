import { describe, expect, it } from "vitest";
import { summarizeSocial, weekKey, type SocialRow } from "../social.js";
import { weeklySummary } from "../weekly.js";

const row = (wk: string, over: Partial<SocialRow> = {}): SocialRow => ({
  weekKey: wk,
  createdAt: new Date(),
  recess: 1,
  confidant: 1,
  excluded: "no",
  ...over,
});

describe("weekKey (semana ISO en hora de Chile)", () => {
  it("lunes y domingo de la misma semana comparten clave; el lunes siguiente cambia", () => {
    expect(weekKey(new Date("2026-10-26T15:00:00Z"))).toBe("2026-W44"); // lunes
    expect(weekKey(new Date("2026-11-01T15:00:00Z"))).toBe("2026-W44"); // domingo
    expect(weekKey(new Date("2026-11-02T15:00:00Z"))).toBe("2026-W45");
  });
  it("usa la hora de Chile: el domingo a las 23:30 en Santiago sigue siendo esa semana", () => {
    expect(weekKey(new Date("2026-11-02T02:30:00Z"))).toBe("2026-W44");
  });
});

describe("summarizeSocial: señales para conversar, nunca un diagnóstico", () => {
  const now = new Date("2026-10-28T15:00:00Z"); // miércoles de la W44
  const sum = (rows: SocialRow[]) => summarizeSocial(rows, now);
  it("sin respuestas no hay señal", () => {
    expect(sum([]).signal).toBeNull();
  });
  it("si cuenta que lo molestaron varias veces esta semana, la señal es inmediata (atención)", () => {
    expect(sum([row("2026-W44", { excluded: "varias" })]).signal).toEqual({ level: "atencion", reasons: ["excluded_often"] });
  });
  it("una vez es para conversar; dos de las últimas tres respuestas sube a atención (puede ser acoso)", () => {
    expect(sum([row("2026-W44", { excluded: "una_vez" })]).signal).toEqual({ level: "conversar", reasons: ["excluded_once"] });
    expect(sum([row("2026-W44", { excluded: "una_vez" }), row("2026-W43"), row("2026-W42", { excluded: "una_vez" })]).signal).toEqual({
      level: "atencion",
      reasons: ["excluded_repeated"],
    });
  });
  it("si lo contó hace poco y esta semana no, queda una señal para preguntar cómo sigue", () => {
    expect(sum([row("2026-W44"), row("2026-W43", { excluded: "varias" })]).signal).toEqual({ level: "conversar", reasons: ["excluded_recent"] });
  });
  it("las señales caducan: una respuesta de hace más de 6 semanas no cuenta, y la «última» debe ser reciente", () => {
    expect(sum([row("2026-W30", { excluded: "varias" })]).signal).toBeNull();
    expect(sum([row("2026-W41", { excluded: "varias" })]).signal?.reasons).toEqual(["excluded_recent"]);
  });
  it("sin nadie queriendo compañía y sin a quién contarle, la misma semana, es señal; una sola de las dos, no", () => {
    expect(sum([row("2026-W44", { recess: 4, confidant: 3 })]).signal?.reasons).toEqual(["alone_and_no_confidant"]);
    expect(sum([row("2026-W44", { recess: 4 })]).signal).toBeNull();
    expect(sum([row("2026-W44", { recess: 4 }), row("2026-W43"), row("2026-W42", { recess: 4 })]).signal?.reasons).toEqual(["alone_recess"]);
  });
  it("estar sin nadie y estar bien no es una señal; tampoco las semanas sin colegio", () => {
    expect(sum([row("2026-W44", { recess: 3 }), row("2026-W43", { recess: 3 })]).signal).toBeNull();
    expect(sum([row("2026-W44", { recess: 5, confidant: null, excluded: null }), row("2026-W43", { recess: 5, confidant: null, excluded: null })]).signal).toBeNull();
  });
  it("no tener a quién contarle dos de tres semanas es una señal", () => {
    expect(sum([row("2026-W44", { confidant: 3 }), row("2026-W43", { confidant: 3 })]).signal?.reasons).toContain("no_confidant");
  });
  it("«prefiero no decir» varias veces es una nota, no una señal", () => {
    const s = sum([row("2026-W44", { excluded: "prefiero_no" }), row("2026-W43", { excluded: "prefiero_no" })]);
    expect(s.signal).toBeNull();
    expect(s.notes).toEqual(["prefers_not_say"]);
  });
  it("una semana saltada no cuenta ni a favor ni en contra", () => {
    const s = sum([row("2026-W45", { recess: null, confidant: null, excluded: null }), row("2026-W44", { excluded: "varias" })]);
    expect(s.answeredWeeks).toBe(1);
    expect(s.latest?.weekKey).toBe("2026-W44");
  });
});

describe("weeklySummary", () => {
  const now = new Date("2026-10-28T15:00:00Z"); // miércoles de la W44
  const skill = { id: "s1", name: "Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4", nameEn: "Common fractions" };
  const base = {
    now,
    sessions: [{ startedAt: new Date("2026-10-27T15:00:00Z") }, { startedAt: new Date("2026-10-20T15:00:00Z") }],
    attempts: Array.from({ length: 10 }, (_, i) => ({ createdAt: new Date("2026-10-27T15:00:00Z"), isCorrect: i < 8, skill })),
    reflections: [{ createdAt: new Date("2026-10-27T15:10:00Z"), emotion: "alegria" }],
    checkIns: [{ createdAt: new Date("2026-10-27T15:00:00Z"), mood: 4 }],
    topicsNeedingHelp: [],
    socialEnabled: true,
    social: summarizeSocial([], now),
  };
  it("compara esta semana con la anterior y marca «bien» cuando no hay nada que mirar", () => {
    const w = weeklySummary(base);
    expect(w.learning).toMatchObject({ status: "bien", practices: 1, practicesPrev: 1, accuracy: 0.8 });
    expect(w.feelings).toMatchObject({ status: "bien", topEmotion: "alegria", moodAvg: 4 });
    expect(w.social.status).toBe("sin_datos");
  });
  it("sin práctica esta semana el aprendizaje queda «sin datos», no en rojo", () => {
    expect(weeklySummary({ ...base, sessions: [], attempts: [] }).learning.status).toBe("sin_datos");
  });
  it("rabia o nervios en la mitad de las prácticas sugieren conversar, pero con un solo registro no se concluye nada", () => {
    const r = (emotion: string) => ({ createdAt: new Date("2026-10-27T15:10:00Z"), emotion });
    expect(weeklySummary({ ...base, reflections: [r("nervios")] }).feelings.status).toBe("bien");
    expect(weeklySummary({ ...base, reflections: [r("nervios"), r("alegria")] }).feelings.status).toBe("conversar");
  });
  it("«sin señales» solo si respondió esta semana; si no, queda «sin datos»", () => {
    expect(weeklySummary({ ...base, social: summarizeSocial([row("2026-W43")], now) }).social.status).toBe("sin_datos");
    expect(weeklySummary({ ...base, social: summarizeSocial([row("2026-W44")], now) }).social.status).toBe("bien");
  });
  it("la pregunta social desactivada se muestra como tal y una señal sube a la tarjeta", () => {
    expect(weeklySummary({ ...base, socialEnabled: false }).social.status).toBe("desactivado");
    expect(weeklySummary({ ...base, social: summarizeSocial([row("2026-W44", { excluded: "varias" })], now) }).social).toEqual({
      status: "atencion",
      answeredThisWeek: true,
    });
  });
});
