/**
 * Vincula el banco visual completo (banco_visual.json, 2.124 ejercicios)
 * con la BD — EXCLUSIVAMENTE por exerciseId, verificando que el enunciado
 * en español coincida (baseKey no es único; nunca se asigna por parecido).
 * Reemplaza en `Exercise.image` la ilustración anterior de esos ejercicios,
 * para una presentación coherente entre cursos. Idempotente.
 *
 * Leyendas (siempre como texto de la interfaz, fuera de la imagen): las
 * letras A, B, C dibujadas se explican en el idioma activo solo con nombres
 * VERIFICADOS — rowLabels de fracciones, opciones por su ID (optionBindings)
 * o nombres de barras/pictogramas cuyos valores calzan exactos con el
 * enunciado en ambos idiomas. Si no, la leyenda genérica del paquete. Nunca
 * una leyenda que revele la respuesta.
 */
import { readFileSync } from "node:fs";
import { Prisma, type PrismaClient } from "../../../src/generated/prisma/client.js";
import type { BancoVisualEntry, BancoVisualFile } from "./prepararBancoVisual.js";
import { loadPromptEdits } from "../traducciones/applyPromptEdits.js";

type Lang = "es" | "en";
type Bilingual = Record<Lang, string>;

export interface LegendItem {
  key: string;
  label: Bilingual;
  /** Si la letra corresponde a una alternativa: su ID (sobrevive a la mezcla). */
  optionId?: string;
}

export type Legend =
  | { type: "none" }
  | { type: "named"; source: "rowLabels" | "optionBindings" | "prompt"; items: LegendItem[] }
  | { type: "generic"; text: Bilingual; reason: string };

export interface ExerciseForLegend {
  prompt: string;
  promptEn: string | null;
  options: Array<{ id: string; label: string; labelEn: string | null; isCorrect: boolean }>;
}

/// Leyenda genérica que ve el niño (1.° a 6.° básico): la misma idea que la
/// del paquete ("A, B, C… siguen el orden de los grupos o datos mencionados
/// en el enunciado; si hay opciones, siguen su orden original"), pero en una
/// frase corta que un niño de 1.° puede leer.
export const GENERIC_LEGEND: Bilingual = {
  es: "Las letras A, B, C… siguen el orden del enunciado.",
  en: "The letters A, B, C… follow the order in the question.",
};

export function loadBancoVisual(): BancoVisualFile {
  return JSON.parse(readFileSync(new URL("./banco_visual.json", import.meta.url), "utf8")) as BancoVisualFile;
}

// ---------- Nombres de categorías desde el enunciado (barras/pictogramas) ----------

const EMOJI = /(?:\p{Extended_Pictographic}[️‍]*)+/gu;
const NUMBER = /\d+(?:[.,]\d+)?/g;

interface Token {
  start: number;
  end: number;
  value: number;
}

function tokens(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(NUMBER)) {
    out.push({ start: m.index!, end: m.index! + m[0].length, value: Number(m[0].replace(",", ".")) });
  }
  // Una fila de emojis de un pictograma ("Manzanas: 🍎🍎🍎🍎") cuenta como su cantidad.
  for (const m of text.matchAll(EMOJI)) {
    out.push({ start: m.index!, end: m.index! + m[0].length, value: [...m[0].matchAll(/\p{Extended_Pictographic}/gu)].length });
  }
  return out.sort((a, b) => a.start - b.start);
}

