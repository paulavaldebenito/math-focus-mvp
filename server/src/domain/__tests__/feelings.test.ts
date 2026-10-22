import { describe, expect, it } from "vitest";
import { EMOTION_GUIDANCE, EMOTIONS, extraQuestionFor, summarizeFeelings, topicProgress, type ReflectionRow } from "../feelings.js";

const day = (d: Date) => d.toISOString().slice(0, 10);
const NOW = new Date("2026-10-22T15:00:00Z");
const ago = (days: number) => new Date(NOW.getTime() - days * 24 * 3600 * 1000);
const skill = { id: "s1", name: "Fracciones", nameEn: "Fractions" };
const r = (days: number, emotion: string | null, extra: Partial<ReflectionRow> = {}): ReflectionRow => ({
  createdAt: ago(days), emotion, weather: null, energy: null, hardest: null, skill, ...extra,
});

describe("extraQuestionFor", () => {
  it("rota entre clima, energía y lo más difícil", () => {
    expect([0, 1, 2, 3].map(extraQuestionFor)).toEqual(["weather", "energy", "hardest", "weather"]);
  });
});

describe("EMOTION_GUIDANCE", () => {
  it("cada emoción tiene emoji, qué decir y qué hacer en ambos idiomas", () => {
    for (const e of EMOTIONS) {
      const g = EMOTION_GUIDANCE[e];
      expect(g.emoji).toMatch(/\p{Extended_Pictographic}/u);
      for (const lang of ["es", "en"] as const) {
        expect(g.say[lang].length).toBeGreaterThanOrEqual(2);
        expect(g.do[lang].length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe("summarizeFeelings", () => {
  it("destaca una emoción difícil repetida, cuenta solo la ventana de 14 días y promedia clima y energía", () => {
    const s = summarizeFeelings(
      [r(1, "nervios", { weather: 2 }), r(3, "nervios", { energy: 3 }), r(4, "alegria", { weather: 4 }), r(30, "rabia"), r(2, null, { hardest: "cuentas" }), r(5, "calma", { hardest: "cuentas" })],
      day,
      NOW,
    );
    expect(s.answered).toBe(4);
    expect(s.counts.nervios).toBe(2);
    expect(s.counts.rabia).toBe(0);
    expect(s.focus[0]).toBe("nervios");
    expect(s.focus).toHaveLength(2);
    expect(s.weatherAvg).toBe(3);
    expect(s.energyAvg).toBe(3);
    expect(s.hardestFocus).toBe("cuentas");
    expect(s.recent[0]).toMatchObject({ emotion: "nervios", skill });
  });

  it("una sola tarde difícil se destaca solo si es la más reciente; si no hay difíciles, refuerza la positiva", () => {
    expect(summarizeFeelings([r(1, "rabia"), r(2, "alegria")], day, NOW).focus).toEqual(["rabia", "alegria"]);
    expect(summarizeFeelings([r(1, "alegria"), r(2, "rabia")], day, NOW).focus).toEqual(["alegria"]);
    expect(summarizeFeelings([], day, NOW)).toMatchObject({ answered: 0, focus: [], weatherAvg: null, hardestFocus: null });
  });
});

describe("topicProgress", () => {
  const sk = { id: "s1", grade: 3, name: "Fracciones", nameEn: null };
  const at = (i: number, ok: boolean) => ({ createdAt: new Date(NOW.getTime() + i * 60000), isCorrect: ok, skill: sk });

  it("marca tendencia al alza cuando los últimos intentos van mejor que los anteriores", () => {
    const attempts = [...Array.from({ length: 6 }, (_, i) => at(i, false)), ...Array.from({ length: 8 }, (_, i) => at(10 + i, true))];
    const [t] = topicProgress(attempts, [], day);
    expect(t).toMatchObject({ skillId: "s1", attempts: 14, trend: "up", needsHelp: [] });
  });

  it("pide ayuda por pocos aciertos y por una emoción difícil reciente en ese tema", () => {
    const attempts = [at(0, false), at(1, false), at(2, true), at(3, false)];
    const [t] = topicProgress(attempts, [r(0, "nervios")], day);
    expect(t!.trend).toBeNull();
    expect(t!.lastEmotion).toBe("nervios");
    expect(t!.needsHelp).toEqual(["aciertos", "emocion"]);
  });
});
