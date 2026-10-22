import { describe, expect, it } from "vitest";
import { HOME_GAMES, homeGameFor } from "../../../src/domain/homeGames.js";
import { grade1 } from "../grade1.js";
import { grade2 } from "../grade2.js";
import { grade3 } from "../grade3.js";
import { grade4 } from "../grade4.js";
import { grade5 } from "../grade5.js";
import { grade6 } from "../grade6.js";

describe("HOME_GAMES", () => {
  it("cada contenido del banco (1° a 6°) tiene su juego para la casa completo en español e inglés", () => {
    const ids = new Proxy({}, { get: (_t, code) => String(code) }) as Record<string, string>;
    const skills = [grade1, grade2, grade3, grade4, grade5, grade6].flatMap((g) => g(ids).map((b) => b.skill));
    expect(skills.length).toBeGreaterThan(40);
    for (const s of skills) {
      const game = homeGameFor(s.grade, s.name);
      expect(game, `${s.grade}° ${s.name}`).not.toBeNull();
      expect(game!.emoji).toMatch(/\p{Extended_Pictographic}/u);
      expect(game!.minutes).toBeGreaterThanOrEqual(5);
      expect(game!.minutes).toBeLessThanOrEqual(15);
      for (const lang of ["es", "en"] as const) {
        expect(game!.name[lang].length).toBeGreaterThan(3);
        expect(game!.materials[lang].length).toBeGreaterThan(3);
        expect(game!.steps[lang]).toHaveLength(3);
        for (const step of game!.steps[lang]) expect(step.length).toBeGreaterThan(15);
      }
    }
    expect(Object.keys(HOME_GAMES)).toHaveLength(skills.length);
  });
});
