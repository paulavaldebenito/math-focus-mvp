import { describe, expect, it } from "vitest";
import type { AttemptResult } from "../api/types.js";
import { wrongFeedbackText } from "./feedback.js";
import { ERROR_FEEDBACK, t } from "./i18n.js";
import { shortSkillName } from "./skillShortNames.js";

const result = (over: Partial<AttemptResult>): AttemptResult =>
  ({ isCorrect: false, action: { ruleCode: "KEEP" }, level: 1, errorCode: null, bonusStarAwarded: false, ...over }) as AttemptResult;

describe("wrongFeedbackText", () => {
  it("si respondió muy rápido, el aviso va delante del mensaje del tipo de error (antes se perdía)", () => {
    const text = wrongFeedbackText("es", result({ errorCode: "E2_CAL", action: { ruleCode: "FAST_THEN_WRONG" } as AttemptResult["action"] }));
    expect(text).toBe(`${t("es", "feedbackReview")} ${ERROR_FEEDBACK.es.E2_CAL}`);
  });

  it("el mensaje propio de la alternativa sigue teniendo prioridad sobre el del tipo de error", () => {
    expect(wrongFeedbackText("es", result({ errorCode: "E2_CAL", feedback: "Revisa 7 × 8." }))).toBe("Revisa 7 × 8.");
  });
});

describe("shortSkillName", () => {
  it("muestra al niño un nombre corto y deja el oficial como respaldo", () => {
    expect(shortSkillName("es", "Adición y sustracción dentro de 20", "Addition and subtraction within 20")).toBe("Sumar y restar hasta 20");
    expect(shortSkillName("en", "Adición y sustracción dentro de 20", "Addition and subtraction within 20")).toBe("Adding and subtracting to 20");
    expect(shortSkillName("es", "Habilidad nueva", null)).toBe("Habilidad nueva");
  });
});
