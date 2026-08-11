import { describe, expect, it } from "vitest";
import { prisma } from "../prisma.js";

// Verifica que el banco de ejercicios sembrado cumple la regla del proyecto:
// cada ejercicio debe tener respuesta correcta, procedimiento, habilidad
// asociada y (cuando corresponde) tipo de error por alternativa incorrecta.

describe("Banco de ejercicios sembrado (T1.2)", () => {
  it("cada ejercicio tiene exactamente una alternativa correcta y un procedimiento documentado", async () => {
    const exercises = await prisma.exercise.findMany({
      include: { options: true, mathSkill: true },
    });

    expect(exercises.length).toBeGreaterThan(0);

    for (const ex of exercises) {
      expect(ex.isFictitious).toBe(true);
      expect(ex.procedureNote.length).toBeGreaterThan(0);
      expect(ex.mathSkill.grade).toBe(1);
      const correctOptions = ex.options.filter((o) => o.isCorrect);
      expect(correctOptions).toHaveLength(1);
    }
  });

  it("ningún Objetivo de Aprendizaje está codificado sin validar (oaCode debe quedar nulo)", async () => {
    const skills = await prisma.mathSkill.findMany();
    for (const skill of skills) {
      expect(skill.oaCode).toBeNull();
    }
  });

  it("al menos una alternativa incorrecta por ejercicio está clasificada con un tipo de error observable", async () => {
    const exercises = await prisma.exercise.findMany({ include: { options: true } });
    for (const ex of exercises) {
      const classified = ex.options.filter((o) => !o.isCorrect && o.errorTypeId !== null);
      expect(classified.length).toBeGreaterThan(0);
    }
  });

  it("el seed es idempotente: correr db seed dos veces no duplica la habilidad sembrada", async () => {
    const before = await prisma.mathSkill.count({
      where: { grade: 1, axis: "Números y operaciones", name: "Adición y sustracción dentro de 20" },
    });
    expect(before).toBe(1);
  });
});