const LEAD: Record<Lang, string[]> = {
  es: [
    "en (?:un|el) (?:gráfico|pictograma)[^,:]*[,:]",
    "y",
    "e",
    "la barra (?:de |del )?(?:los |las |la |el )?",
    "la de (?:los |las |la |el )?",
    "el de (?:los |las |la |el )?",
    "del",
    "el",
    "la",
    "los",
    "las",
  ],
  en: ["in (?:an?|the) (?:bar (?:graph|chart)|pictograph|pictogram|graph)[^,:]*[,:]", "and", "the bar for(?: the)?", "the"],
};
const TRAIL: Record<Lang, string[]> = {
  es: ["llegan?(?: hasta)?(?: el| al| a)?", "llegan?", "hasta el", "hasta", "al", "a", "tienen?", "miden?", "con", "y"],
  en: [
    "'s bar goes up to",
    "bar goes up to",
    "bar up to",
    "up to",
    "'s bar reaches",
    "' bar reaches",
    "'s bar",
    "' bar",
    "bar reaches",
    "bar",
    "reaches",
    "reach",
    "'s",
    "'",
    "goes up to",
    "is at",
    "has",
    "have",
    "measures?",
    "with",
    "to",
    "and",
  ],
};
/// Palabras que delatan que el fragmento no es solo un nombre de categoría.
const NOT_A_NAME =
  /\b(hay|there|is|are|símbolos?|dibujos?|symbols?|pictures?|drawings?|fila|row|barra|niños|children|prefieren|prefer|cuadritos|squares|pasaron|passed|huellas|footprints|mide|measures|llega|reaches|votos|votes|escala|scale|tuvo|had|visitas|visits|curso|class)\b/i;

