import { describe, expect, it } from "vitest";
import { childProfileSchema, SUPPORTED_GRADES } from "../schemas.js";

describe("childProfileSchema — cursos soportados", () => {
  const base = { consentId: "c1", displayName: "Niño ficticio" };

  it("acepta de 1° a 6° básico", () => {
    expect(SUPPORTED_GRADES).toEqual([1, 2, 3, 4, 5, 6]);
    for (const grade of SUPPORTED_GRADES) {
      expect(childProfileSchema.safeParse({ ...base, grade }).success).toBe(true);
    }
  });

  it("rechaza cursos fuera de la whitelist", () => {
    for (const grade of [0, 7, 8, -1, 2.5]) {
      expect(childProfileSchema.safeParse({ ...base, grade }).success).toBe(false);
    }
  });
});
