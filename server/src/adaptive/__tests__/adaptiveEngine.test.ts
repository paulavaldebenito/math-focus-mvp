import { describe, expect, it } from "vitest";
import { applyLevelChange, evaluateAdaptiveRules, type AttemptRecord } from "../adaptiveEngine.js";

function attempt(overrides: Partial<AttemptRecord> = {}): AttemptRecord {
  return {
    isCorrect: true,
    errorLevel: null,
    responseTimeMs: 5000,
    hintsUsed: 0,
    ...overrides,
  };
}

describe("evaluateAdaptiveRules", () => {
  it("historial vacío → sin cambio", () => {
    const action = evaluateAdaptiveRules([]);
    expect(action.ruleCode).toBe("NO_RULE_TRIGGERED");
  });

  it("regla: 2 errores de nivel 1 (conceptual) consecutivos → baja nivel con representación visual", () => {
    const history = [
      attempt({ isCorrect: false, errorLevel: 1 }),
      attempt({ isCorrect: false, errorLevel: 1 }),
    ];
    const action = evaluateAdaptiveRules(history);
    expect(action.type).toBe("LOWER_LEVEL");
    expect(action.ruleCode).toBe("TWO_CONCEPTUAL_ERRORS");
    if (action.type === "LOWER_LEVEL") {
      expect(action.representation).toBe("visual");
    }
  });

  it("2 errores consecutivos de niveles MIXTOS (no ambos nivel 1) → no dispara la regla de bajar nivel", () => {
    const history = [
      attempt({ isCorrect: false, errorLevel: 1 }),
      attempt({ isCorrect: false, errorLevel: 2 }),
    ];
    const action = evaluateAdaptiveRules(history);
    expect(action.ruleCode).not.toBe("TWO_CONCEPTUAL_ERRORS");
  });

  it("regla: error justo después de una respuesta muy rápida → sugiere revisar el enunciado (nunca dice 'impulsivo')", () => {
    const history = [attempt({ isCorrect: false, errorLevel: 2, responseTimeMs: 1200 })];
    const action = evaluateAdaptiveRules(history);
    expect(action.type).toBe("SUGGEST_REVIEW_PROMPT");
    expect(action.ruleCode).toBe("FAST_THEN_WRONG");
    expect(action.reason.toLowerCase()).not.toContain("impulsiv");
    expect(action.reason.toLowerCase()).not.toContain("tdah");
  });

  it("regla: 3 aciertos consecutivos sin pistas → sube nivel", () => {
    const history = [attempt(), attempt(), attempt()];
    const action = evaluateAdaptiveRules(history);
    expect(action.type).toBe("RAISE_LEVEL");
    expect(action.ruleCode).toBe("THREE_CORRECT_NO_HELP");
  });

  it("3 aciertos pero CON pistas en alguno → no sube nivel", () => {
    const history = [attempt(), attempt({ hintsUsed: 1 }), attempt()];
    const action = evaluateAdaptiveRules(history);
    expect(action.ruleCode).not.toBe("THREE_CORRECT_NO_HELP");
  });

  it("regla: pistas usadas en las últimas 2 preguntas → mantiene nivel, cambia explicación", () => {
    const history = [attempt({ hintsUsed: 1 }), attempt({ hintsUsed: 2 })];
    const action = evaluateAdaptiveRules(history);
    expect(action.type).toBe("KEEP_LEVEL_CHANGE_EXPLANATION");
    expect(action.ruleCode).toBe("REPEATED_HINTS");
  });

  it("regla: 3 respuestas incorrectas seguidas (cualquier tipo) → ofrece pausa, sin bloquear", () => {
    const history = [
      attempt({ isCorrect: false, errorLevel: 2 }),
      attempt({ isCorrect: false, errorLevel: 2 }),
      attempt({ isCorrect: false, errorLevel: 3 }),
    ];
    const action = evaluateAdaptiveRules(history);
    expect(action.type).toBe("OFFER_PAUSE");
    if (action.type === "OFFER_PAUSE") {
      expect(action.blocksProgress).toBe(false);
    }
  });

  it("prioridad: cansancio (3 incorrectas) gana sobre 2 de nivel 1 consecutivas dentro de esas 3", () => {
    // Las últimas 2 de las 3 son de nivel 1 — igual gana la señal de
    // cansancio, porque se evalúa primero según el orden de prioridad
    // documentado.
    const history = [
      attempt({ isCorrect: false, errorLevel: 2 }),
      attempt({ isCorrect: false, errorLevel: 1 }),
      attempt({ isCorrect: false, errorLevel: 1 }),
    ];
    const action = evaluateAdaptiveRules(history);
    expect(action.ruleCode).toBe("FATIGUE_SIGNAL");
  });

  it("no interpreta ningún patrón como diagnóstico: ningún 'reason' menciona TDAH ni déficit atencional", () => {
    const scenarios: AttemptRecord[][] = [
      [attempt({ isCorrect: false, errorLevel: 1 }), attempt({ isCorrect: false, errorLevel: 1 })],
      [attempt({ isCorrect: false, responseTimeMs: 500 })],
      [attempt({ hintsUsed: 1 }), attempt({ hintsUsed: 1 })],
    ];
    for (const history of scenarios) {
      const action = evaluateAdaptiveRules(history);
      expect(action.reason.toLowerCase()).not.toContain("tdah");
      expect(action.reason.toLowerCase()).not.toContain("déficit atencional");
      expect(action.reason.toLowerCase()).not.toContain("diagnóst");
    }
  });
});

describe("applyLevelChange", () => {
  it("baja de nivel sin pasar de 1", () => {
    const action = evaluateAdaptiveRules([
      attempt({ isCorrect: false, errorLevel: 1 }),
      attempt({ isCorrect: false, errorLevel: 1 }),
    ]);
    expect(applyLevelChange(1, action)).toBe(1);
    expect(applyLevelChange(2, action)).toBe(1);
  });

  it("sube de nivel sin pasar de 3", () => {
    const action = evaluateAdaptiveRules([attempt(), attempt(), attempt()]);
    expect(applyLevelChange(3, action)).toBe(3);
    expect(applyLevelChange(2, action)).toBe(3);
  });

  it("NO_CHANGE y otras acciones no tocan el nivel", () => {
    const action = evaluateAdaptiveRules([]);
    expect(applyLevelChange(2, action)).toBe(2);
  });
});
