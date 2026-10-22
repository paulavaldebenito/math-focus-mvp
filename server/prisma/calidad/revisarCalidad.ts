/**
 * Revisión automática de calidad pedagógica de una habilidad del banco (specs/016). La usa el agente
 * curriculo-semanal en cada tanda, y cualquiera puede correrla:
 *
 *   npm run bank:calidad -- "MA03 OA11"            (desde server/, con DATABASE_URL sembrada)
 *   npm run bank:calidad -- "MA03 OA11" --desde <id> (solo ejercicios con id >= <id>, p. ej. una tanda)
 *
 * Revisa, por ejercicio: taxonomía del error en las alternativas incorrectas y su diversidad; que la
 * pista no delate la respuesta; feedback propio en las 4 alternativas; desarrollo paso a paso que
 * termina en la respuesta correcta y paso equivocado previsto por alternativa; inglés; y, por la
 * habilidad completa, enunciados repetidos o casi iguales y el equilibrio de niveles. No reemplaza la
 * revisión pedagógica humana: encuentra lo mecánico para que esa revisión mire lo importante.
 * Sale con código 1 si hay errores (no solo avisos).
 */
import "dotenv/config";
import { prisma } from "../../src/db/prisma.js";

const TAXONOMIA = new Set(["E1_OP", "E2_RES", "E2_CAL", "E3_PREG", "E3_DATO"]);
const oa = process.argv[2];
const desdeIdx = process.argv.indexOf("--desde");
const desde = desdeIdx > 0 ? process.argv[desdeIdx + 1] : undefined;
if (!oa) {
  console.error('Uso: npm run bank:calidad -- "MA03 OA11" [--desde <id>]');
  process.exit(2);
}

