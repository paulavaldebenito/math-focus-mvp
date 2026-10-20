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
      expect([1, 2, 3, 4, 5, 6]).toContain(ex.mathSkill.grade);
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
      // Ampliación 1°–6° (2026-09-28): cada OA se verificó abriendo su página
      // individual en curriculumnacional.cl (el dominio antiguo
      // curriculumnacional.mineduc.cl redirige ahí). Ver specs/006-expansion-3a6-basico/.
      // 1° básico
      "Contar hasta 100 de 1 en 1, de 2 en 2, de 5 en 5 y de 10 en 10": "MA01 OA01",
      "Componer y descomponer números hasta 20": "MA01 OA06",
      "Patrones repetitivos y numéricos hasta 20": "MA01 OA11",
      "Figuras 3D y 2D del entorno": "MA01 OA14",
      "Comparar la longitud de objetos: largo y corto": "MA01 OA18",
      "Leer e interpretar pictogramas": "MA01 OA20",
      // 2° básico
      "Decenas y unidades en números hasta 100": "MA02 OA07",
      "Multiplicación como suma repetida: tablas del 2, 5 y 10": "MA02 OA11",
      "Patrones numéricos: continuar y completar": "MA02 OA12",
      "Figuras 2D: triángulos, cuadrados, rectángulos y círculos": "MA02 OA15",
      "Horas y medias horas en el reloj digital": "MA02 OA18",
      "Pictogramas con escala y gráficos de barra simple": "MA02 OA22",
      // 3° básico
      "Valor posicional: unidades, decenas y centenas": "MA03 OA05",
      "Adición y sustracción hasta 1.000": "MA03 OA06",
      "Tablas de multiplicar hasta el 10": "MA03 OA08",
      "División como reparto y agrupación": "MA03 OA09",
      "Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4": "MA03 OA11",
      "Patrones numéricos que crecen y decrecen": "MA03 OA12",
      "Figuras 3D, sus caras y sus redes": "MA03 OA15",
      "Perímetro de cuadrados, rectángulos y otras figuras": "MA03 OA21",
      "Pictogramas y gráficos de barra simple": "MA03 OA25",
      // 4° básico
      "Números hasta 10.000: valor posicional, orden y descomposición": "MA04 OA01",
      "Multiplicación de números de tres dígitos por uno": "MA04 OA05",
      "División de dos dígitos por uno, con y sin resto": "MA04 OA06",
      "Fracciones: parte de un todo, comparación y recta numérica": "MA04 OA08",
      "Ecuaciones e inecuaciones de un paso con suma y resta": "MA04 OA14",
      "Simetría: líneas de simetría en figuras 2D": "MA04 OA17",
      "Área de rectángulos y cuadrados": "MA04 OA23",
      "Pictogramas y gráficos de barras con escala": "MA04 OA27",
      // 5° básico
      "Números naturales grandes: valor posicional, comparación y aproximación": "MA05 OA01",
      "División con dividendo de tres cifras y divisor de una cifra": "MA05 OA04",
      "Fracciones propias: equivalencia y comparación": "MA05 OA07",
      "Ecuaciones e inecuaciones de un paso": "MA05 OA15",
      "Plano cartesiano: coordenadas en el primer cuadrante": "MA05 OA16",
      "Perímetro y área de rectángulos": "MA05 OA21",
      "Promedio de un conjunto de datos": "MA05 OA23",
      // 6° básico
      "Razones y proporciones": "MA06 OA03",
      "Porcentajes y su relación con fracciones y decimales": "MA06 OA04",
      "Adición y sustracción de fracciones y números mixtos": "MA06 OA06",
      "Ecuaciones de primer grado con una incógnita": "MA06 OA11",
      "Suma de ángulos interiores de triángulos y cuadriláteros": "MA06 OA17",
      "Volumen de cubos y paralelepípedos": "MA06 OA19",
      "Gráficos de barra doble y circulares": "MA06 OA24",
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
      const escaped = correct.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const answerAsToken = new RegExp(`(?<!\\d)${escaped}(?!\\d)`);
      expect(ex.procedureNote).not.toMatch(answerAsToken);
    }
  });

  it("ningún ejercicio repite etiquetas de opción ni un prompt dentro de su habilidad", async () => {
    const exercises = await prisma.exercise.findMany({ include: { options: true } });
    const promptsBySkill = new Map<string, Set<string>>();
    for (const ex of exercises) {
      const labels = ex.options.map((o) => o.label.trim());
      expect(new Set(labels).size).toBe(labels.length);
      const seen = promptsBySkill.get(ex.mathSkillId) ?? new Set<string>();
      expect(seen.has(ex.prompt)).toBe(false);
      seen.add(ex.prompt);
      promptsBySkill.set(ex.mathSkillId, seen);
    }
  });

  it("cada curso tiene banco suficiente para la evaluación inicial y una sesión (≥ 6 por nivel en 3°-6°)", async () => {
    // La sesión pide 6 ejercicios sin repetir y la evaluación inicial 5 al
    // azar del curso: con menos de 6 por nivel el motor adaptativo cae al
    // respaldo de "cualquier nivel" y la práctica pierde sentido.
    for (const grade of [3, 4, 5, 6]) {
      const exercises = await prisma.exercise.findMany({
        where: { mathSkill: { grade } },
        include: { options: true },
      });
      for (const level of [1, 2, 3]) {
        expect(
          exercises.filter((e) => e.difficultyLevel === level).length,
          `${grade}° nivel ${level}`,
        ).toBeGreaterThanOrEqual(6);
      }
      for (const ex of exercises) {
        expect(ex.options, `${grade}° "${ex.prompt}"`).toHaveLength(4);
      }
    }
  });

  it("el seed es idempotente: correr db seed dos veces no duplica la habilidad sembrada", async () => {
    const before = await prisma.mathSkill.count({
      where: { grade: 1, axis: "Números y operaciones", name: "Adición y sustracción dentro de 20" },
    });
    expect(before).toBe(1);
  });
});
