import { describe, expect, it } from "vitest";
import { FAMILY_TIPS, familyTipFor } from "../../../src/domain/familyTips.js";
import { grade1 } from "../grade1.js";
import { grade2 } from "../grade2.js";
import { grade3 } from "../grade3.js";
import { grade4 } from "../grade4.js";
import { grade5 } from "../grade5.js";
import { grade6 } from "../grade6.js";

describe("FAMILY_TIPS", () => {
  it("cada contenido del banco (1° a 6°) tiene su sugerencia para la familia en español e inglés", () => {
    const ids = new Proxy({}, { get: (_t, code) => String(code) }) as Record<string, string>;
    const skills = [grade1, grade2, grade3, grade4, grade5, grade6].flatMap((g) => g(ids).map((b) => b.skill));
    expect(skills.length).toBeGreaterThan(40);
    for (const s of skills) {
      const tip = familyTipFor(s.grade, s.name);
      expect(tip, `${s.grade}° ${s.name}`).not.toBeNull();
      expect(tip!.es.length).toBeGreaterThan(40);
      expect(tip!.en.length).toBeGreaterThan(40);
    }
    expect(Object.keys(FAMILY_TIPS)).toHaveLength(skills.length);
  });
});
