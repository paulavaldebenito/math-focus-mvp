import "dotenv/config";
import { prisma } from "../src/db/prisma.js";
import { seedSkill } from "./seed/persist.js";
import { buildBlocks } from "./seed/blocks.js";
import { integrateImageBank } from "./integrar-banco-imagenes.js";

// Catálogo fijo de patrones de error OBSERVABLES — nunca un diagnóstico.
// Códigos y niveles inspirados en el modelo de matefriendly: nivel 1
// conceptual, 2 procedimental, 3 lectura/comprensión del enunciado. Los 3
// patrones de comportamiento (no describen "por qué esta alternativa está
// mal", sino señales de sesión) quedan con level: null.
const ERROR_TYPES = [
  { code: "E1_OP", level: 1, label: "Confusión de operación", description: "No identifica correctamente qué operación (suma o resta) corresponde usar." },
  { code: "E2_RES", level: 2, label: "Error de reagrupación/procedimiento", description: "Entiende la idea, pero se equivoca al pedir prestado, reagrupar o seguir el procedimiento." },
  { code: "E2_CAL", level: 2, label: "Error de cálculo puntual", description: "El procedimiento es correcto, pero hay un error aritmético puntual." },
  { code: "E3_PREG", level: 3, label: "No responde lo que se pregunta", description: "No interpreta correctamente qué pide la pregunta del enunciado." },
  { code: "E3_DATO", level: 3, label: "Uso incorrecto de un dato del enunciado", description: "No usa correctamente un dato relevante del enunciado (lo omite o lo cambia)." },
  { code: "respuesta_rapida", level: null, label: "Respuesta excesivamente rápida", description: "Patrón observable de tiempo de respuesta muy corto — sin interpretación clínica." },
  { code: "abandono", level: null, label: "Abandono de la actividad", description: "El estudiante no completa el ejercicio o la sesión." },
  { code: "solicitud_ayuda_repetida", level: null, label: "Solicitud repetida de ayuda", description: "Pide pistas de forma reiterada en ejercicios similares." },
] as const;

async function main() {
  for (const et of ERROR_TYPES) {
    await prisma.errorType.upsert({
      where: { code: et.code },
      update: { label: et.label, description: et.description, level: et.level },
      create: et,
    });
  }
  console.log(`OK: ${ERROR_TYPES.length} tipos de error sembrados/actualizados.`);

  const errorTypeByCode = Object.fromEntries(
    (await prisma.errorType.findMany()).map((e) => [e.code, e.id]),
  );

  const { blocks, problems } = buildBlocks(errorTypeByCode);
  if (problems.length > 0) {
    throw new Error(`Variantes temáticas inválidas (corre check.ts):\n${problems.join("\n")}`);
  }
  for (const b of blocks) {
    await seedSkill(b.skill, b.exercises);
  }

  // Ilustraciones SVG por idioma y traducciones de alternativas (por id o,
  // en una BD recién sembrada, por contenido). Un caso sin correspondencia
  // única se informa y queda sin imagen — nunca con la de otro ejercicio.
  const imageProblems = await integrateImageBank();
  if (imageProblems.length > 0) {
    console.warn(`Banco de imágenes: ${imageProblems.length} caso(s) sin vincular:\n${imageProblems.join("\n")}`);
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
