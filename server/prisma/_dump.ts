import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "../src/db/prisma.js";
const oas = process.argv.slice(2);
const ex = await prisma.exercise.findMany({ where: { mathSkill: { oaCode: { in: oas } }, theme: null }, include: { options: { include: { errorType: true } }, mathSkill: true }, orderBy: { id: "asc" } });
const out = ex.map((e) => ({ id: e.id, g: e.mathSkill.grade, oa: e.mathSkill.oaCode, lvl: e.difficultyLevel, p: e.prompt, pEn: e.promptEn, h: e.procedureNote, hEn: e.procedureNoteEn, img: !!e.image, vis: !!e.visual, opts: e.options.map((o) => `${o.isCorrect ? "*" : ""}${o.label}${o.labelEn ? "|" + o.labelEn : ""}${o.errorType ? ":" + o.errorType.code : ""}`) }));
writeFileSync("/private/tmp/claude-501/-Users-pau/790fd484-c4fa-4eb4-82b1-d44a40c6ea05/scratchpad/revision_app/dump.json", JSON.stringify(out, null, 1));
console.log(out.length);
await prisma.$disconnect();
