import { describe, expect, it } from "vitest";
import { computeInitialLevel } from "../initialCalibration.js";

describe("computeInitialLevel", () => {
  it("0/5 correctas → nivel 1 (caso límite inferior)", () => {
    expect(computeInitialLevel(0, 5)).toBe(1);
  });

  it("5/5 correctas → nivel 3 (caso límite superior)", () => {
    expect(computeInitialLevel(5, 5)).toBe(3);
  });

  it("1/5 correctas → nivel 1", () => {
    expect(computeInitialLevel(1, 5)).toBe(1);
  });

  it("2/5 correctas (ratio 0.4, límite exacto) → nivel 2", () => {
    expect(computeInitialLevel(2, 5)).toBe(2);
  });

  it("3/5 correctas → nivel 2", () => {
    expect(computeInitialLevel(3, 5)).toBe(2);
  });

  it("4/5 correctas (ratio 0.8, límite exacto) → nivel 3", () => {
    expect(computeInitialLevel(4, 5)).toBe(3);
  });

  it("rechaza totalCount <= 0", () => {
    expect(() => computeInitialLevel(0, 0)).toThrow();
  });

  it("rechaza correctCount fuera de rango", () => {
    expect(() => computeInitialLevel(6, 5)).toThrow();
    expect(() => computeInitialLevel(-1, 5)).toThrow();
  });
});
