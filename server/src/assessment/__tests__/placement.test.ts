import { describe, expect, it } from "vitest";
import { computePlacement, reviewSkillIds, verdict, type PlacementAnswer, type PlacementSkill } from "../placement.js";
import { PREREQUISITES } from "../../domain/prerequisites.js";

// Las habilidades de Números y operaciones tal como están en el banco (id = código OA).
const OAS: [string, number, number][] = [
  ["MA01 OA09", 1, 0], ["MA01 OA04", 1, 1], ["MA01 OA01", 1, 2], ["MA01 OA06", 1, 3],
  ["MA02 OA09", 2, 0], ["MA02 OA07", 2, 1], ["MA02 OA11", 2, 2],
  ["MA03 OA05", 3, 0], ["MA03 OA06", 3, 1], ["MA03 OA08", 3, 2], ["MA03 OA09", 3, 3], ["MA03 OA11", 3, 4],
  ["MA04 OA01", 4, 0], ["MA04 OA05", 4, 1], ["MA04 OA06", 4, 2], ["MA04 OA08", 4, 3],
  ["MA05 OA01", 5, 0], ["MA05 OA04", 5, 1], ["MA05 OA07", 5, 2],
  ["MA06 OA03", 6, 0], ["MA06 OA04", 6, 1], ["MA06 OA05", 6, 2], ["MA06 OA06", 6, 3],
];
const SKILLS: PlacementSkill[] = OAS.map(([oa, grade, order]) => ({ id: oa, oaCode: oa, grade, order }));

/** Simula a un niño que domina exactamente `knows`: responde hasta que la evaluación termina. */
function run(grade: number, knows: Set<string>, max?: number) {
  const answers: PlacementAnswer[] = [];
  for (let i = 0; i < 40; i++) {
    const state = computePlacement(grade, SKILLS, PREREQUISITES, answers, max);
    if (state.done) return { state, answers };
    answers.push({ skillId: state.nextSkillId!, isCorrect: knows.has(state.nextSkillId!) });
  }
  throw new Error("la evaluación no terminó");
}

describe("verdict", () => {
  it("una sola respuesta nunca decide", () => {
    expect(verdict([true])).toBeNull();
    expect(verdict([false])).toBeNull();
  });
  it("2 de 2 domina, 0 de 2 reforzar, 1 de 2 pide una tercera", () => {
    expect(verdict([true, true])).toBe("dominada");
    expect(verdict([false, false])).toBe("reforzar");
    expect(verdict([true, false])).toBeNull();
    expect(verdict([true, false, true])).toBe("dominada");
    expect(verdict([false, true, false])).toBe("reforzar");
  });
});

