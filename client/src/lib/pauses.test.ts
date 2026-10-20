import { describe, expect, it } from "vitest";
import { BREATHING_EXERCISES, MATH_MOVEMENT_EXERCISES, MOVEMENT_EXERCISES, randomBreathing, randomMovement } from "./pauses.js";

describe("pausas sin repetir en la sesión", () => {
  it("nunca elige un ejercicio ya hecho mientras queden otros", () => {
    const used = MOVEMENT_EXERCISES.slice(0, -1).map((e) => e.key);
    for (let i = 0; i < 50; i++) expect(randomMovement(used).key).toBe(MOVEMENT_EXERCISES.at(-1)!.key);
    const usedB = [BREATHING_EXERCISES[0]!.key, BREATHING_EXERCISES[1]!.key];
    for (let i = 0; i < 50; i++) expect(usedB).not.toContain(randomBreathing(usedB).key);
  });

  it("si ya se hicieron todos, igual ofrece uno (nunca deja al niño sin pausa)", () => {
    const all = BREATHING_EXERCISES.map((e) => e.key);
    expect(all).toContain(randomBreathing(all).key);
  });
});

describe("movimientos matemáticos por curso", () => {
  it("cada curso de 1° a 6° tiene al menos 4 movimientos matemáticos, con versión sentado/a en ambos idiomas", () => {
    for (let g = 1; g <= 6; g++) {
      const forGrade = MATH_MOVEMENT_EXERCISES.filter((e) => e.grades?.includes(g));
      expect(forGrade.length, `${g}°`).toBeGreaterThanOrEqual(4);
    }
    const keys = [...MATH_MOVEMENT_EXERCISES, ...MOVEMENT_EXERCISES].map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const e of MATH_MOVEMENT_EXERCISES) {
      for (const text of [e.es, e.en, e.seatedEs, e.seatedEn]) expect(text.length, e.key).toBeGreaterThan(20);
    }
  });

  it("con curso, elige un movimiento matemático de ese curso y no repite en la sesión", () => {
    const used: string[] = [];
    const forGrade = MATH_MOVEMENT_EXERCISES.filter((e) => e.grades?.includes(4));
    for (let i = 0; i < forGrade.length; i++) {
      const m = randomMovement(used, Math.random, 4);
      expect(m.grades).toContain(4);
      expect(used).not.toContain(m.key);
      used.push(m.key);
    }
    // Agotados los de su curso: sigue con uno genérico, tampoco repetido.
    const next = randomMovement(used, Math.random, 4);
    expect(next.grades).toBeUndefined();
    expect(used).not.toContain(next.key);
  });

  it("sin curso, sigue usando solo los movimientos genéricos (como antes)", () => {
    for (let i = 0; i < 20; i++) expect(randomMovement().grades).toBeUndefined();
  });
});
