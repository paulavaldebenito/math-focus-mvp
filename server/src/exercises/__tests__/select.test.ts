import { describe, expect, it } from "vitest";
import { allowedThemeWhere, notAttemptedWhere, pickExercise, THEMED_SHARE } from "../select.js";

const neutral = (id: string) => ({ id, theme: null as string | null });
const themed = (id: string, theme: string) => ({ id, theme: theme as string | null });

/// RNG determinístico: devuelve los valores dados en orden (y repite el último).
function seq(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

describe("allowedThemeWhere", () => {
  it("sin intereses solo permite contenido neutro", () => {
    expect(allowedThemeWhere([])).toEqual({ theme: null });
  });

  it("con intereses permite neutro o de alguno de SUS intereses, nunca otro tema", () => {
    expect(allowedThemeWhere(["cocina", "espacio"])).toEqual({
      OR: [{ theme: null }, { theme: { in: ["cocina", "espacio"] } }],
    });
  });
});

describe("notAttemptedWhere", () => {
  it("no descarta los ejercicios sin baseKey (notIn sobre NULL los excluiría)", () => {
    expect(notAttemptedWhere(["e1"], ["k1"])).toEqual({
      AND: [{ id: { notIn: ["e1"] } }, { OR: [{ baseKey: null }, { baseKey: { notIn: ["k1"] } }] }],
    });
  });
});

describe("pickExercise", () => {
  it("devuelve undefined con el pool vacío", () => {
    expect(pickExercise([])).toBeUndefined();
  });

  it("elige un temático cuando el sorteo cae bajo la proporción", () => {
    const pool = [neutral("n1"), themed("t1", "cocina")];
    expect(pickExercise(pool, { rng: seq(THEMED_SHARE - 0.01, 0, 0) })?.id).toBe("t1");
  });

  it("elige un neutro cuando el sorteo cae sobre la proporción", () => {
    const pool = [neutral("n1"), themed("t1", "cocina")];
    expect(pickExercise(pool, { rng: seq(THEMED_SHARE + 0.01, 0) })?.id).toBe("n1");
  });

  it("si no hay temáticos usa neutros, y si no hay neutros usa temáticos", () => {
    expect(pickExercise([neutral("n1")], { rng: seq(0) })?.id).toBe("n1");
    expect(pickExercise([themed("t1", "cocina")], { rng: seq(0.99, 0, 0) })?.id).toBe("t1");
  });

  it("reparte parejo entre intereses, no entre ejercicios", () => {
    // 5 de cocina y 1 de espacio (themedShare 1: no hay neutros): el sorteo de grupo (0.9) cae en el 2.º interés.
    const pool = [
      themed("c1", "cocina"), themed("c2", "cocina"), themed("c3", "cocina"),
      themed("c4", "cocina"), themed("c5", "cocina"), themed("e1", "espacio"),
    ];
    expect(pickExercise(pool, { themedShare: 1, rng: seq(0.9, 0) })?.id).toBe("e1");
    expect(pickExercise(pool, { themedShare: 1, rng: seq(0.1, 0) })?.id).toBe("c1");
  });

  it("nunca sale del pool aunque el rng devuelva casi 1", () => {
    const pool = [neutral("n1"), neutral("n2")];
    expect(pickExercise(pool, { rng: () => 0.999999 })?.id).toBe("n2");
  });

  it("a la larga entrega cerca de la proporción objetivo de temáticos", () => {
    const pool = [neutral("n1"), neutral("n2"), themed("t1", "cocina"), themed("t2", "espacio")];
    let n = 0;
    let themedCount = 0;
    // Generador congruencial simple y fijo: la prueba es reproducible.
    let state = 12345;
    const rng = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
    for (let i = 0; i < 4000; i++) {
      n += 1;
      if (pickExercise(pool, { rng })!.theme !== null) themedCount += 1;
    }
    expect(themedCount / n).toBeGreaterThan(0.66);
    expect(themedCount / n).toBeLessThan(0.74);
  });
});
