/**
 * Genera ids_ejercicios.json desde una BD ya sembrada e integrada: para
 * cada ejercicio de las fuentes, su id y el de cada alternativa en esa BD.
 * Ver ids.ts. Sale con código 1 si un ejercicio de las fuentes no se
 * encuentra o se encuentra más de una vez.
 *
 *   npm run bank:ids          (desde server/)
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "../../../src/db/prisma.js";
import { buildBlocks } from "../blocks.js";
import { loadPromptEdits } from "../traducciones/applyPromptEdits.js";
import { type FixedIds } from "./ids.js";

const errorTypeByCode = Object.fromEntries((await prisma.errorType.findMany()).map((e) => [e.code, e.id]));
const { blocks } = buildBlocks(errorTypeByCode);
// Texto anterior → nuevo de los enunciados editados (en la BD está el nuevo).
const edited = new Map(loadPromptEdits().map((e) => [e.prompt.old, e]));

const out: FixedIds[] = [];
const problems: string[] = [];
for (const b of blocks) {
  const skill = await prisma.mathSkill.findFirst({ where: { grade: b.skill.grade, axis: b.skill.axis, name: b.skill.name } });
  if (!skill) {
    problems.push(`habilidad ${b.skill.grade}° "${b.skill.name}" no está en la BD`);
    continue;
  }
  for (const ex of b.exercises) {
    const edit = edited.get(ex.prompt);
    const found = await prisma.exercise.findMany({
      where: edit ? { id: edit.exerciseId, mathSkillId: skill.id } : { mathSkillId: skill.id, prompt: ex.prompt },
      include: { options: true },
    });
    if (found.length !== 1) {
      problems.push(`${b.skill.grade}° "${ex.prompt.slice(0, 70)}": ${found.length} en la BD`);
      continue;
    }
    const db = found[0]!;
    const options: Record<string, string> = {};
    for (const o of ex.options) {
      const match = db.options.find((d) => d.label === o.label);
      if (!match) problems.push(`${db.id}: alternativa "${o.label}" no está en la BD`);
      else options[o.label] = match.id;
    }
    out.push({ grade: b.skill.grade, skill: b.skill.name, prompt: ex.prompt, id: db.id, options });
  }
}
await prisma.$disconnect();

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  writeFileSync(new URL("./ids_ejercicios.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
  console.log(`OK: ${out.length} ejercicios con id fijo.`);
}