type Bi = { es: string; en: string };
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const words = (s: string) => new Set(norm(s).replace(/[¿?¡!.,:;«»"()]/g, " ").split(" ").filter((w) => w.length > 2));
const jaccard = (a: Set<string>, b: Set<string>) => {
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / (a.size + b.size - i || 1);
};
/// La pista delata la respuesta si la contiene como fracción, número o número mixto suelto.
const revealsAnswer = (hint: string, answer: string) => /^[\d\s/.,]+$/.test(answer) && new RegExp(`(^|[^\\d/])${answer.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}($|[^\\d/])`).test(hint);

const exercises = await prisma.exercise.findMany({
  where: { mathSkill: { oaCode: oa }, theme: null, retired: false },
  include: { options: { include: { errorType: true } }, mathSkill: true },
  orderBy: { id: "asc" },
});
const objetivo = desde ? exercises.filter((e) => e.id >= desde) : exercises;
const errores: string[] = [];
const avisos: string[] = [];
const corto = (s: string) => (s.length > 70 ? s.slice(0, 67) + "…" : s);

for (const e of objetivo) {
  const id = `${e.id} «${corto(e.prompt)}»`;
  const correct = e.options.filter((o) => o.isCorrect);
  const wrong = e.options.filter((o) => !o.isCorrect);
  if (correct.length !== 1 || e.options.length !== 4) errores.push(`${id}: debe tener 4 alternativas y 1 correcta`);
  if (new Set(e.options.map((o) => norm(o.label))).size !== e.options.length) errores.push(`${id}: alternativas repetidas`);
  for (const o of wrong) {
    if (!o.errorType || !TAXONOMIA.has(o.errorType.code)) errores.push(`${id}: «${o.label}» sin tipo de error de la taxonomía`);
  }
  const codes = new Set(wrong.map((o) => o.errorType?.code));
  if (codes.size === 1 && wrong.length === 3) avisos.push(`${id}: las 3 alternativas incorrectas tienen el mismo tipo de error (${[...codes][0]}); ¿se puede diversificar?`);
  if (!e.promptEn) errores.push(`${id}: falta el enunciado en inglés`);
  if (!e.procedureNote || !e.procedureNoteEn) errores.push(`${id}: falta la pista (ES o EN)`);
  // Si la respuesta ya aparece en el enunciado (p. ej. «¿Cuál es mayor: 9/4 o 2 1/2?»), nombrarla no la delata.
  else if (correct[0] && revealsAnswer(e.procedureNote, correct[0].label) && !revealsAnswer(e.prompt, correct[0].label)) errores.push(`${id}: la pista contiene la respuesta «${correct[0].label}»`);
  for (const o of e.options) {
    if (!o.feedback || !o.feedbackEn) avisos.push(`${id}: «${o.label}» sin feedback propio (ES/EN)`);
  }
  if (correct[0]?.feedback && !/^correcto/i.test(correct[0].feedback)) avisos.push(`${id}: el feedback de la correcta no empieza confirmando («Correcto…»)`);
  const steps = e.solution as Bi[] | null;
  if (!Array.isArray(steps)) avisos.push(`${id}: sin desarrollo paso a paso`);
  else {
    const last = steps[steps.length - 1]?.es ?? "";
    // Solo para respuestas numéricas: las respuestas en palabras se cierran con una explicación, no con la etiqueta.
    if (correct[0] && /^[\d\s/.,$%]+$/.test(correct[0].label) && !norm(last).includes(norm(correct[0].label).replace(/^\$/, ""))) avisos.push(`${id}: el último paso no termina en la respuesta «${correct[0].label}»`);
    for (const o of wrong) {
      const ws = o.wrongStep as ({ step: number } & Bi) | null;
      if (!ws) avisos.push(`${id}: «${o.label}» sin paso equivocado previsto`);
      else if (ws.step < 0 || ws.step >= steps.length) errores.push(`${id}: «${o.label}» apunta a un paso que no existe`);
    }
  }
}

// Diversidad: enunciados casi iguales dentro de la habilidad (contra todo el banco de la habilidad).
const conjuntos = exercises.map((e) => ({ e, w: words(e.prompt) }));
for (const a of conjuntos.filter((x) => objetivo.includes(x.e))) {
  for (const b of conjuntos) {
    if (a.e.id >= b.e.id && objetivo.includes(b.e)) continue;
    if (a.e.id === b.e.id) continue;
    const j = jaccard(a.w, b.w);
    if (j >= 0.8) avisos.push(`enunciados casi iguales (${Math.round(j * 100)} %): «${corto(a.e.prompt)}» / «${corto(b.e.prompt)}»`);
  }
}

// Equilibrio de la tanda.
const niveles = [1, 2, 3].map((n) => objetivo.filter((e) => e.difficultyLevel === n).length);
const codigos: Record<string, number> = {};
for (const e of objetivo) for (const o of e.options) if (!o.isCorrect && o.errorType) codigos[o.errorType.code] = (codigos[o.errorType.code] ?? 0) + 1;
if (objetivo.length >= 9 && niveles.some((n) => n < objetivo.length * 0.2)) avisos.push(`niveles desequilibrados: ${niveles.join(" / ")}`);
const faltan = [...TAXONOMIA].filter((c) => !codigos[c]);
if (objetivo.length >= 9 && faltan.length) avisos.push(`tipos de error que no aparecen en la tanda: ${faltan.join(", ")}`);

console.log(`# Revisión automática de ${oa}${desde ? ` (desde ${desde})` : ""}\n`);
console.log(`Ejercicios revisados: ${objetivo.length} (habilidad completa: ${exercises.length}). Niveles 1/2/3: ${niveles.join(" / ")}.`);
console.log(`Tipos de error en las alternativas: ${Object.entries(codigos).map(([c, n]) => `${c} ${n}`).join(", ")}.\n`);
console.log(`## Errores (${errores.length})\n${errores.map((x) => `- ${x}`).join("\n") || "- ninguno"}\n`);
console.log(`## Avisos (${avisos.length})\n${avisos.map((x) => `- ${x}`).join("\n") || "- ninguno"}`);
await prisma.$disconnect();
process.exit(errores.length ? 1 : 0);
