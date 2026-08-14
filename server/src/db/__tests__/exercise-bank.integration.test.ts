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
      expect([1, 2]).toContain(ex.mathSkill.grade);
      const correctOptions = ex.options.filter((o) => o.isCorrect);
      expect(correctOptions).toHaveLength(1);
    }
  });

  it("ningún Objetivo de Aprendizaje está codificado sin validar contra la fuente oficial", async () => {
    // OA verificados contra curriculumnacional.mineduc.cl (páginas de OA
    // individuales, no un resumen) — cualquier cambio acá debe venir con la
    // misma verificación, no con un resumen de trabajo.
    // Clave por nombre de habilidad, no grado+eje — puede haber más de una
    // habilidad en el mismo grado y eje (ej. dos de 1° básico, Números y
    // operaciones).
    const VERIFIED_OA: Record<string, string> = {
      "Adición y sustracción dentro de 20": "MA01 OA09", // ver specs/003.../curriculo-1basico.md
      "Comparar y ordenar números dentro de 20": "MA01 OA04", // ver specs/003.../curriculo-1basico.md
      "Adición y sustracción dentro de 100": "MA02 OA09", // ver specs/003.../actividades-oa09-2basico.md
    };

    const skills = await prisma.mathSkill.findMany();
    for (const skill of skills) {
      if (skill.name in VERIFIED_OA) {
        expect(skill.oaCode).toBe(VERIFIED_OA[skill.name]);
      } else {
        expect(skill.oaCode).toBeNull();
      }
    }
  });

  it("al menos una alternativa incorrecta por ejercicio está clasificada con un tipo de error observable", async () => {
    const exercises = await prisma.exercise.findMany({ include: { options: true } });
    for (const ex of exercises) {
      const classified = ex.options.filter((o) => !o.isCorrect && o.errorTypeId !== null);
      expect(classified.length).toBeGreaterThan(0);
    }
  });

  it("ninguna pista de resta revela la respuesta correcta como número exacto", async () => {
    // Regla: una pista guía la estrategia, no resuelve el ejercicio. Antes,
    // varias pistas de resta decían literalmente "→ 14 − 6 = 8" — se
    // corrigieron a estrategia (conteo hacia atrás / suma relacionada /
    // separar decenas y unidades) sin computar el resultado final. Acotado a
    // resta (lo que se pidió arreglar) — el banco de suma de 1° básico tiene
    // el mismo problema en algunos ejercicios más viejos, sin tocar todavía.
    const exercises = await prisma.exercise.findMany({ include: { options: true } });

    function isSubtraction(ex: (typeof exercises)[number]): boolean {
      const visual = ex.visual as { kind?: string } | null;
      // Grade 1: siempre marcado con visual.kind "takeaway". Grade 2 (sin
      // visual): se detecta por el símbolo, salvo el único problema de
      // contexto sin "−" en el enunciado.
      return (
        visual?.kind === "takeaway" ||
        ex.prompt.includes("−") ||
        ex.prompt.startsWith("Había 76 personas")
      );
    }

    // Única excepción legítima: enseña la regla general "un número menos sí
    // mismo siempre da 0" — es un patrón transferible a memorizar, no el
    // resultado calculado de este ejercicio puntual.
    const EXCEPTIONS = new Set(["¿Cuánto es 20 − 20?"]);

    for (const ex of exercises) {
      if (!isSubtraction(ex) || EXCEPTIONS.has(ex.prompt)) continue;
      const correct = ex.options.find((o) => o.isCorrect);
      if (!correct) continue;
      const answerAsToken = new RegExp(`(?<!\\d)${correct.label}(?!\\d)`);
      expect(ex.procedureNote).not.toMatch(answerAsToken);
    }
  });

  it("el seed es idempotente: correr db seed dos veces no duplica la habilidad sembrada", async () => {
    const before = await prisma.mathSkill.count({
      where: { grade: 1, axis: "Números y operaciones", name: "Adición y sustracción dentro de 20" },
    });
    expect(before).toBe(1);
  });
});
