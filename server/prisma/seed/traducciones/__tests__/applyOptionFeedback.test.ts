import { describe, expect, it } from "vitest";
import { loadOptionFeedback } from "../applyOptionFeedback.js";

describe("feedback_por_alternativa.json", () => {
  const data = loadOptionFeedback();

  it("una entrada por alternativa, con texto en español e inglés", () => {
    expect(data.length).toBeGreaterThan(0);
    expect(new Set(data.map((f) => f.optionId)).size).toBe(data.length);
    for (const f of data) {
      expect(f.feedback.trim(), f.optionId).not.toBe("");
      expect(f.feedbackEn.trim(), f.optionId).not.toBe("");
      expect(f.feedbackEn, f.optionId).not.toBe(f.feedback);
    }
  });

  it("sin etiquetas de capacidad ni frases que minimicen la dificultad", () => {
    const banned = /genio|inteligente|muy f[aá]cil|es f[aá]cil|genius|smart|so easy|it's easy/i;
    for (const f of data) {
      expect(f.feedback, f.optionId).not.toMatch(banned);
      expect(f.feedbackEn, f.optionId).not.toMatch(banned);
    }
  });
});
