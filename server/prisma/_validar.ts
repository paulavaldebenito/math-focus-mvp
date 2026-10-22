/** Valida y completa correcciones_*.json contra una BD sembrada (sin las correcciones aplicadas). */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { prisma } from "../src/db/prisma.js";
const D = "/private/tmp/claude-501/-Users-pau/790fd484-c4fa-4eb4-82b1-d44a40c6ea05/scratchpad/revision_app";
const CODES = new Set(["E1_OP", "E2_RES", "E2_CAL", "E3_PREG", "E3_DATO"]);
const out: any[] = [];
const problems: string[] = [];
for (const f of process.argv.slice(2)) {
  for (const c of JSON.parse(readFileSync(`${D}/${f}`, "utf8"))) {
    const ex = await prisma.exercise.findUnique({ where: { id: c.exerciseId }, include: { options: { include: { errorType: true } } } });
    const P = (m: string) => problems.push(`${f} ${c.exerciseId}: ${m}`);
    if (!ex) { P("no existe"); continue; }
    if (ex.prompt !== c.prompt) { P(`enunciado distinto, se usa el de la BD`); c.prompt = ex.prompt; }
    const lab = (l: string) => ex.options.find((o) => o.label === l);
    let bad = false;
    for (const r of c.recode ?? []) {
      const o = lab(r.label);
      if (!o || o.isCorrect) { P(`recode: «${r.label}» no es incorrecta existente`); bad = true; continue; }
      if (!CODES.has(r.to)) { P(`recode: código ${r.to}`); bad = true; }
      const cur = o.errorType?.code ?? null;
      if (cur !== r.from) { if (cur === r.to) P(`recode «${r.label}» ya es ${r.to}`); else P(`recode «${r.label}»: es ${cur}, no ${r.from} (se corrige from)`); r.from = cur; }
    }
    c.recode = (c.recode ?? []).filter((r: any) => r.from !== r.to);
    for (const r of c.relabel ?? []) {
      const o = lab(r.from);
      if (!o || o.isCorrect) { P(`relabel: «${r.from}» no existe`); bad = true; }
      if (lab(r.to)) { P(`relabel: «${r.to}» ya existe`); bad = true; }
      if (r.code && !CODES.has(r.code)) { P(`relabel código ${r.code}`); bad = true; }
    }
    for (const a of c.add ?? []) {
      if (lab(a.label)) { P(`add: «${a.label}» ya existe`); bad = true; }
      if (!CODES.has(a.code)) { P(`add código ${a.code}`); bad = true; }
    }
    const total = ex.options.length + (c.add?.length ?? 0);
    if (c.add?.length && total > 4) { P(`add deja ${total} alternativas`); bad = true; }
    if (c.hint) {
      if (c.hint.old !== ex.procedureNote) { P(`hint.old distinto de la BD (se usa la BD)`); c.hint.old = ex.procedureNote; }
      if (c.hint.oldEn !== ex.procedureNoteEn) c.hint.oldEn = ex.procedureNoteEn;
      if (!c.hint.newEn || c.hint.newEn === "?") { P(`hint sin newEn`); bad = true; }
    }
    if (c.level && c.level.from !== ex.difficultyLevel) { P(`nivel es ${ex.difficultyLevel}, no ${c.level.from}`); c.level.from = ex.difficultyLevel; }
    if (bad) { P("ENTRADA DESCARTADA"); continue; }
    for (const k of ["recode", "relabel", "add"]) if (c[k] && c[k].length === 0) delete c[k];
    if (Object.keys(c).length > 2) out.push(c);
  }
}
writeFileSync(`${D}/correcciones_validadas.json`, JSON.stringify(out, null, 1) + "\n");
console.log(problems.join("\n"));
console.log(`válidas: ${out.length}`);
await prisma.$disconnect();