describe("computePlacement", () => {
  it("niño de 5° que no sabe las tablas: baja hasta las tablas y deja el repaso desde ahí", () => {
    // Domina todo lo de 1° y 2° salvo las tablas del 2, 5 y 10; de 3° en adelante solo valor posicional y suma/resta.
    const knows = new Set(["MA01 OA01", "MA01 OA04", "MA01 OA06", "MA01 OA09", "MA02 OA07", "MA02 OA09", "MA03 OA05", "MA03 OA06", "MA04 OA01", "MA05 OA01"]);
    const { state } = run(5, knows);
    expect(state.results["MA05 OA04"]).toBe("reforzar");
    expect(state.results["MA03 OA08"]).toBe("reforzar");
    expect(state.results["MA02 OA11"]).toBe("reforzar");
    expect(state.results["MA05 OA01"]).toBe("dominada");
    // El repaso empieza por la base más baja que falta y sube.
    const review = reviewSkillIds(5, SKILLS, state.results);
    expect(review[0]).toBe("MA02 OA11");
    expect(review).toContain("MA03 OA08");
    expect(review).toContain("MA04 OA06");
    expect(review).not.toContain("MA05 OA04"); // lo de su curso queda en su mapa normal
  });

  it("niño que domina su curso: no baja, y sus bases quedan dominadas por inferencia", () => {
    const all = new Set(SKILLS.map((s) => s.id));
    const { state, answers } = run(5, all);
    expect(answers).toHaveLength(6); // 3 habilidades de 5° × 2 preguntas
    expect(state.results["MA03 OA08"]).toBe("dominada");
    expect(state.evaluated).not.toContain("MA03 OA08");
    expect(reviewSkillIds(5, SKILLS, state.results)).toEqual([]);
  });

  it("nunca pasa del tope de preguntas", () => {
    const { answers, state } = run(6, new Set());
    expect(answers.length).toBeLessThanOrEqual(15);
    expect(state.done).toBe(true);
  });

  it("1° básico: evalúa solo su curso (no hay más abajo)", () => {
    const { state } = run(1, new Set(["MA01 OA01"]));
    expect(Object.keys(state.results).every((id) => id.startsWith("MA01"))).toBe(true);
    expect(state.results["MA01 OA01"]).toBe("dominada");
    expect(reviewSkillIds(1, SKILLS, state.results)).toEqual([]);
  });

  it("es determinista: las mismas respuestas dan el mismo estado", () => {
    const answers: PlacementAnswer[] = [{ skillId: "MA05 OA01", isCorrect: true }, { skillId: "MA05 OA01", isCorrect: false }];
    expect(computePlacement(5, SKILLS, PREREQUISITES, answers)).toEqual(computePlacement(5, SKILLS, PREREQUISITES, answers));
    expect(computePlacement(5, SKILLS, PREREQUISITES, answers).nextSkillId).toBe("MA05 OA01"); // 1 de 2 → tercera
  });

  it("todos los prerrequisitos existen, son del mismo curso o anteriores y no hay ciclos", () => {
    const grade = (oa: string) => Number(oa.slice(2, 4));
    for (const [oa, list] of Object.entries(PREREQUISITES)) {
      for (const p of list) {
        expect(PREREQUISITES).toHaveProperty([p.oa]);
        expect(grade(p.oa)).toBeLessThanOrEqual(grade(oa));
      }
    }
    const visiting = new Set<string>();
    const visit = (oa: string): void => {
      expect(visiting.has(oa)).toBe(false);
      visiting.add(oa);
      for (const p of PREREQUISITES[oa] ?? []) visit(p.oa);
      visiting.delete(oa);
    };
    Object.keys(PREREQUISITES).forEach(visit);
  });
});

describe("bases inferidas con evidencia en contra", () => {
  it("si acierta fracciones (que infiere las tablas) pero falla la división, igual pregunta las tablas", () => {
    const knows = new Set(SKILLS.map((s) => s.id).filter((id) => !["MA05 OA04", "MA04 OA06", "MA03 OA09", "MA03 OA08", "MA02 OA11"].includes(id)));
    const { state, answers } = run(5, knows);
    expect(answers.map((a) => a.skillId)).toContain("MA03 OA08");
    expect(state.results["MA03 OA08"]).toBe("reforzar");
    expect(reviewSkillIds(5, SKILLS, state.results)).toContain("MA03 OA08");
  });
});

describe("habilidades sin ejercicios disponibles", () => {
  it("se saltan sin cortar la evaluación, y desde una que falló se sigue bajando por sus bases", () => {
    const unavailable = new Set(["MA04 OA06"]);
    const answers: PlacementAnswer[] = [];
    const knows = new Set(["MA05 OA01", "MA05 OA07", "MA04 OA05", "MA02 OA11"]);
    let state = computePlacement(5, SKILLS, PREREQUISITES, answers, undefined, unavailable);
    for (let i = 0; i < 40 && !state.done; i++) {
      expect(unavailable.has(state.nextSkillId!)).toBe(false);
      answers.push({ skillId: state.nextSkillId!, isCorrect: knows.has(state.nextSkillId!) });
      state = computePlacement(5, SKILLS, PREREQUISITES, answers, undefined, unavailable);
    }
    expect(state.done).toBe(true);
    expect(state.results["MA04 OA06"]).toBeUndefined();
    // Bajó igual hasta las bases de la división de 4° (reparto y tablas de 3°).
    expect(answers.map((a) => a.skillId)).toContain("MA03 OA09");
  });
});
