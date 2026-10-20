import { prisma } from "../../src/db/prisma.js";
import type { SeedExercise, SeedSkill } from "./lib.js";
import { idKey, loadFixedIds } from "./ids/ids.js";

// Todos los ejercicios de este seed son FICTICIOS (isFictitious: true por
// defecto) — sirven para probar el modelo de datos y el flujo completo, no
// son contenido curricular aprobado (salvo el oaCode, verificado aparte
// contra la fuente oficial cuando está presente). difficultyLevel 1-3
// permite que el motor adaptativo pida un ejercicio más fácil o más
// difícil. Idempotente por ejercicio (no por habilidad): si se agregan
// ejercicios nuevos al arreglo de una habilidad ya sembrada, igual se crean.
export async function seedSkill(skillData: SeedSkill, exercises: SeedExercise[]) {
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
  const fixedIds = loadFixedIds();
  for (const ex of exercises) {
    // Id fijo (ver ids/ids.ts): primero por id — así un ejercicio cuyo
    // enunciado se editó después (enunciados_editados.json) se reconoce y
    // no se duplica —, y si no, por enunciado como siempre.
    const fixed = fixedIds.get(idKey(skillData.grade, skillData.name, ex.prompt));
    const exists =
      (fixed && (await prisma.exercise.findUnique({ where: { id: fixed.id } }))) ||
      (await prisma.exercise.findFirst({ where: { mathSkillId: skill.id, prompt: ex.prompt } }));

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
          theme: ex.theme ?? null,
          baseKey: ex.baseKey ?? null,
        },
      });
      updated += 1;
      continue;
    }

    await prisma.exercise.create({
      data: {
        ...(fixed ? { id: fixed.id } : {}),
        mathSkillId: skill.id,
        prompt: ex.prompt,
        promptEn: ex.promptEn,
        procedureNote: ex.procedureNote,
        procedureNoteEn: ex.procedureNoteEn,
        difficultyLevel: ex.difficultyLevel,
        visual: ex.visual as never,
        theme: ex.theme ?? null,
        baseKey: ex.baseKey ?? null,
        options: {
          create: ex.options.map((o) => (fixed?.options[o.label] ? { id: fixed.options[o.label], ...o } : o)),
        },
      },
    });
    created += 1;
  }

  console.log(`OK: ${created} ejercicio(s) nuevo(s), ${updated} actualizado(s) para "${skillData.name}".`);
}
