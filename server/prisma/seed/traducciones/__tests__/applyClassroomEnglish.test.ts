import { describe, expect, it } from "vitest";
import { decide, loadClassroomEnglish } from "../applyClassroomEnglish.js";

describe("decide", () => {
  const change = { old: "How much is 6 + 7?", new: "What is 6 + 7?" };

  it("escribe solo si la BD tiene exactamente el texto anterior", () => {
    expect(decide("How much is 6 + 7?", change)).toBe("write");
  });

  it("no hace nada si ya tiene el texto nuevo (idempotente)", () => {
    expect(decide("What is 6 + 7?", change)).toBe("already");
  });

  it("señala un valor distinto (o vacío) en vez de pisarlo", () => {
    expect(decide("How much is 6 + 8?", change)).toBe("conflict");
    expect(decide(null, change)).toBe("conflict");
    // Varios textos anteriores aceptados (el texto pasó por más de una corrección).
    const chained = { old: ["It costs $10.", "It costs $10!"], new: "It costs 10 pesos." };
    expect(decide("It costs $10!", chained)).toBe("write");
    expect(decide("It costs 10 pesos.", chained)).toBe("already");
  });
});

describe("ingles_de_aula.json", () => {
  const data = loadClassroomEnglish();
  /// Números del texto (multiconjunto ordenado), sin la glosa de la escala de notas chilena.
  const numbers = (s: string) => (s.replace(" (on a 1 to 7 scale)", "").match(/\d+(?:[.,]\d+)*/g) ?? []).sort();

  it("cada cambio trae un texto distinto al anterior y nunca cambia los números del enunciado ni de la pista", () => {
    expect(data.ejercicios.length).toBeGreaterThan(0);
    for (const e of data.ejercicios) {
      for (const field of ["promptEn", "procedureNoteEn"] as const) {
        const c = e[field];
        if (!c) continue;
        for (const old of Array.isArray(c.old) ? c.old : [c.old]) {
          expect(c.new, e.exerciseId).not.toBe(old);
          expect(numbers(c.new), `${e.exerciseId} ${field}`).toEqual(numbers(old));
        }
      }
    }
  });

  it("usa el vocabulario elegido: sin 'How much is', 'pictogram', 'football', 'circle graph' ni ortografía británica", () => {
    const banned = /\$\d|How much is \d|pictogram|football|circle graph|colour|favourite|metres|litres|kilos\b/i;
    for (const e of data.ejercicios) {
      for (const c of [e.promptEn, e.procedureNoteEn]) if (c) expect(c.new, e.exerciseId).not.toMatch(banned);
    }
    for (const s of data.habilidades) {
      if (s.axisEn) expect(["Numbers and Operations", "Patterns and Algebra", "Geometry", "Measurement", "Data and Probability"]).toContain(s.axisEn.new);
    }
  });
});
