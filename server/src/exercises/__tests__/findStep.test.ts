import { describe, expect, it } from "vitest";
import { buildFindStepRound, isFindStepEligible, type FindStepExercise } from "../spotError.js";

const steps = [
  { es: "Denominador común: 1/2 = 2/4.", en: "Common denominator: 1/2 = 2/4." },
  { es: "2/4 + 1/4 = 3/4. Respuesta: 3/4.", en: "2/4 + 1/4 = 3/4. Answer: 3/4." },
];
const ex = (over: Partial<FindStepExercise> = {}): FindStepExercise => ({
  id: "e1",
  prompt: "¿Cuánto es 1/2 + 1/4?",
  solution: steps,
  options: [
    { id: "ok", label: "3/4", isCorrect: true, errorType: null, wrongStep: null },
    { id: "w0", label: "2/6", isCorrect: false, errorType: { code: "E2_RES" }, wrongStep: { step: 0, es: "Se suman arriba y abajo.", en: "Top and bottom are added." } },
    { id: "w1", label: "1/4", isCorrect: false, errorType: { code: "E1_OP" }, wrongStep: { step: 1, es: "Se resta: 2/4 − 1/4 = 1/4.", en: "It’s subtracted." } },
  ],
  ...over,
});

describe("encuentra el paso equivocado", () => {
  it("usa solo errores con al menos un paso correcto antes, y muestra esos pasos más el equivocado", () => {
    expect(isFindStepEligible(ex())).toBe(true);
    const round = buildFindStepRound(ex(), () => 0)!;
    expect(round.wrongOptionId).toBe("w1");
    expect(round.lines).toEqual([steps[0], { es: "Se resta: 2/4 − 1/4 = 1/4.", en: "It’s subtracted." }]);
    expect(round.characterAnswerLabel).toBe("1/4");
  });

  it("no sirve sin desarrollo, si todos los errores están en el primer paso, o si es «¿cuál de estas…?»", () => {
    expect(isFindStepEligible(ex({ solution: null }))).toBe(false);
    expect(isFindStepEligible(ex({ options: ex().options.slice(0, 2) }))).toBe(false);
    expect(isFindStepEligible(ex({ prompt: "¿Cuál de estas fracciones es la mayor?" }))).toBe(false);
  });
});
