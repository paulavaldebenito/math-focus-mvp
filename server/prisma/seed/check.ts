/**
 * Herramienta de desarrollo para autores del banco (sin base de datos).
 *
 *   npx tsx prisma/seed/check.ts check <curso|all> [tema]  valida estructura (con [tema], solo las variantes de ese interés)
 *   npx tsx prisma/seed/check.ts blind <curso> <dir>      escribe blind-gN.json + key-gN.json
 *   npx tsx prisma/seed/check.ts compare <curso> <respuestas.json> <key.json>
 *   npx tsx prisma/seed/check.ts bases <curso>            lista los ejercicios base (para escribir variantes)
 *   npx tsx prisma/seed/check.ts coverage                 variantes por interés × curso
 *   npx tsx prisma/seed/check.ts simulate <curso>         % temático medido en sesiones simuladas
 *
 * `blind` vuelca prompts + opciones mezcladas SIN marcar la correcta, para que
 * un revisor independiente resuelva cada ejercicio; `compare` lista toda
 * discrepancia contra la clave. Es la defensa contra errores de matemática.
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { SkillBlock } from "./lib.js";
import { grade1 } from "./grade1.js";
import { grade2 } from "./grade2.js";
import { grade3 } from "./grade3.js";
import { grade4 } from "./grade4.js";
import { grade5 } from "./grade5.js";
import { grade6 } from "./grade6.js";
import { withThemes, type ThemeFile } from "./themes/lib.js";
import { INTEREST_KEYS } from "../../src/domain/interests.js";
import { pickExercise } from "../../src/exercises/select.js";

const ERROR_CODES = ["E1_OP", "E2_RES", "E2_CAL", "E3_PREG", "E3_DATO"] as const;
const AXES = [
  "Números y operaciones",
  "Patrones y álgebra",
  "Geometría",
  "Medición",
  "Datos y probabilidades",
];
const ids = Object.fromEntries(ERROR_CODES.map((c) => [c, c]));

const GRADES: Record<number, (e: { [c: string]: string }) => SkillBlock[]> = {
  1: grade1,
  2: grade2,
  3: grade3,
  4: grade4,
  5: grade5,
  6: grade6,
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/// Bloques neutros del curso (ids estables para `blind`/`compare`).
function loadBase(grade: number): SkillBlock[] {
  const fn = GRADES[grade];
  if (!fn) throw new Error(`Curso inválido: ${grade}`);
  return fn(ids);
}

/// Archivos de temas activos (todos, o solo uno con `check <curso> <tema>`, para que un autor
/// valide su archivo aunque otros estén a medio escribir).
let THEME_FILES: ThemeFile[] = [];

async function loadThemes(only?: string): Promise<ThemeFile[]> {
  if (only) return [(await import(`./themes/${only}.js`)).default as ThemeFile];
  return (await import("./themes/index.js")).THEME_FILES;
}

/// Bloques del curso con sus variantes temáticas y los problemas que detectó el constructor.
function load(grade: number): { blocks: SkillBlock[]; problems: string[] } {
  return withThemes(
    loadBase(grade),
    THEME_FILES.map((f) => ({ theme: f.theme, variants: f.variants.filter((v) => v.grade === grade) })),
  );
}

function check(grade: number): number {
  const { blocks, problems } = load(grade);
  const errors: string[] = problems.map((p) => `variante: ${p}`);
  const warns: string[] = [];
  let variants = 0;
  const strict = grade >= 3; // 1° y 2° traen contenido previo con excepciones conocidas
  const perLevel = [0, 0, 0];
  let total = 0;

  for (const { skill, exercises } of blocks) {
    const tag = `[${grade}° ${skill.name}]`;
    if (skill.grade !== grade) errors.push(`${tag} skill.grade=${skill.grade}`);
    if (!AXES.includes(skill.axis)) errors.push(`${tag} eje desconocido "${skill.axis}"`);
    if (skill.oaCode !== undefined && !new RegExp(`^MA0${grade} OA\\d{2}$`).test(skill.oaCode)) {
      errors.push(`${tag} oaCode con formato inválido "${skill.oaCode}"`);
    }

    const byLevel = [0, 0, 0];
    const seen = new Set<string>();
    exercises.forEach((ex, i) => {
      const at = `${tag} #${i + 1} "${ex.prompt.slice(0, 40)}…"`;
      const isNeutral = ex.theme === undefined;
      if (isNeutral) total += 1;
      else if (ex.baseKey) variants += 1;
      if (![1, 2, 3].includes(ex.difficultyLevel)) errors.push(`${at} difficultyLevel=${ex.difficultyLevel}`);
      else if (isNeutral) {
        // Los mínimos por nivel se miden sobre el contenido neutro (las variantes son extras).
        byLevel[ex.difficultyLevel - 1]! += 1;
        perLevel[ex.difficultyLevel - 1]! += 1;
      }
      for (const f of ["prompt", "promptEn", "procedureNote", "procedureNoteEn"] as const) {
        if (!ex[f] || !ex[f].trim()) errors.push(`${at} ${f} vacío`);
      }
      if (seen.has(ex.prompt)) errors.push(`${at} prompt duplicado en el skill`);
      seen.add(ex.prompt);

      if (ex.options.length < 2 || ex.options.length > 4) errors.push(`${at} ${ex.options.length} opciones`);
      else if (ex.options.length !== 4) (strict ? errors : warns).push(`${at} ${ex.options.length} opciones (se esperan 4)`);

      const correct = ex.options.filter((o) => o.isCorrect);
      if (correct.length !== 1) errors.push(`${at} ${correct.length} opciones correctas`);
      else if (ex.options[0] !== correct[0]) errors.push(`${at} la correcta debe ir primera`);
      const labels = ex.options.map((o) => o.label.trim());
      if (new Set(labels).size !== labels.length) errors.push(`${at} etiquetas de opción repetidas`);
      if (labels.some((l) => !l)) errors.push(`${at} etiqueta vacía`);

      const wrong = ex.options.filter((o) => !o.isCorrect);
      if (!wrong.some((o) => o.errorTypeId)) errors.push(`${at} ningún distractor con errorTypeId`);
      if (wrong.some((o) => !o.errorTypeId)) warns.push(`${at} distractor sin errorTypeId`);
      for (const o of wrong) {
        if (o.errorTypeId && !(ERROR_CODES as readonly string[]).includes(o.errorTypeId)) {
          errors.push(`${at} errorTypeId desconocido "${o.errorTypeId}"`);
        }
      }

      if (strict && ex.visual !== null) errors.push(`${at} visual debe ser null en 3°-6°`);
      if (ex.theme !== undefined && !(INTEREST_KEYS as readonly string[]).includes(ex.theme)) {
        errors.push(`${at} theme desconocido "${ex.theme}"`);
      }

      if (correct[0]) {
        const token = new RegExp(`(?<![\\p{L}\\p{N},.])${escapeRegExp(correct[0].label.trim())}(?![\\p{L}\\p{N}])`, "u");
        if (token.test(ex.procedureNote) || token.test(ex.procedureNoteEn)) {
          warns.push(`${at} la pista contiene la respuesta correcta "${correct[0].label}" (revisar que no la revele)`);
        }
      }
    });

    byLevel.forEach((n, l) => {
      if (n < 3) errors.push(`${tag} nivel ${l + 1} tiene ${n} ejercicios (mínimo 3)`);
    });
  }

  perLevel.forEach((n, l) => {
    if (n < 6) (strict ? errors : warns).push(`[${grade}°] nivel ${l + 1} tiene ${n} ejercicios en total (mínimo 6 por curso)`);
  });
  if (strict && total < 55) warns.push(`[${grade}°] solo ${total} ejercicios (objetivo ~60)`);
  const axesCovered = new Set(blocks.map((b) => b.skill.axis));
  if (strict && axesCovered.size < AXES.length) {
    warns.push(`[${grade}°] ejes cubiertos: ${axesCovered.size}/${AXES.length}`);
  }

  console.log(`${grade}°: ${blocks.length} contenidos, ${total} ejercicios neutros (niveles ${perLevel.join("/")}) + ${variants} variantes temáticas, ejes ${axesCovered.size}/${AXES.length}`);
  for (const w of warns) console.log(`  AVISO  ${w}`);
  for (const e of errors) console.log(`  ERROR  ${e}`);
  console.log(errors.length ? `${errors.length} error(es)` : "OK: sin errores");
  return errors.length ? 1 : 0;
}

function blind(grade: number, dir: string): number {
  const blocks = loadBase(grade);
  const items: unknown[] = [];
  const key: Record<string, string> = {};
  let n = 0;
  for (const { skill, exercises } of blocks) {
    for (const ex of exercises) {
      n += 1;
      const id = `g${grade}-${String(n).padStart(3, "0")}`;
      const options = ex.options.map((o) => o.label);
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j]!, options[i]!];
      }
      items.push({ id, contenido: skill.name, prompt: ex.prompt, options });
      key[id] = ex.options.find((o) => o.isCorrect)!.label;
    }
  }
  writeFileSync(`${dir}/blind-g${grade}.json`, JSON.stringify(items, null, 2));
  writeFileSync(`${dir}/key-g${grade}.json`, JSON.stringify(key, null, 2));
  console.log(`OK: ${n} ejercicios volcados en ${dir}/blind-g${grade}.json (clave en key-g${grade}.json)`);
  return 0;
}

function compare(grade: number, answersPath: string, keyPath: string): number {
  const answers = JSON.parse(readFileSync(answersPath, "utf8")) as Record<string, string>;
  const key = JSON.parse(readFileSync(keyPath, "utf8")) as Record<string, string>;
  const blocks = loadBase(grade);
  const promptById = new Map<string, string>();
  let n = 0;
  for (const { exercises } of blocks) for (const ex of exercises) promptById.set(`g${grade}-${String(++n).padStart(3, "0")}`, ex.prompt);

  let bad = 0;
  for (const [id, correct] of Object.entries(key)) {
    const got = answers[id];
    if (got === undefined) {
      bad += 1;
      console.log(`SIN RESPUESTA ${id}: ${promptById.get(id)}`);
    } else if (got.trim() !== correct.trim()) {
      bad += 1;
      console.log(`DISCREPANCIA ${id}: marcada "${correct}" pero el revisor resolvió "${got}" — ${promptById.get(id)}`);
    }
  }
  console.log(bad ? `${bad} discrepancia(s) de ${Object.keys(key).length}` : `OK: ${Object.keys(key).length} de ${Object.keys(key).length} coinciden`);
  return bad ? 1 : 0;
}

function bases(grade: number): number {
  const { blocks } = load(grade);
  const existing = new Map<string, string[]>();
  for (const { skill, exercises } of blocks) {
    for (const ex of exercises) {
      if (ex.theme && ex.baseKey) {
        const list = existing.get(`${skill.name}|${ex.baseKey}`) ?? [];
        list.push(ex.theme);
        existing.set(`${skill.name}|${ex.baseKey}`, list);
      }
    }
  }
  let n = 0;
  for (const { skill, exercises } of blocks) {
    console.log(`\n## ${skill.name}  (${skill.axis})`);
    for (const ex of exercises) {
      if (ex.theme !== undefined) continue;
      n += 1;
      const themes = ex.baseKey ? (existing.get(`${skill.name}|${ex.baseKey}`) ?? []).join(",") : "";
      const visual = ex.visual && typeof ex.visual === "object" && "emoji" in (ex.visual as object) ? " [visual con emoji]" : "";
      console.log(`- N${ex.difficultyLevel}${visual}${themes ? ` (ya: ${themes})` : ""} ${ex.prompt}`);
    }
  }
  console.log(`\n${n} ejercicios base en ${grade}°`);
  return 0;
}

function coverage(): number {
  const rows: string[] = [];
  const header = ["interés", ...[1, 2, 3, 4, 5, 6].map((g) => `${g}°`), "total"];
  rows.push(header.join("\t"));
  const perGradeTotals = [0, 0, 0, 0, 0, 0];
  for (const key of INTEREST_KEYS) {
    const counts = [1, 2, 3, 4, 5, 6].map((g) => {
      const file = THEME_FILES.find((f) => f.theme === key);
      return file ? file.variants.filter((v) => v.grade === g).length : 0;
    });
    counts.forEach((c, i) => (perGradeTotals[i]! += c));
    rows.push([key, ...counts, counts.reduce((a, b) => a + b, 0)].join("\t"));
  }
  rows.push(["TOTAL", ...perGradeTotals, perGradeTotals.reduce((a, b) => a + b, 0)].join("\t"));
  for (const r of rows) console.log(r);
  return 0;
}

/// Simula sesiones con la misma lógica de selección del servidor (pickExercise,
/// exclusión por baseKey, respaldo nivel → cualquier nivel) sobre el banco en
/// memoria, para medir la proporción temática real por curso.
function simulate(grade: number): number {
  const { blocks } = load(grade);
  const all = blocks.flatMap((b) => b.exercises.map((e) => ({ ...e, skill: b.skill.name })));
  const SESSION = 12;
  const RUNS = 300;
  const combos: string[][] = [];
  for (let i = 0; i < INTEREST_KEYS.length; i++) combos.push([INTEREST_KEYS[i]!]);
  for (let i = 0; i < INTEREST_KEYS.length; i++) {
    combos.push([INTEREST_KEYS[i]!, INTEREST_KEYS[(i + 3) % INTEREST_KEYS.length]!, INTEREST_KEYS[(i + 6) % INTEREST_KEYS.length]!]);
  }
  let themed = 0;
  let served = 0;
  const worst: Array<{ combo: string; share: number }> = [];
  for (const combo of combos) {
    let cThemed = 0;
    let cServed = 0;
    for (let run = 0; run < RUNS; run++) {
      const usedIds = new Set<string>();
      const usedKeys = new Set<string>();
      let level = 2;
      for (let q = 0; q < SESSION; q++) {
        const allowed = (e: (typeof all)[number]) =>
          (e.theme === undefined || combo.includes(e.theme)) && !usedIds.has(e.prompt) && !(e.baseKey && usedKeys.has(e.baseKey));
        let pool = all.filter((e) => allowed(e) && e.difficultyLevel === level);
        if (pool.length === 0) pool = all.filter(allowed);
        const pick = pickExercise(pool.map((e) => ({ ...e, theme: e.theme ?? null })));
        if (!pick) break;
        usedIds.add(pick.prompt);
        if (pick.baseKey) usedKeys.add(pick.baseKey);
        cServed += 1;
        if (pick.theme !== null) cThemed += 1;
        level = 1 + Math.floor(Math.random() * 3); // el nivel real lo mueve el motor adaptativo
      }
    }
    themed += cThemed;
    served += cServed;
    worst.push({ combo: combo.join("+"), share: cServed ? cThemed / cServed : 0 });
  }
  worst.sort((a, b) => a.share - b.share);
  console.log(`${grade}°: ${(100 * themed / Math.max(served, 1)).toFixed(0)}% temático en promedio (${combos.length} combinaciones de intereses × ${RUNS} sesiones de ${SESSION})`);
  console.log(`  mínimo ${(100 * worst[0]!.share).toFixed(0)}% (${worst[0]!.combo}), máximo ${(100 * worst.at(-1)!.share).toFixed(0)}% (${worst.at(-1)!.combo})`);
  return 0;
}

const [cmd, gradeArg, a, b] = process.argv.slice(2);
const grade = Number(gradeArg);
THEME_FILES = await loadThemes(cmd === "check" ? a : undefined);
if (cmd === "coverage") process.exit(coverage());
if (cmd === "check" && gradeArg === "all") {
  let status = 0;
  for (const g of [1, 2, 3, 4, 5, 6]) status = check(g) || status;
  process.exit(status);
}
if (!cmd || !Number.isInteger(grade)) {
  console.error("Uso: check.ts check <curso|all> [tema] | blind|compare|bases|simulate <curso> [...] | coverage");
  process.exit(2);
}
if (cmd === "bases") process.exit(bases(grade));
if (cmd === "simulate") process.exit(simulate(grade));
if (cmd === "check") process.exit(check(grade));
if (cmd === "blind" && a) process.exit(blind(grade, a));
if (cmd === "compare" && a && b) process.exit(compare(grade, a, b));
console.error("Argumentos inválidos");
process.exit(2);
