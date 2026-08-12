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
        promptEn: "How much is 6 + 7?",
        procedureNote: "Conteo hacia adelante desde 6, avanzando 7 posiciones.",
        procedureNoteEn: "Count forward from 6, seven steps.",
        difficultyLevel: 1,
        visual: { kind: "combine", a: 6, b: 7, emoji: "🔵" },
        options: [
          { label: "13", isCorrect: true },
          { label: "1", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "12", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "14", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 20 − 20?",
        promptEn: "How much is 20 − 20?",
        procedureNote: "Restar una cantidad de sí misma siempre da 0.",
        procedureNoteEn: "Subtracting a number from itself always gives 0.",
        difficultyLevel: 1,
        visual: { kind: "takeaway", total: 20, removed: 20, emoji: "🔵" },
        options: [
          { label: "0", isCorrect: true },
          { label: "20", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "1", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "40", isCorrect: false },
        ],
      },
      {
        prompt: "¿Cuánto es 8 + 5?",
        promptEn: "How much is 8 + 5?",
        procedureNote: "Conteo hacia adelante desde 8, avanzando 5 posiciones: 9, 10, 11, 12, 13.",
        procedureNoteEn: "Count forward from 8, five steps: 9, 10, 11, 12, 13.",
        difficultyLevel: 2,
        visual: { kind: "combine", a: 8, b: 5, emoji: "🔵" },
        options: [
          { label: "13", isCorrect: true },
          { label: "3", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "12", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "18", isCorrect: false },
        ],
      },
      {
        prompt: "Tienes 14 manzanas y regalas 6. ¿Cuántas te quedan?",
        promptEn: "You have 14 apples and give away 6. How many do you have left?",
        procedureNote: "Resta: parte de 14 y quita 6 → 14 − 6 = 8.",
        procedureNoteEn: "Subtraction: start from 14 and take away 6 → 14 − 6 = 8.",
        difficultyLevel: 2,
        visual: { kind: "takeaway", total: 14, removed: 6, emoji: "🍎" },
        options: [
          { label: "8", isCorrect: true },
          { label: "20", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "6", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
          { label: "9", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 9 + 9?",
        promptEn: "How much is 9 + 9?",
        procedureNote: "Duplicar 9: 9 + 9 = 18.",
        procedureNoteEn: "Double 9: 9 + 9 = 18.",
        difficultyLevel: 2,
        visual: { kind: "combine", a: 9, b: 9, emoji: "🔵" },
        options: [
          { label: "18", isCorrect: true },
          { label: "0", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "17", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "19", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tenías 20 lápices y perdiste 15. ¿Cuántos te quedan?",
        promptEn: "You had 20 pencils and lost 15. How many do you have left?",
        procedureNote: "Resta: 20 − 15 = 5.",
        procedureNoteEn: "Subtraction: 20 − 15 = 5.",
        difficultyLevel: 3,
        visual: { kind: "takeaway", total: 20, removed: 15, emoji: "✏️" },
        options: [
          { label: "5", isCorrect: true },
          { label: "35", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "4", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "15", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
        ],
      },
      // === Refuerzo de profundidad (nivel 1) — mismo eje, más variedad ===
      {
        prompt: "¿Cuánto es 3 + 4?",
        promptEn: "How much is 3 + 4?",
        procedureNote: "Conteo hacia adelante desde 3, avanzando 4 posiciones.",
        procedureNoteEn: "Count forward from 3, four steps.",
        difficultyLevel: 1,
        visual: { kind: "combine", a: 3, b: 4, emoji: "🔵" },
        options: [
          { label: "7", isCorrect: true },
          { label: "1", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "6", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "8", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 9 − 3?",
        promptEn: "How much is 9 − 3?",
        procedureNote: "Resta: cuenta hacia atrás desde 9, tres veces.",
        procedureNoteEn: "Subtraction: count back from 9, three times.",
        difficultyLevel: 1,
        visual: { kind: "takeaway", total: 9, removed: 3, emoji: "🔵" },
        options: [
          { label: "6", isCorrect: true },
          { label: "12", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "5", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "7", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 5 + 5?",
        promptEn: "How much is 5 + 5?",
        procedureNote: "Duplicar 5: 5 + 5 = 10.",
        procedureNoteEn: "Double 5: 5 + 5 = 10.",
        difficultyLevel: 1,
        visual: { kind: "combine", a: 5, b: 5, emoji: "🔵" },
        options: [
          { label: "10", isCorrect: true },
          { label: "0", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "9", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "11", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tienes 6 globos y se te vuelan 2. ¿Cuántos te quedan?",
        promptEn: "You have 6 balloons and 2 fly away. How many do you have left?",
        procedureNote: "Resta: parte de 6 y quita 2 → 6 − 2 = 4.",
        procedureNoteEn: "Subtraction: start from 6 and take away 2 → 6 − 2 = 4.",
        difficultyLevel: 1,
        visual: { kind: "takeaway", total: 6, removed: 2, emoji: "🎈" },
        options: [
          { label: "4", isCorrect: true },
          { label: "8", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "2", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
          { label: "5", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 10 − 4?",
        promptEn: "How much is 10 − 4?",
        procedureNote: "Resta: cuenta hacia atrás desde 10, cuatro veces.",
        procedureNoteEn: "Subtraction: count back from 10, four times.",
        difficultyLevel: 1,
        visual: { kind: "takeaway", total: 10, removed: 4, emoji: "🔵" },
        options: [
          { label: "6", isCorrect: true },
          { label: "14", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "5", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "7", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 2 + 6?",
        promptEn: "How much is 2 + 6?",
        procedureNote: "Conteo hacia adelante desde 6, avanzando 2 posiciones.",
        procedureNoteEn: "Count forward from 6, two steps.",
        difficultyLevel: 1,
        visual: { kind: "combine", a: 2, b: 6, emoji: "🔵" },
        options: [
          { label: "8", isCorrect: true },
          { label: "4", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "7", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "9", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      // === Refuerzo de profundidad (nivel 2) ===
      {
        prompt: "¿Cuánto es 7 + 6?",
        promptEn: "How much is 7 + 6?",
        procedureNote: "Conteo hacia adelante desde 7, avanzando 6 posiciones: 8, 9, 10, 11, 12, 13.",
        procedureNoteEn: "Count forward from 7, six steps: 8, 9, 10, 11, 12, 13.",
        difficultyLevel: 2,
        visual: { kind: "combine", a: 7, b: 6, emoji: "🔵" },
        options: [
          { label: "13", isCorrect: true },
          { label: "1", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "12", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "14", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tienes 15 galletas y comes 7. ¿Cuántas te quedan?",
        promptEn: "You have 15 cookies and eat 7. How many do you have left?",
        procedureNote: "Resta: parte de 15 y quita 7 → 15 − 7 = 8.",
        procedureNoteEn: "Subtraction: start from 15 and take away 7 → 15 − 7 = 8.",
        difficultyLevel: 2,
        visual: { kind: "takeaway", total: 15, removed: 7, emoji: "🍪" },
        options: [
          { label: "8", isCorrect: true },
          { label: "22", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "7", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
          { label: "9", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 12 − 5?",
        promptEn: "How much is 12 − 5?",
        procedureNote: "Resta: parte de 12 y quita 5 → 12 − 5 = 7.",
        procedureNoteEn: "Subtraction: start from 12 and take away 5 → 12 − 5 = 7.",
        difficultyLevel: 2,
        visual: { kind: "takeaway", total: 12, removed: 5, emoji: "🔵" },
        options: [
          { label: "7", isCorrect: true },
          { label: "17", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "6", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "8", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 6 + 8?",
        promptEn: "How much is 6 + 8?",
        procedureNote: "Conteo hacia adelante desde 8, avanzando 6 posiciones.",
        procedureNoteEn: "Count forward from 8, six steps.",
        difficultyLevel: 2,
        visual: { kind: "combine", a: 6, b: 8, emoji: "🔵" },
        options: [
          { label: "14", isCorrect: true },
          { label: "2", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "13", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "15", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tenías 16 stickers y le diste 9 a tu amigo. ¿Cuántos te quedan?",
        promptEn: "You had 16 stickers and gave 9 to your friend. How many do you have left?",
        procedureNote: "Resta: parte de 16 y quita 9 → 16 − 9 = 7.",
        procedureNoteEn: "Subtraction: start from 16 and take away 9 → 16 − 9 = 7.",
        difficultyLevel: 2,
        visual: { kind: "takeaway", total: 16, removed: 9, emoji: "🌟" },
        options: [
          { label: "7", isCorrect: true },
          { label: "25", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "9", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
          { label: "8", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 9 + 4?",
        promptEn: "How much is 9 + 4?",
        procedureNote: "Conteo hacia adelante desde 9, avanzando 4 posiciones.",
        procedureNoteEn: "Count forward from 9, four steps.",
        difficultyLevel: 2,
        visual: { kind: "combine", a: 9, b: 4, emoji: "🔵" },
        options: [
          { label: "13", isCorrect: true },
          { label: "5", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "12", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "14", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      // === Refuerzo de profundidad (nivel 3) ===
      {
        prompt: "¿Cuánto es 20 − 8?",
        promptEn: "How much is 20 − 8?",
        procedureNote: "Resta: parte de 20 y quita 8 → 20 − 8 = 12.",
        procedureNoteEn: "Subtraction: start from 20 and take away 8 → 20 − 8 = 12.",
        difficultyLevel: 3,
        visual: { kind: "takeaway", total: 20, removed: 8, emoji: "🔵" },
        options: [
          { label: "12", isCorrect: true },
          { label: "28", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "11", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "13", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tienes 18 canicas y regalas 11. ¿Cuántas te quedan?",
        promptEn: "You have 18 marbles and give away 11. How many do you have left?",
        procedureNote: "Resta: parte de 18 y quita 11 → 18 − 11 = 7.",
        procedureNoteEn: "Subtraction: start from 18 and take away 11 → 18 − 11 = 7.",
        difficultyLevel: 3,
        visual: { kind: "takeaway", total: 18, removed: 11, emoji: "🔴" },
        options: [
          { label: "7", isCorrect: true },
          { label: "29", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "11", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
          { label: "8", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 8 + 9?",
        promptEn: "How much is 8 + 9?",
        procedureNote: "Conteo hacia adelante desde 9, avanzando 8 posiciones.",
        procedureNoteEn: "Count forward from 9, eight steps.",
        difficultyLevel: 3,
        visual: { kind: "combine", a: 8, b: 9, emoji: "🔵" },
        options: [
          { label: "17", isCorrect: true },
          { label: "1", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "16", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "18", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 19 − 12?",
        promptEn: "How much is 19 − 12?",
        procedureNote: "Resta: parte de 19 y quita 12 → 19 − 12 = 7.",
        procedureNoteEn: "Subtraction: start from 19 and take away 12 → 19 − 12 = 7.",
        difficultyLevel: 3,
        visual: { kind: "takeaway", total: 19, removed: 12, emoji: "🔵" },
        options: [
          { label: "7", isCorrect: true },
          { label: "31", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "6", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "8", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tenías 20 monedas y gastaste 14. ¿Cuántas te quedan?",
        promptEn: "You had 20 coins and spent 14. How many do you have left?",
        procedureNote: "Resta: parte de 20 y quita 14 → 20 − 14 = 6.",
        procedureNoteEn: "Subtraction: start from 20 and take away 14 → 20 − 14 = 6.",
        difficultyLevel: 3,
        visual: { kind: "takeaway", total: 20, removed: 14, emoji: "🪙" },
        options: [
          { label: "6", isCorrect: true },
          { label: "34", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "14", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
          { label: "7", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 7 + 9?",
        promptEn: "How much is 7 + 9?",
        procedureNote: "Conteo hacia adelante desde 9, avanzando 7 posiciones.",
        procedureNoteEn: "Count forward from 9, seven steps.",
        difficultyLevel: 3,
        visual: { kind: "combine", a: 7, b: 9, emoji: "🔵" },
        options: [
          { label: "16", isCorrect: true },
          { label: "2", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "15", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "17", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
    ];

    let created = 0;
    let updated = 0;
    for (const ex of exercises) {
      const exists = await prisma.exercise.findFirst({
        where: { mathSkillId: skill.id, prompt: ex.prompt },
      });

      if (exists) {
        // No se tocan las opciones (Attempt ya puede referenciarlas) — solo
        // se actualizan campos de contenido, útil para backfillear `visual`
        // en ejercicios sembrados antes de que existiera este campo.
        await prisma.exercise.update({
          where: { id: exists.id },
          data: {
            procedureNote: ex.procedureNote,
            procedureNoteEn: ex.procedureNoteEn,
            promptEn: ex.promptEn,
            difficultyLevel: ex.difficultyLevel,
            visual: ex.visual,
          },
        });
        updated += 1;
        continue;
      }

      await prisma.exercise.create({
        data: {
          mathSkillId: skill.id,
          prompt: ex.prompt,
          promptEn: ex.promptEn,
          procedureNote: ex.procedureNote,
          procedureNoteEn: ex.procedureNoteEn,
          difficultyLevel: ex.difficultyLevel,
          visual: ex.visual,
          options: { create: ex.options },
        },
      });
      created += 1;
    }

    console.log(`OK: ${created} ejercicio(s) nuevo(s), ${updated} actualizado(s).`);
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
