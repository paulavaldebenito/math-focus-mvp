/**
 * Correcciones de alternativas de la revisión pedagógica (2026-10-22): ver
 * correcciones_alternativas.json. Cada entrada nombra un ejercicio base por id
 * y se aplica a él y a todas sus variantes temáticas (mismo `baseKey`), que
 * copian sus alternativas — por eso las alternativas se buscan por texto, no
 * por id. Tres operaciones:
 *
 * - `recode`: cambia el tipo de error de una alternativa incorrecta (la
 *   taxonomía unificada: p. ej. contar marcas en vez de saltos → E1_OP).
 * - `relabel`: reemplaza una alternativa poco plausible por un error real
 *   (texto y, si se da, tipo de error). Los intentos ya hechos siguen
 *   apuntando a la misma fila.
 * - `add`: agrega alternativas a preguntas que tenían 2 o 3 (con 2, adivinar
 *   da 50 %). El id es fijo y se deriva del ejercicio y del texto, para que
 *   la BD de desarrollo y una vacía terminen iguales.
 *
 * Además, por familia: `hint` (pista que delataba la respuesta o era difícil
 * de leer; la EN sigue a la ES) y `level` (nivel de dificultad mal puesto).
 *
 * Mismo contrato que applyPromptEdits: escribe solo si la BD tiene lo
 * esperado (`from`); si ya tiene lo nuevo no hace nada; si tiene otra cosa,
 * lo informa y no lo pisa. Nunca cambia cuál es la correcta.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

export interface OptionCorrection {
  exerciseId: string;
  /** Enunciado del ejercicio base, solo para que el JSON se lea solo. */
  prompt: string;
  recode?: Array<{ label: string; from: string | null; to: string }>;
  relabel?: Array<{ from: string; to: string; toEn?: string | null; code?: string }>;
  add?: Array<{ label: string; labelEn?: string | null; code: string }>;
  hint?: { old: string; new: string; oldEn: string; newEn: string };
  level?: { from: number; to: number };
}

export function loadOptionCorrections(): OptionCorrection[] {
  return JSON.parse(readFileSync(new URL("./correcciones_alternativas.json", import.meta.url), "utf8")) as OptionCorrection[];
}

/** Id fijo de una alternativa agregada por corrección. */
export const addedOptionId = (exerciseId: string, label: string) =>
  "opc" + createHash("sha1").update(`${exerciseId}|${label}`).digest("hex").slice(0, 22);

export async function applyOptionCorrections(
  prisma: PrismaClient,
): Promise<{ written: number; already: number; problems: string[] }> {
  const report = { written: 0, already: 0, problems: [] as string[] };
  const errorTypeByCode = Object.fromEntries((await prisma.errorType.findMany()).map((e) => [e.code, e.id]));
  const codeOf = (code: string) => {
    const id = errorTypeByCode[code];
    if (!id) throw new Error(`tipo de error desconocido: ${code}`);
    return id;
  };
  for (const c of loadOptionCorrections()) {
    const base = await prisma.exercise.findUnique({ where: { id: c.exerciseId }, select: { baseKey: true } });
    if (!base) {
      report.problems.push(`${c.exerciseId}: no existe (corrección de alternativas)`);
      continue;
    }
    const family = await prisma.exercise.findMany({
      where: base.baseKey ? { OR: [{ id: c.exerciseId }, { baseKey: base.baseKey }] } : { id: c.exerciseId },
      include: { options: { include: { errorType: true } } },
    });
    for (const ex of family) {
      if (c.hint) {
        // Las variantes temáticas pueden tener su propia pista: solo se cambia la que es igual a la del base.
        // El inglés sigue al español: si la pista ES es la anterior o la nueva, la EN queda la nueva
        // (la EN anterior puede venir de la fuente o del inglés de aula).
        if (ex.procedureNote === c.hint.old || ex.procedureNote === c.hint.new) {
          if (ex.procedureNote === c.hint.new && ex.procedureNoteEn === c.hint.newEn) report.already += 1;
          else {
            await prisma.exercise.update({ where: { id: ex.id }, data: { procedureNote: c.hint.new, procedureNoteEn: c.hint.newEn } });
            report.written += 1;
          }
        }
      }
      if (c.level) {
        if (ex.difficultyLevel === c.level.from) {
          await prisma.exercise.update({ where: { id: ex.id }, data: { difficultyLevel: c.level.to } });
          report.written += 1;
        } else if (ex.difficultyLevel === c.level.to) report.already += 1;
        else report.problems.push(`${ex.id}: nivel ${ex.difficultyLevel}, se esperaba ${c.level.from}`);
      }
      const byLabel = (l: string) => ex.options.find((o) => o.label === l);
      for (const r of c.relabel ?? []) {
        const now = byLabel(r.to);
        if (now && !now.isCorrect) {
          report.already += 1;
          continue;
        }
        const opt = byLabel(r.from);
        if (!opt || opt.isCorrect) {
          report.problems.push(`${ex.id}: alternativa "${r.from}" no encontrada (corrección)`);
          continue;
        }
        await prisma.exerciseOption.update({
          where: { id: opt.id },
          data: {
            label: r.to,
            labelEn: r.toEn ?? null,
            feedback: null,
            feedbackEn: null,
            ...(r.code ? { errorTypeId: codeOf(r.code) } : {}),
          },
        });
        opt.label = r.to;
        report.written += 1;
      }
      for (const r of c.recode ?? []) {
        const opt = byLabel(r.label);
        if (!opt || opt.isCorrect) {
          report.problems.push(`${ex.id}: alternativa "${r.label}" no encontrada (recodificación)`);
          continue;
        }
        const cur = opt.errorType?.code ?? null;
        if (cur === r.to) report.already += 1;
        else if (cur === r.from) {
          await prisma.exerciseOption.update({ where: { id: opt.id }, data: { errorTypeId: codeOf(r.to) } });
          report.written += 1;
        } else report.problems.push(`${ex.id}: "${r.label}" tiene ${cur}, se esperaba ${r.from} (recodificación)`);
      }
      for (const a of c.add ?? []) {
        if (byLabel(a.label)) {
          report.already += 1;
          continue;
        }
        await prisma.exerciseOption.create({
          data: {
            id: addedOptionId(ex.id, a.label),
            exerciseId: ex.id,
            label: a.label,
            labelEn: a.labelEn ?? null,
            isCorrect: false,
            errorTypeId: codeOf(a.code),
          },
        });
        report.written += 1;
      }
    }
  }
  return report;
}
