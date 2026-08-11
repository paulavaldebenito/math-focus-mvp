import "dotenv/config";
import { prisma } from "../src/db/prisma.js";

// Catálogo fijo de patrones de error OBSERVABLES — nunca un diagnóstico.
const ERROR_TYPES = [
  { code: "conceptual", label: "Error conceptual", description: "No comprende la idea matemática detrás del ejercicio (ej. confunde la operación)." },
  { code: "procedimiento", label: "Error de procedimiento", description: "Entiende la idea, pero se equivoca en el procedimiento para resolverla." },
  { code: "calculo", label: "Error de cálculo", description: "El procedimiento es correcto, pero hay un error aritmético puntual." },
  { code: "comprension_enunciado", label: "Error de comprensión del enunciado", description: "No interpreta correctamente qué pide la pregunta." },
  { code: "omision", label: "Omisión de información", description: "No usa un dato relevante del enunciado." },
  { code: "respuesta_rapida", label: "Respuesta excesivamente rápida", description: "Patrón observable de tiempo de respuesta muy corto — sin interpretación clínica." },
  { code: "abandono", label: "Abandono de la actividad", description: "El estudiante no completa el ejercicio o la sesión." },
  { code: "solicitud_ayuda_repetida", label: "Solicitud repetida de ayuda", description: "Pide pistas de forma reiterada en ejercicios similares." },
] as const;

async function main() {
  for (const et of ERROR_TYPES) {
    await prisma.errorType.upsert({
      where: { code: et.code },
      update: { label: et.label, description: et.description },
      create: et,
    });
  }
  console.log(`OK: ${ERROR_TYPES.length} tipos de error sembrados/actualizados.`);

  const errorTypeByCode = Object.fromEntries(
    (await prisma.errorType.findMany()).map((e) => [e.code, e.id]),
  );

  let skill = await prisma.mathSkill.findFirst({
    where: { grade: 1, axis: "Números y operaciones", name: "Adición y sustracción dentro de 20" },
  });

  if (skill) {
    console.log("OK: la habilidad de siembra ya existía, no se duplica.");
  } else {
    skill = await prisma.mathSkill.create({
      data: {
        grade: 1,
        axis: "Números y operaciones",
        name: "Adición y sustracción dentro de 20",
        // oaCode: pendiente de validación curricular — no se inventa.
      },
    });
    console.log("OK: habilidad de siembra creada.");
  }

  {
    // Todos los ejercicios de este seed son FICTICIOS (isFictitious: true por
    // defecto) — sirven para probar el modelo de datos y el flujo completo,
    // no son contenido curricular aprobado. difficultyLevel 1-3 permite que
    // el motor adaptativo (T4) pida un ejercicio más fácil o más difícil.
    // Idempotente por ejercicio (no por habilidad): así, si se agregan
    // ejercicios nuevos a este arreglo, se siembran aunque la habilidad ya
    // existiera de una corrida anterior.
    const exercises = [
      {
        prompt: "¿Cuánto es 6 + 7?",
        procedureNote: "Conteo hacia adelante desde 6, avanzando 7 posiciones.",
        difficultyLevel: 1,
        options: [
          { label: "13", isCorrect: true },
          { label: "1", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "12", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "14", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 20 − 20?",
        procedureNote: "Restar una cantidad de sí misma siempre da 0.",
        difficultyLevel: 1,
        options: [
          { label: "0", isCorrect: true },
          { label: "20", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "1", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "40", isCorrect: false },
        ],
      },
      {
        prompt: "¿Cuánto es 8 + 5?",
        procedureNote: "Conteo hacia adelante desde 8, avanzando 5 posiciones: 9, 10, 11, 12, 13.",
        difficultyLevel: 2,
        options: [
          { label: "13", isCorrect: true },
          { label: "3", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "12", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "18", isCorrect: false },
        ],
      },
      {
        prompt: "Tienes 14 manzanas y regalas 6. ¿Cuántas te quedan?",
        procedureNote: "Resta: parte de 14 y quita 6 → 14 − 6 = 8.",
        difficultyLevel: 2,
        options: [
          { label: "8", isCorrect: true },
          { label: "20", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "6", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
          { label: "9", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 9 + 9?",
        procedureNote: "Duplicar 9: 9 + 9 = 18.",
        difficultyLevel: 2,
        options: [
          { label: "18", isCorrect: true },
          { label: "0", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "17", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "19", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tenías 20 lápices y perdiste 15. ¿Cuántos te quedan?",
        procedureNote: "Resta: 20 − 15 = 5.",
        difficultyLevel: 3,
        options: [
          { label: "5", isCorrect: true },
          { label: "35", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "4", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "15", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
        ],
      },
    ];

    let created = 0;
    for (const ex of exercises) {
      const exists = await prisma.exercise.findFirst({
        where: { mathSkillId: skill.id, prompt: ex.prompt },
      });
      if (exists) continue;

      await prisma.exercise.create({
        data: {
          mathSkillId: skill.id,
          prompt: ex.prompt,
          procedureNote: ex.procedureNote,
          difficultyLevel: ex.difficultyLevel,
          options: { create: ex.options },
        },
      });
      created += 1;
    }

    console.log(`OK: ${created} ejercicio(s) ficticio(s) nuevo(s) sembrados (${exercises.length - created} ya existían).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