export function cleanName(segment: string, lang: Lang): string {
  const trim = (s: string) => s.replace(/^[\s,:;.]+|[\s,:;.]+$/g, "");
  let s = trim(segment);
  for (let changed = true; changed; ) {
    changed = false;
    for (const p of LEAD[lang]) {
      // El prefijo debe terminar en un límite de palabra (espacio propio del
      // patrón, espacio siguiente o fin) — "el" nunca se come "elefante".
      const n = trim(s.replace(new RegExp(`^(?:${p})(?:(?<=\\s)|\\s+|$)`, "i"), ""));
      if (n !== s) [s, changed] = [n, true];
    }
    for (const p of TRAIL[lang]) {
      const n = trim(s.replace(new RegExp(`(?:^|\\s+)(?:${p})$`, "i"), ""));
      if (n !== s) [s, changed] = [n, true];
    }
  }
  s = s.replace(/['’]s?$/, "").replace(/\s+/g, " ").trim();
  if (!s || s.split(" ").length > 3 || NOT_A_NAME.test(s) || /\d/.test(s)) return "";
  return s;
}

/// Nombres de las categorías, en orden, SOLO si el enunciado trae una serie
/// consecutiva de números idéntica a los valores dibujados y cada número
/// tiene un nombre limpio delante. Si no, null (no se adivina).
export function namesFromPrompt(prompt: string, values: number[], lang: Lang): string[] | null {
  const toks = tokens(prompt);
  const n = values.length;
  for (let i = 0; i + n <= toks.length; i++) {
    if (!toks.slice(i, i + n).every((t, j) => t.value === values[j])) continue;
    const names: string[] = [];
    for (let j = 0; j < n; j++) {
      const end = toks[i + j]!.start;
      let start: number;
      if (j === 0) {
        const b = Math.max(...[".", ":", ";", ","].map((c) => prompt.lastIndexOf(c, end - 1)));
        start = b + 1;
        if (!cleanName(prompt.slice(start, end), lang)) {
          start = Math.max(...[".", ":", ";"].map((c) => prompt.lastIndexOf(c, b - 1))) + 1;
        }
      } else {
        start = toks[i + j - 1]!.end;
      }
      names.push(cleanName(prompt.slice(start, end), lang));
    }
    const distinct = new Set(names.map((x) => x.toLowerCase())).size === n;
    return names.every(Boolean) && distinct ? names : null;
  }
  return null;
}

// ---------- Pictogramas de emojis (1.° y 2.°, 1 dibujo = 1) ----------

export interface PictographRow {
  emoji: string;
  count: number;
  /** Nombre de la categoría; null si no se pudo verificar (el emoji la identifica igual). */
  label: Bilingual | null;
}

/// Filas de emojis del enunciado ("Manzanas: 🍎🍎🍎🍎") en orden, SOLO si
/// son exactamente las filas dibujadas: mismas cantidades, cada fila de un
/// único emoji. Devuelve también el nombre que las precede.
function emojiRows(prompt: string, values: number[], lang: Lang): Array<{ emoji: string; name: string }> | null {
  const runs = [...prompt.matchAll(EMOJI)];
  if (runs.length !== values.length) return null;
  const out: Array<{ emoji: string; name: string }> = [];
  for (const [i, run] of runs.entries()) {
    const glyphs = [...run[0].matchAll(/\p{Extended_Pictographic}\uFE0F?/gu)].map((g) => g[0]);
    if (glyphs.length !== values[i] || new Set(glyphs).size !== 1) return null;
    // El nombre va justo antes de la fila ("Rojo: 🔴🔴…"): se quita el ":" final
    // y se toma desde el signo anterior (fin de la fila previa u oración).
    const from = i === 0 ? 0 : runs[i - 1]!.index! + runs[i - 1]![0].length;
    const before = prompt.slice(from, run.index!).replace(/[\s:]+$/, "");
    const cut = Math.max(...[".", ":", ";", ","].map((c) => before.lastIndexOf(c)));
    out.push({ emoji: glyphs[0]!, name: cleanName(before.slice(cut + 1), lang) });
  }
  return out;
}

export function emojiPictograph(entry: BancoVisualEntry, ex: ExerciseForLegend): PictographRow[] | null {
  if (entry.kind !== "pictogram" || entry.grade > 2 || (entry.scale ?? 1) !== 1 || !entry.values) return null;
  const es = emojiRows(ex.prompt, entry.values, "es");
  if (!es) return null;
  const en = ex.promptEn ? emojiRows(ex.promptEn, entry.values, "en") : null;
  const named = es.every((r) => r.name) && en !== null && en.every((r) => r.name) && en.every((r, i) => r.emoji === es[i]!.emoji);
  return es.map((r, i) => ({
    emoji: r.emoji,
    count: entry.values![i]!,
    label: named ? { es: r.name, en: en![i]!.name } : null,
  }));
}

// ---------- Leyenda ----------

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

export function buildLegend(entry: BancoVisualEntry, ex: ExerciseForLegend, generic: Bilingual): Legend {
  const letters = entry.letters;
  if (letters.length === 0) return { type: "none" };
  const genericBecause = (reason: string): Legend => ({ type: "generic", text: generic, reason });

  // Letras que son el propio nombre del punto en el enunciado ("el punto A"),
  // o que SON las alternativas (¿cuál de estas letras…?): no hace falta leyenda.
  if (entry.kind === "symmetry_point" || entry.kind === "letters") return { type: "none" };

  if (entry.optionBindings) {
    const byId = new Map(ex.options.map((o) => [o.id, o]));
    const opts = entry.optionBindings.map((id) => byId.get(id));
    if (opts.some((o) => !o) || opts.length !== letters.length) return genericBecause("optionBindings_no_calzan");
    // Letras que YA son las alternativas (¿cuál letra es simétrica?): no hace falta leyenda.
    if (opts.every((o, i) => norm(o!.label) === norm(letters[i]!))) return { type: "none" };
    return {
      type: "named",
      source: "optionBindings",
      items: opts.map((o, i) => ({ key: letters[i]!, optionId: o!.id, label: { es: o!.label, en: o!.labelEn ?? o!.label } })),
    };
  }

  if (entry.rowLabels) {
    const labels = entry.rowLabels.map((r) => r.label);
    if (entry.rowLabels.map((r) => r.key).join() !== letters.join()) return genericBecause("rowLabels_no_calzan_con_letras");
    const correct = ex.options.find((o) => o.isCorrect);
    const optionSet = new Set(ex.options.map((o) => norm(o.label)));
    const restatesOptions = labels.length === ex.options.length && labels.every((l) => optionSet.has(norm(l.es)));
    const reveals =
      correct !== undefined &&
      labels.some((l) => norm(l.es) === norm(correct.label) || norm(correct.label).split(/[,;]/).includes(norm(l.es)));
    if (reveals && !restatesOptions) return genericBecause("rowLabels_revela_respuesta");
    return { type: "named", source: "rowLabels", items: entry.rowLabels.map((r) => ({ key: r.key, label: r.label })) };
  }

  if (entry.values && (entry.kind === "bars" || entry.kind === "pictogram")) {
    const es = namesFromPrompt(ex.prompt, entry.values, "es");
    const en = ex.promptEn ? namesFromPrompt(ex.promptEn, entry.values, "en") : null;
    if (es && en && es.length === letters.length && en.length === letters.length) {
      return { type: "named", source: "prompt", items: letters.map((k, i) => ({ key: k, label: { es: es[i]!, en: en[i]! } })) };
    }
    return genericBecause("nombres_no_verificables");
  }

  return genericBecause("grupos_sin_nombre");
}

// ---------- Vínculo con la BD ----------

/// Pictograma de emojis (1.° y 2.° básico, 1 dibujo = 1): filas con el
/// emoji y el nombre de cada categoría, sin letras ni leyenda aparte — el
/// estilo concreto que corresponde a la etapa (COPISI, ver specs/010).
export interface EmojiPictographImage {
  kind: "pictograph";
  source: "emoji_pictograph";
  rows: PictographRow[];
  alt: Bilingual;
}

/// Lo que se guarda y se envía a la app: sin el motivo interno de una
/// leyenda genérica (solo va al reporte) ni ningún dato de construcción.
export type PublicLegend = Exclude<Legend, { type: "generic" }> | { type: "generic"; text: Bilingual };

export interface BancoVisualImage {
  kind: string;
  source: "banco_visual";
  size: Record<Lang, { width: number; height: number }>;
  src: Record<Lang, string>;
  alt: Bilingual;
  legend: PublicLegend;
}

export function publicLegend(legend: Legend): PublicLegend {
  return legend.type === "generic" ? { type: "generic", text: legend.text } : legend;
}

export interface BancoVisualReport {
  entries: number;
  linked: number;
  /** Ejercicios con dibujo de emojis propio (`visual`): se prefiere ese
   * estilo — la imagen del banco no se vincula (decisión de la usuaria). */
  emojiPreferred: number;
  /** Pictogramas de 1.° y 2.° (1 dibujo = 1) mostrados con emojis. */
  emojiPictographs: number;
  absent: Array<{ exerciseId: string; grade: number; prompt: string }>;
  promptMismatch: Array<{ exerciseId: string; db: string; package: string }>;
  legends: Record<string, number>;
  genericReasons: Record<string, number>;
  byGrade: Record<number, number>;
}

/// alt del paquete = descripción + enunciado del paquete. En ambos idiomas se
/// reemplaza ese enunciado por el vigente en la BD (inglés de aula, o un
/// enunciado editado en enunciados_editados.json), para que el lector de
/// pantalla nunca lea un texto distinto al que está en pantalla.
function localizedAlt(entry: BancoVisualEntry, prompt: string, promptEn: string | null): Bilingual {
  const swap = (alt: string, packaged: string, current: string | null) =>
    current && alt.endsWith(packaged) ? alt.slice(0, alt.length - packaged.length) + current : alt;
  return { es: swap(entry.alt.es, entry.prompt.es, prompt), en: swap(entry.alt.en, entry.prompt.en, promptEn) };
}

export function toImage(entry: BancoVisualEntry, ex: ExerciseForLegend, legend: Legend): BancoVisualImage {
  const size = { width: entry.width, height: entry.height };
  return {
    kind: entry.kind,
    source: "banco_visual",
    size: { es: size, en: size },
    // Sin palabras incrustadas: la misma imagen sirve para ambos idiomas.
    src: { es: entry.src, en: entry.src },
    alt: localizedAlt(entry, ex.prompt, ex.promptEn),
    legend: publicLegend(legend),
  };
}

/// Texto alternativo del pictograma de emojis: describe las filas (sin la
/// palabra "pictograma", decisión de la usuaria).
export function pictographAlt(rows: PictographRow[]): Bilingual {
  const list = (lang: Lang) => rows.map((r) => `${r.label ? r.label[lang] : r.emoji}, ${r.count}`).join("; ");
  return { es: `Filas de dibujos: ${list("es")}.`, en: `Rows of pictures: ${list("en")}.` };
}

export async function linkBancoVisual(prisma: PrismaClient): Promise<BancoVisualReport> {
  const { entries } = loadBancoVisual();
  // Enunciados editados a propósito (registrados con su texto anterior):
  // se aceptan como coincidencia y las filas se leen del texto anterior.
  const edits = new Map(loadPromptEdits().map((e) => [e.exerciseId, e]));
  const genericLegend = GENERIC_LEGEND;
  const report: BancoVisualReport = {
    entries: entries.length,
    linked: 0,
    emojiPreferred: 0,
    emojiPictographs: 0,
    absent: [],
    promptMismatch: [],
    legends: {},
    genericReasons: {},
    byGrade: {},
  };
  const rows = await prisma.exercise.findMany({
    where: { id: { in: entries.map((e) => e.exerciseId) } },
    select: {
      id: true,
      prompt: true,
      promptEn: true,
      image: true,
      visual: true,
      mathSkill: { select: { grade: true } },
      options: { select: { id: true, label: true, labelEn: true, isCorrect: true } },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  for (const entry of entries) {
    const ex = byId.get(entry.exerciseId);
    if (!ex) {
      report.absent.push({ exerciseId: entry.exerciseId, grade: entry.grade, prompt: entry.prompt.es });
      continue;
    }
    const edit = edits.get(entry.exerciseId);
    const promptMatches =
      ex.prompt === entry.prompt.es || (edit !== undefined && ex.prompt === edit.prompt.new && entry.prompt.es === edit.prompt.old);
    if (!promptMatches || ex.mathSkill.grade !== entry.grade) {
      report.promptMismatch.push({ exerciseId: entry.exerciseId, db: ex.prompt, package: entry.prompt.es });
      continue;
    }
    // Sumas/restas/comparaciones de 1.° y 2.° con su dibujo de emojis
    // (🐒 🍎 ⚽…): ese estilo concreto se prefiere a la imagen genérica de
    // fichas del banco. La imagen se quita si ya estaba vinculada.
    if (ex.visual !== null) {
      if (ex.image !== null) await prisma.exercise.update({ where: { id: ex.id }, data: { image: Prisma.DbNull } });
      report.emojiPreferred += 1;
      continue;
    }
    // Para leer datos del enunciado (filas, nombres), el texto original.
    const source: ExerciseForLegend = edit ? { ...ex, prompt: edit.prompt.old, promptEn: edit.promptEn.old } : ex;
    const rows = entry.emojiRows ?? emojiPictograph(entry, source);
    if (rows) {
      const pictograph: EmojiPictographImage = { kind: "pictograph", source: "emoji_pictograph", rows, alt: pictographAlt(rows) };
      if (JSON.stringify(ex.image) !== JSON.stringify(pictograph)) {
        await prisma.exercise.update({ where: { id: ex.id }, data: { image: pictograph as never } });
      }
      report.emojiPictographs += 1;
      report.byGrade[entry.grade] = (report.byGrade[entry.grade] ?? 0) + 1;
      report.linked += 1;
      continue;
    }
    const legend = buildLegend(entry, source, genericLegend);
    const image = toImage(entry, ex, legend);
    const key = legend.type === "named" ? `named:${legend.source}` : legend.type;
    report.legends[key] = (report.legends[key] ?? 0) + 1;
    if (legend.type === "generic") {
      report.genericReasons[legend.reason] = (report.genericReasons[legend.reason] ?? 0) + 1;
    }
    report.byGrade[entry.grade] = (report.byGrade[entry.grade] ?? 0) + 1;
    if (JSON.stringify(ex.image) !== JSON.stringify(image)) {
      await prisma.exercise.update({ where: { id: ex.id }, data: { image: image as never } });
    }
    report.linked += 1;
  }
  return report;
}
