/**
 * Desarrollo paso a paso (specs/015): `Exercise.solution` y, por alternativa
 * incorrecta, `ExerciseOption.wrongStep` — ver pasos_resueltos.json (piloto:
 * fracciones 3°–6° y porcentajes 6°). Un problema base sirve a todas sus
 * variantes por interés (mismo `baseKey`, mismos números): los pasos no
 * nombran la historia. `key` es el baseKey o, sin variantes, el id del
 * ejercicio. Las alternativas se emparejan por su texto normalizado (sin "$"
 * ni "monedas"), porque las variantes pueden escribir la unidad distinto.
 *
 * Idempotente: solo escribe lo que difiere. Si una alternativa incorrecta de
 * un ejercicio no tiene su paso, lo informa (el panel de revisión lo
 * mostraría incompleto).
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

type Bi = { es: string; en: string };
export interface WorkedSteps {
  key: string;
  oa: string;
  prompt: string;
  steps: Bi[];
  wrong: Record<string, { step: number } & Bi>;
}

export function loadWorkedSteps(): WorkedSteps[] {
  return JSON.parse(readFileSync(new URL("./pasos_resueltos.json", import.meta.url), "utf8")) as WorkedSteps[];
}

export const normalizeLabel = (l: string) =>
  l
    .replace(/\$/g, "")
    .replace(/\s*(monedas|coins)$/i, "")
    .trim();

export async function applyWorkedSteps(prisma: PrismaClient): Promise<{ exercises: number; written: number; problems: string[] }> {
  const report = { exercises: 0, written: 0, problems: [] as string[] };
  for (const w of loadWorkedSteps()) {
    const exercises = await prisma.exercise.findMany({
      where: { OR: [{ baseKey: w.key }, { id: w.key }] },
      include: { options: true },
    });
    if (exercises.length === 0) {
      report.problems.push(`pasos: no hay ejercicios para ${w.key} ("${w.prompt.slice(0, 50)}")`);
      continue;
    }
    const wrong = new Map(Object.entries(w.wrong).map(([label, v]) => [normalizeLabel(label), v]));
    for (const ex of exercises) {
      report.exercises += 1;
      if (JSON.stringify(ex.solution) !== JSON.stringify(w.steps)) {
        await prisma.exercise.update({ where: { id: ex.id }, data: { solution: w.steps } });
        report.written += 1;
      }
      for (const o of ex.options.filter((x) => !x.isCorrect)) {
        const ws = wrong.get(normalizeLabel(o.label));
        if (!ws) {
          report.problems.push(`pasos: ${ex.id} alternativa "${o.label}" sin paso equivocado`);
          continue;
        }
        if (JSON.stringify(o.wrongStep) !== JSON.stringify(ws)) {
          await prisma.exerciseOption.update({ where: { id: o.id }, data: { wrongStep: ws } });
          report.written += 1;
        }
      }
    }
  }
  return report;
}
