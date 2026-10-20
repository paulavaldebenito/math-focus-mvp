import { describe, expect, it } from "vitest";
import { buildSpotErrorRound, isSpotErrorEligible, SPOT_ERROR_CODES, wantsSpotErrorRound } from "../spotError.js";

describe("wantsSpotErrorRound", () => {
  it("nunca en la primera pregunta (0 ya respondidas)", () => {
    expect(wantsSpotErrorRound(0)).toBe(false);
  });

  it("sí cada SPOT_ERROR_EVERY preguntas respondidas", () => {
    expect(wantsSpotErrorRound(3)).toBe(true);
    expect(wantsSpotErrorRound(6)).toBe(true);
  });

  it("no en preguntas que no calzan con el múltiplo", () => {
    expect(wantsSpotErrorRound(1)).toBe(false);
    expect(wantsSpotErrorRound(2)).toBe(false);
    expect(wantsSpotErrorRound(4)).toBe(false);
  });
});

describe("isSpotErrorEligible", () => {
  it("true si tiene una alternativa incorrecta con un ErrorType diagnosticable", () => {
    const ex = {
      id: "e1",
      prompt: "¿Cuánto es 8 + 5?",
      options: [
        { id: "a", label: "13", isCorrect: true, errorType: null },
        { id: "b", label: "12", isCorrect: false, errorType: { code: "E1_OP" } },
      ],
    };
    expect(isSpotErrorEligible(ex)).toBe(true);
  });

  it("false si ninguna alternativa incorrecta está clasificada todavía", () => {
    const ex = {
      id: "e1",
      prompt: "¿Cuánto es 8 + 5?",
      options: [
        { id: "a", label: "13", isCorrect: true, errorType: null },
        { id: "b", label: "12", isCorrect: false, errorType: null },
      ],
    };
    expect(isSpotErrorEligible(ex)).toBe(false);
  });

  it("false si el único código clasificado es un patrón de comportamiento (no diagnosticable)", () => {
    const ex = {
      id: "e1",
      prompt: "¿Cuánto es 8 + 5?",
      options: [
        { id: "a", label: "13", isCorrect: true, errorType: null },
        { id: "b", label: "12", isCorrect: false, errorType: { code: "abandono" } },
      ],
    };
    expect(isSpotErrorEligible(ex)).toBe(false);
  });

  // Bug real reportado: "¿Cuál de estos valores es el mayor? 💬 3/5 — no se
  // entiende la pregunta". La ronda mostraba una sola alternativa suelta de
  // un ejercicio cuyos valores a comparar solo existen en las alternativas
  // (nunca en el enunciado) — sin las demás, no hay nada que comparar.
  it("false para preguntas '¿cuál de estos/estas...?' aunque tengan una alternativa clasificada", () => {
    const ex = {
      id: "e1",
      prompt: "¿Cuál de estos valores es el mayor?",
      options: [
        { id: "a", label: "7/10", isCorrect: true, errorType: null },
        { id: "b", label: "3/5", isCorrect: false, errorType: { code: "E1_OP" } },
      ],
    };
    expect(isSpotErrorEligible(ex)).toBe(false);
  });

  it("sigue eligible una pregunta de comparación que sí incluye los valores en el enunciado", () => {
    const ex = {
      id: "e1",
      prompt: "¿Cuál de estos números es el más grande: 5, 12, 8?",
      options: [
        { id: "a", label: "12", isCorrect: true, errorType: null },
        { id: "b", label: "8", isCorrect: false, errorType: { code: "E1_OP" } },
      ],
    };
    // Se excluye TODA la familia "¿cuál de est...?" a propósito (ver
    // comentario en spotError.ts) aunque este caso puntual sí liste los
    // valores en el enunciado — más simple y seguro que distinguir casos.
    expect(isSpotErrorEligible(ex)).toBe(false);
  });

  it("no excluye preguntas que solo contienen 'cuáles' sin '... de est/aquell...' (sí son autocontenidas)", () => {
    const ex = {
      id: "e1",
      prompt: "El patrón crece de 4 en 4: 3, 7, 11, ... ¿Cuáles son los dos números que siguen?",
      options: [
        { id: "a", label: "15, 19", isCorrect: true, errorType: null },
        { id: "b", label: "14, 18", isCorrect: false, errorType: { code: "E2_CAL" } },
      ],
    };
    expect(isSpotErrorEligible(ex)).toBe(true);
  });
});

describe("buildSpotErrorRound", () => {
  const ex = {
    id: "e1",
    prompt: "¿Cuánto es 8 + 5?",
    options: [
      { id: "a", label: "13", isCorrect: true, errorType: null },
      { id: "b", label: "12", isCorrect: false, errorType: { code: "E1_OP" } },
      { id: "c", label: "14", isCorrect: false, errorType: { code: "E2_CAL" } },
    ],
  };

  it("null si el ejercicio no es elegible", () => {
    const notEligible = { id: "e2", prompt: "¿Cuánto es 1 + 0?", options: [{ id: "a", label: "1", isCorrect: true, errorType: null }] };
    expect(buildSpotErrorRound(notEligible)).toBeNull();
  });

  it("arma la ronda con la alternativa correcta, la elegida como 'del personaje', y 3 explicaciones únicas", () => {
    const round = buildSpotErrorRound(ex, () => 0); // rng=0 -> siempre el primer elemento de cada lista
    expect(round).not.toBeNull();
    expect(round!.correctAnswerLabel).toBe("13");
    // Con rng=0 la "primera" alternativa clasificada (orden de aparición) es "b" (E1_OP).
    expect(round!.wrongOptionId).toBe("b");
    expect(round!.characterAnswerLabel).toBe("12");
    expect(round!.explanationOptions).toHaveLength(3);
    expect(new Set(round!.explanationOptions).size).toBe(3);
    expect(round!.explanationOptions).toContain("E1_OP");
  });

  it("la explicación correcta siempre está entre las opciones ofrecidas, para cualquier rng", () => {
    for (const rng of [() => 0, () => 0.5, () => 0.999]) {
      const round = buildSpotErrorRound(ex, rng)!;
      const codes = ex.options.find((o) => o.id === round.wrongOptionId)!.errorType!.code;
      expect(round.explanationOptions).toContain(codes);
    }
  });

  it("nunca ofrece un código fuera del catálogo diagnosticable", () => {
    const round = buildSpotErrorRound(ex, () => 0.5)!;
    for (const code of round.explanationOptions) {
      expect(SPOT_ERROR_CODES as readonly string[]).toContain(code);
    }
  });
});
