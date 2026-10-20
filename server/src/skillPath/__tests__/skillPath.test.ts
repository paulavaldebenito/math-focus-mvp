import { describe, expect, it } from "vitest";
import { computeSkillPath, SKILL_COMPLETE_THRESHOLD } from "../skillPath.js";

function skill(id: string, order: number, name = id) {
  return { id, grade: 4, axis: "Números y operaciones", name, axisEn: null, nameEn: null, oaCode: null, order };
}

describe("computeSkillPath", () => {
  it("la primera habilidad del curso siempre es alcanzable, aunque no tenga aciertos", () => {
    const [first] = computeSkillPath([skill("a", 0)], {});
    expect(first!.status).toBe("available");
  });

  it("una habilidad se completa al llegar al umbral de aciertos, y desbloquea la siguiente", () => {
    const skills = [skill("a", 0), skill("b", 1)];
    const path = computeSkillPath(skills, { a: SKILL_COMPLETE_THRESHOLD });
    expect(path[0]!.status).toBe("completed");
    expect(path[1]!.status).toBe("available");
  });

  it("un acierto menos que el umbral no completa la habilidad, y la siguiente queda bloqueada", () => {
    const skills = [skill("a", 0), skill("b", 1)];
    const path = computeSkillPath(skills, { a: SKILL_COMPLETE_THRESHOLD - 1 });
    expect(path[0]!.status).toBe("available");
    expect(path[1]!.status).toBe("locked");
  });

  it("un acierto histórico de sobra (de antes de esta funcionalidad, o fuera de orden) siempre cuenta como completada, y desbloquea la siguiente — nunca se pierde progreso real", () => {
    // b tiene aciertos de sobra aunque a (anterior) no esté completa todavía.
    const skills = [skill("a", 0), skill("b", 1), skill("c", 2)];
    const path = computeSkillPath(skills, { b: 999 });
    expect(path[0]!.status).toBe("available"); // a: sin aciertos, primera
    expect(path[1]!.status).toBe("completed"); // b: mérito real, se reconoce igual
    expect(path[2]!.status).toBe("available"); // c: se desbloquea porque b está completa
  });

  it("respeta el orden dado aunque el arreglo de entrada venga desordenado", () => {
    const skills = [skill("b", 1), skill("a", 0)];
    const path = computeSkillPath(skills, {});
    expect(path.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("una lista vacía no lanza y devuelve una lista vacía", () => {
    expect(computeSkillPath([], {})).toEqual([]);
  });

  it("conserva grade/axis/name/oaCode/order y agrega correctCount", () => {
    const [node] = computeSkillPath([skill("a", 0, "Sumas")], { a: 3 });
    expect(node).toMatchObject({
      id: "a",
      grade: 4,
      axis: "Números y operaciones",
      name: "Sumas",
      oaCode: null,
      order: 0,
      correctCount: 3,
      status: "available",
    });
  });

  it("conserva la traducción al inglés (axisEn/nameEn) cuando la habilidad la tiene", () => {
    const withEnglish = { ...skill("a", 0, "Sumas"), axisEn: "Numbers and operations", nameEn: "Addition" };
    const [node] = computeSkillPath([withEnglish], {});
    expect(node).toMatchObject({ axisEn: "Numbers and operations", nameEn: "Addition" });
  });
});
