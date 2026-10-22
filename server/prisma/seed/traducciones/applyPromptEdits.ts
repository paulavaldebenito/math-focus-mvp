/**
 * Ediciones de enunciados aprobadas por la usuaria (no traducciones): ver
 * enunciados_editados.json. Hoy: los 62 pictogramas de 1.° básico que se
 * muestran con filas de emojis — el enunciado ya no dice "pictograma" ni
 * repite las filas de emojis en el texto; empieza con "Mira los dibujos."
 * y conserva la pregunta, los datos y la respuesta (2026-09-30). Y el de
 * Marta y Luis de 3.° (fracciones, dinosaurios): habla de "franjas del
 * mismo ancho" para calzar con el dibujo del dinosaurio (2026-10-20). Y
 * los 8 de "Ema usa 3 partes y Leo usa 2" de 3.°: sumaban 5 partes de una
 * cinta de 4; ahora son dos cintas (u otro material) iguales, como ya
 * mostraba la imagen de dos barras (2026-10-20). Después, para calzar con
 * MA03 OA11 ("fracciones de un mismo todo"), las 9 versiones de Ema y Leo
 * pasaron a UN todo con Ema 3 partes y Leo 1 — de ahí la edición de la
 * alternativa "Leo, 2/4" → "Leo, 1/4" (2026-10-20).
 *
 * Mismo contrato que applyClassroomEnglish: solo escribe si la BD tiene
 * EXACTAMENTE el texto anterior; si ya tiene el nuevo no hace nada; si
 * tiene otro, lo informa y no lo pisa. Ids, alternativas y respuestas no
 * cambian. El texto anterior queda registrado: de ahí se leen las filas
 * (emoji, cantidad y nombre) que dibuja el pictograma.
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

export interface PromptEdit {
  exerciseId: string;
  grade: number;
  prompt: { old: string; new: string };
  promptEn: { old: string; new: string };
  /** Pistas editadas junto al enunciado (p. ej. "del pictograma"). */
  procedureNote?: { old: string; new: string };
  procedureNoteEn?: { old: string; new: string };
  /** Texto de alternativas que cambia junto con el enunciado (p. ej. Leo
   * pasa de 2 a 1 parte: "Leo, 2/4" → "Leo, 1/4"). Por id de alternativa;
   * nunca cambia cuál es la correcta ni su tipo de error. */
  options?: Array<{ optionId: string; label: { old: string; new: string } }>;
}

export function loadPromptEdits(): PromptEdit[] {
  return JSON.parse(readFileSync(new URL("./enunciados_editados.json", import.meta.url), "utf8")) as PromptEdit[];
}

export async function applyPromptEdits(
  prisma: PrismaClient,
): Promise<{ written: number; already: number; problems: string[] }> {
  const report = { written: 0, already: 0, problems: [] as string[] };
  for (const e of loadPromptEdits()) {
    const ex = await prisma.exercise.findUnique({
      where: { id: e.exerciseId },
      select: { prompt: true, promptEn: true, procedureNote: true, procedureNoteEn: true },
    });
    if (!ex) {
      report.problems.push(`${e.exerciseId}: no existe (edición de enunciado)`);
      continue;
    }
    const data: { prompt?: string; promptEn?: string; procedureNote?: string; procedureNoteEn?: string } = {};
    const esOf = { promptEn: "prompt", procedureNoteEn: "procedureNote" } as const;
    for (const field of ["prompt", "promptEn", "procedureNote", "procedureNoteEn"] as const) {
      const change = e[field];
      if (!change) continue;
      const cur = ex[field];
      if (cur === change.new) report.already += 1;
      else if (cur === change.old) data[field] = change.new;
      else if (field in esOf) {
        // El inglés sigue al español: si el campo ES de esta edición está en su texto anterior o en el
        // nuevo, la EN queda la nueva aunque la anterior venga del inglés de aula (BD existentes).
        const es = esOf[field as keyof typeof esOf];
        const esChange = e[es];
        if (esChange && (ex[es] === esChange.old || ex[es] === esChange.new)) data[field] = change.new;
        else report.problems.push(`${e.exerciseId}: ${field} distinto del esperado, no se edita`);
      } else report.problems.push(`${e.exerciseId}: ${field} distinto del esperado, no se edita`);
    }
    if (Object.keys(data).length > 0) {
      await prisma.exercise.update({ where: { id: e.exerciseId }, data });
      report.written += Object.keys(data).length;
    }
    for (const o of e.options ?? []) {
      const opt = await prisma.exerciseOption.findUnique({ where: { id: o.optionId }, select: { exerciseId: true, label: true } });
      if (!opt || opt.exerciseId !== e.exerciseId) report.problems.push(`${o.optionId}: alternativa no encontrada en ${e.exerciseId}`);
      else if (opt.label === o.label.new) report.already += 1;
      else if (opt.label === o.label.old) {
        await prisma.exerciseOption.update({ where: { id: o.optionId }, data: { label: o.label.new } });
        report.written += 1;
      } else report.problems.push(`${o.optionId}: alternativa "${opt.label}" distinta de la esperada, no se edita`);
    }
  }
  return report;
}
