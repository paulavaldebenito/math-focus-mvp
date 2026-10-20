import { describe, expect, it } from "vitest";
import { buildWellbeingCross, localDay, skillsToReview } from "../wellbeing.js";

// Mediodía en Chile (UTC-3/-4) de un día dado.
const at = (day: string, hourUtc = 16) => new Date(`${day}T${String(hourUtc).padStart(2, "0")}:00:00Z`);
const tries = (day: string, correct: number, wrong: number) => [
  ...Array.from({ length: correct }, () => ({ createdAt: at(day), isCorrect: true })),
  ...Array.from({ length: wrong }, () => ({ createdAt: at(day), isCorrect: false })),
];

describe("localDay", () => {
  it("usa la hora de Chile: las 01:00 UTC todavía son el día anterior en Santiago", () => {
    expect(localDay(new Date("2026-09-30T01:00:00Z"))).toBe("2026-09-29");
    expect(localDay(new Date("2026-09-30T15:00:00Z"))).toBe("2026-09-30");
  });
});

describe("buildWellbeingCross", () => {
  it("cruza cada día con check-in con la precisión de ese mismo día", () => {
    const cross = buildWellbeingCross(
      [
        { createdAt: at("2026-09-28"), mood: 2, mathFeeling: 1 },
        { createdAt: at("2026-09-29"), mood: 5, mathFeeling: 5 },
      ],
      [...tries("2026-09-28", 1, 3), ...tries("2026-09-29", 4, 0)],
    );
    expect(cross.days.map((d) => [d.date, d.mood, d.mathFeeling, d.accuracy])).toEqual([
      ["2026-09-29", 5, 5, 1],
      ["2026-09-28", 2, 1, 0.25],
    ]);
    expect(cross.comparison.mathNervous).toEqual({ days: 1, accuracy: 0.25 });
    expect(cross.comparison.mathCalm).toEqual({ days: 1, accuracy: 1 });
    expect(cross.comparison.moodLow.accuracy).toBe(0.25);
    expect(cross.recentMathFeeling).toBe(3);
  });

  it("ignora los check-in saltados y no inventa precisión en días sin ejercicios", () => {
    const cross = buildWellbeingCross(
      [
        { createdAt: at("2026-09-27"), mood: null, mathFeeling: null },
        { createdAt: at("2026-09-28"), mood: 4, mathFeeling: null },
      ],
      [],
    );
    expect(cross.days).toEqual([{ date: "2026-09-28", mood: 4, mathFeeling: null, attempts: 0, correct: 0, accuracy: null }]);
    expect(cross.comparison.moodHigh).toEqual({ days: 0, accuracy: null });
    expect(cross.recentMathFeeling).toBeNull();
  });
});

describe("skillsToReview", () => {
  const skill = (id: string) => ({ id, grade: 3, name: `S${id}`, nameEn: null });
  const rows = (id: string, correct: number, wrong: number) => [
    ...Array.from({ length: correct }, () => ({ isCorrect: true, skill: skill(id) })),
    ...Array.from({ length: wrong }, () => ({ isCorrect: false, skill: skill(id) })),
  ];

  it("sugiere los contenidos con menos aciertos, con un mínimo de intentos y máximo 3", () => {
    const out = skillsToReview([
      ...rows("a", 1, 4), // 20 %
      ...rows("b", 2, 2), // 50 %
      ...rows("c", 9, 1), // 90 %: bien, no se sugiere
      ...rows("d", 0, 2), // pocos intentos
      ...rows("e", 2, 3), // 40 %
      ...rows("f", 3, 3), // 50 %
    ]);
    expect(out.map((s) => s.skillId)).toEqual(["a", "e", "f"]);
    expect(out[0]!.accuracy).toBeCloseTo(0.2);
  });
});
