/**
 * Feedback propio por alternativa (`ExerciseOption.feedback` / `feedbackEn`):
 * ver feedback_por_alternativa.json. Reemplaza, solo para esa alternativa,
 * al mensaje genérico del tipo de error (ERROR_FEEDBACK en el cliente) o a
 * la variante genérica de acierto — p. ej. "Leo, 2/4" recibía "piensa qué
 * necesitas hacer con estos números", que no orienta en una comparación de
 * fracciones (2026-10-20).
 *
 * Alternativa por id; antes de escribir verifica que siga perteneciendo al
 * mismo ejercicio y con el mismo texto (si no, lo informa y no escribe).
 * Idempotente: solo escribe lo que difiere. Nunca toca isCorrect, el tipo
 * de error ni el texto de la alternativa.
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

export interface OptionFeedback {
  exerciseId: string;
  optionId: string;
  /** Texto de la alternativa (solo para verificar que es la esperada). */
  label: string;
  feedback: string;
  feedbackEn: string;
}

export function loadOptionFeedback(): OptionFeedback[] {
  return JSON.parse(readFileSync(new URL("./feedback_por_alternativa.json", import.meta.url), "utf8")) as OptionFeedback[];
}

export async function applyOptionFeedback(
  prisma: PrismaClient,
): Promise<{ written: number; already: number; problems: string[] }> {
  const report = { written: 0, already: 0, problems: [] as string[] };
  for (const f of loadOptionFeedback()) {
    const option = await prisma.exerciseOption.findUnique({ where: { id: f.optionId } });
    if (!option || option.exerciseId !== f.exerciseId || option.label !== f.label) {
      report.problems.push(`${f.optionId}: alternativa "${f.label}" no encontrada en ${f.exerciseId} (feedback)`);
      continue;
    }
    if (option.feedback === f.feedback && option.feedbackEn === f.feedbackEn) {
      report.already += 1;
      continue;
    }
    await prisma.exerciseOption.update({ where: { id: f.optionId }, data: { feedback: f.feedback, feedbackEn: f.feedbackEn } });
    report.written += 1;
  }
  return report;
}
