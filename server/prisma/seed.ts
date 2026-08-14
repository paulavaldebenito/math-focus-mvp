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

interface SeedExercise {
  prompt: string;
  promptEn: string;
  procedureNote: string;
  procedureNoteEn: string;
  difficultyLevel: number;
  visual: unknown;
  options: Array<{ label: string; isCorrect: boolean; errorTypeId?: string }>;
}

interface SeedSkill {
  grade: number;
  axis: string;
  name: string;
  oaCode?: string;
}

// Todos los ejercicios de este seed son FICTICIOS (isFictitious: true por
// defecto) — sirven para probar el modelo de datos y el flujo completo, no
// son contenido curricular aprobado (salvo el oaCode, verificado aparte
// contra la fuente oficial cuando está presente). difficultyLevel 1-3
// permite que el motor adaptativo pida un ejercicio más fácil o más
// difícil. Idempotente por ejercicio (no por habilidad): si se agregan
// ejercicios nuevos al arreglo de una habilidad ya sembrada, igual se crean.
async function seedSkill(skillData: SeedSkill, exercises: SeedExercise[]) {
  let skill = await prisma.mathSkill.findFirst({
    where: { grade: skillData.grade, axis: skillData.axis, name: skillData.name },
  });

  if (skill) {
    // Actualiza campos de contenido (ej. oaCode, cuando se verifica después
    // de haber sembrado la habilidad) sin tocar el id ni sus relaciones.
    skill = await prisma.mathSkill.update({ where: { id: skill.id }, data: skillData });
    console.log(`OK: habilidad "${skillData.name}" ya existía, actualizada.`);
  } else {
    skill = await prisma.mathSkill.create({ data: skillData });
    console.log(`OK: habilidad "${skillData.name}" creada.`);
  }

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
          visual: ex.visual as never,
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
        visual: ex.visual as never,
        options: { create: ex.options },
      },
    });
    created += 1;
  }

  console.log(`OK: ${created} ejercicio(s) nuevo(s), ${updated} actualizado(s) para "${skillData.name}".`);
}

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

  await seedSkill(
    {
      grade: 1,
      axis: "Números y operaciones",
      name: "Adición y sustracción dentro de 20",
      // Verificado contra curriculumnacional.mineduc.cl el 2026-08-14 (ver
      // specs/003-fase2-preparacion-pedagogica/curriculo-1basico.md).
      oaCode: "MA01 OA09",
    },
    [
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
        procedureNote: "Cuando restas un número de sí mismo, siempre da 0 — fíjate si los dos números son iguales.",
        procedureNoteEn: "When you subtract a number from itself, it's always 0 — check if both numbers are equal.",
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
        procedureNote: "Regalar es quitar. Piensa: ¿qué número le sumas a 6 para llegar a 14?",
        procedureNoteEn: "Giving away means taking away. Think: what number do you add to 6 to reach 14?",
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
        procedureNote: "Los dos números son iguales — es un doble. Piensa en el doble de 9.",
        procedureNoteEn: "Both numbers are the same — it's a double. Think about double 9.",
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
        procedureNote: "Perder es quitar. Piensa: ¿qué número le sumas a 15 para llegar a 20?",
        procedureNoteEn: "Losing means taking away. Think: what number do you add to 15 to reach 20?",
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
        procedureNote: "Los dos números son iguales — es un doble. Piensa en el doble de 5.",
        procedureNoteEn: "Both numbers are the same — it's a double. Think about double 5.",
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
        procedureNote: "Volarse es quitar. Cuenta hacia atrás desde 6, dos veces.",
        procedureNoteEn: "Flying away means taking away. Count back from 6, two times.",
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
        procedureNote: "Comer es quitar. Piensa: ¿qué número le sumas a 7 para llegar a 15?",
        procedureNoteEn: "Eating means taking away. Think: what number do you add to 7 to reach 15?",
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
        procedureNote: "Piensa: ¿qué número le sumas a 5 para llegar a 12?",
        procedureNoteEn: "Think: what number do you add to 5 to reach 12?",
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
        procedureNote: "Dar es quitar. Piensa: ¿qué número le sumas a 9 para llegar a 16?",
        procedureNoteEn: "Giving means taking away. Think: what number do you add to 9 to reach 16?",
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
        procedureNote: "Piensa: ¿qué número le sumas a 8 para llegar a 20?",
        procedureNoteEn: "Think: what number do you add to 8 to reach 20?",
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
        procedureNote: "Regalar es quitar. Piensa: ¿qué número le sumas a 11 para llegar a 18?",
        procedureNoteEn: "Giving away means taking away. Think: what number do you add to 11 to reach 18?",
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
        procedureNote: "Piensa: ¿qué número le sumas a 12 para llegar a 19?",
        procedureNoteEn: "Think: what number do you add to 12 to reach 19?",
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
        procedureNote: "Gastar es quitar. Piensa: ¿qué número le sumas a 14 para llegar a 20?",
        procedureNoteEn: "Spending means taking away. Think: what number do you add to 14 to reach 20?",
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
    ],
  );

  // === 2° básico — MA02 OA09, verificado contra curriculumnacional.mineduc.cl
  // el 2026-08-14 (ver specs/003-fase2-preparacion-pedagogica/actividades-oa09-2basico.md).
  // OA09 es explícito en que el algoritmo es SIN reserva/canje — todos los
  // pares de este bloque están elegidos para que cada columna (unidades,
  // decenas) se sume o reste sin necesidad de reagrupar.
  await seedSkill(
    {
      grade: 2,
      axis: "Números y operaciones",
      name: "Adición y sustracción dentro de 100",
      oaCode: "MA02 OA09",
    },
    [
      {
        prompt: "¿Cuánto es 12 + 15?",
        promptEn: "How much is 12 + 15?",
        procedureNote: "Suma las decenas (10 y 10) y las unidades (2 y 5) por separado, y junta los dos resultados.",
        procedureNoteEn: "Add the tens (10 and 10) and the units (2 and 5) separately, then add the two results together.",
        difficultyLevel: 1,
        visual: null,
        options: [
          { label: "27", isCorrect: true },
          { label: "3", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "28", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 24 + 13?",
        promptEn: "How much is 24 + 13?",
        procedureNote: "Suma las decenas (20 y 10) y las unidades (4 y 3) por separado, y junta los dos resultados.",
        procedureNoteEn: "Add the tens (20 and 10) and the units (4 and 3) separately, then add the two results together.",
        difficultyLevel: 1,
        visual: null,
        options: [
          { label: "37", isCorrect: true },
          { label: "11", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "38", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 35 − 12?",
        promptEn: "How much is 35 − 12?",
        procedureNote: "Resta las decenas (30 y 10) y las unidades (5 y 2) por separado, y junta los dos resultados.",
        procedureNoteEn: "Subtract the tens (30 and 10) and the units (5 and 2) separately, then add the two results together.",
        difficultyLevel: 1,
        visual: null,
        options: [
          { label: "23", isCorrect: true },
          { label: "47", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "22", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 47 − 15?",
        promptEn: "How much is 47 − 15?",
        procedureNote: "Resta las decenas (40 y 10) y las unidades (7 y 5) por separado, y junta los dos resultados.",
        procedureNoteEn: "Subtract the tens (40 and 10) and the units (7 and 5) separately, then add the two results together.",
        difficultyLevel: 1,
        visual: null,
        options: [
          { label: "32", isCorrect: true },
          { label: "62", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "31", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 23 + 15?",
        promptEn: "How much is 23 + 15?",
        procedureNote: "Suma las decenas (20 y 10) y las unidades (3 y 5) por separado, y junta los dos resultados.",
        procedureNoteEn: "Add the tens (20 and 10) and the units (3 and 5) separately, then add the two results together.",
        difficultyLevel: 2,
        visual: null,
        options: [
          { label: "38", isCorrect: true },
          { label: "8", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "39", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 34 + 25?",
        promptEn: "How much is 34 + 25?",
        procedureNote: "Suma las decenas (30 y 20) y las unidades (4 y 5) por separado, y junta los dos resultados.",
        procedureNoteEn: "Add the tens (30 and 20) and the units (4 and 5) separately, then add the two results together.",
        difficultyLevel: 2,
        visual: null,
        options: [
          { label: "59", isCorrect: true },
          { label: "9", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "58", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 68 − 24?",
        promptEn: "How much is 68 − 24?",
        procedureNote: "Resta las decenas (60 y 20) y las unidades (8 y 4) por separado, y junta los dos resultados.",
        procedureNoteEn: "Subtract the tens (60 and 20) and the units (8 and 4) separately, then add the two results together.",
        difficultyLevel: 2,
        visual: null,
        options: [
          { label: "44", isCorrect: true },
          { label: "92", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "43", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 56 − 23?",
        promptEn: "How much is 56 − 23?",
        procedureNote: "Resta las decenas (50 y 20) y las unidades (6 y 3) por separado, y junta los dos resultados.",
        procedureNoteEn: "Subtract the tens (50 and 20) and the units (6 and 3) separately, then add the two results together.",
        difficultyLevel: 2,
        visual: null,
        options: [
          { label: "33", isCorrect: true },
          { label: "79", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "32", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "Tenías 45 stickers y un amigo te regaló 20 más. ¿Cuántos tienes ahora?",
        promptEn: "You had 45 stickers and a friend gave you 20 more. How many do you have now?",
        procedureNote: "Regalar más es juntar. Suma las decenas (40 y 20) y las unidades (5 y 0) por separado, y junta los dos resultados.",
        procedureNoteEn: "Getting more means joining. Add the tens (40 and 20) and the units (5 and 0) separately, then add the two results together.",
        difficultyLevel: 3,
        visual: null,
        options: [
          { label: "65", isCorrect: true },
          { label: "25", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "64", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "20", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
        ],
      },
      {
        prompt: "Había 76 personas en el bus y bajaron 32. ¿Cuántas personas quedan?",
        promptEn: "There were 76 people on the bus and 32 got off. How many people are left?",
        procedureNote: "Bajarse es quitar. Resta las decenas (70 y 30) y las unidades (6 y 2) por separado, y junta los dos resultados.",
        procedureNoteEn: "Getting off means taking away. Subtract the tens (70 and 30) and the units (6 and 2) separately, then add the two results together.",
        difficultyLevel: 3,
        visual: null,
        options: [
          { label: "44", isCorrect: true },
          { label: "108", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "43", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
          { label: "32", isCorrect: false, errorTypeId: errorTypeByCode.comprension_enunciado },
        ],
      },
      {
        prompt: "¿Cuánto es 63 + 26?",
        promptEn: "How much is 63 + 26?",
        procedureNote: "Suma las decenas (60 y 20) y las unidades (3 y 6) por separado, y junta los dos resultados.",
        procedureNoteEn: "Add the tens (60 and 20) and the units (3 and 6) separately, then add the two results together.",
        difficultyLevel: 3,
        visual: null,
        options: [
          { label: "89", isCorrect: true },
          { label: "37", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "88", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
      {
        prompt: "¿Cuánto es 88 − 45?",
        promptEn: "How much is 88 − 45?",
        procedureNote: "Resta las decenas (80 y 40) y las unidades (8 y 5) por separado, y junta los dos resultados.",
        procedureNoteEn: "Subtract the tens (80 and 40) and the units (8 and 5) separately, then add the two results together.",
        difficultyLevel: 3,
        visual: null,
        options: [
          { label: "43", isCorrect: true },
          { label: "133", isCorrect: false, errorTypeId: errorTypeByCode.conceptual },
          { label: "42", isCorrect: false, errorTypeId: errorTypeByCode.calculo },
        ],
      },
    ],
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
