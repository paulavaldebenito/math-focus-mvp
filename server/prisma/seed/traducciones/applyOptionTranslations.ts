/**
 * Traducciones al inglés de alternativas textuales (colores, figuras,
 * tiempo, reglas de patrones, cociente y resto) de los 108 ejercicios que
 * el paquete de revisión señaló en revision_bilingue.json — ver
 * alternativas_en.json. Solo escribe `ExerciseOption.labelEn`: nunca cambia
 * `label`, el orden, `isCorrect` ni el tipo de error, y las alternativas
 * numéricas (labelEn: null) se dejan como están.
 *
 * Ampliado con 192 ejercicios más (alternativas_pendientes_fuera_de_los_108:
 * horas, "No se puede saber", números en palabras, cuerpos geométricos,
 * comparaciones, etc.). En 5 de ellos el `promptEn` pedía leer el número
 * "in Spanish"; como ahora las alternativas se muestran en inglés, la
 * entrada trae `replacesPromptEn` (texto anterior) y se corrige `promptEn`
 * solo si la BD todavía tiene exactamente ese texto anterior.
 *
 * Ampliado con el pase de inglés de aula (ver ingles_de_aula.json y
 * specs/008-banco-imagenes-por-curso/ingles_de_aula.md): alternativas
 * numéricas con formato chileno ("1.200 m", "2,5", "12 y 13") reciben un
 * `labelEn` con formato de EE. UU. ("1,200 m", "2.5", "12 and 13") — mismo
 * número, solo cambia cómo se escribe — y "Fútbol" pasa a "Soccer".
 *
 * Correspondencia: por id de ejercicio y de alternativa; si el ejercicio no
 * existe con ese id (BD sembrada desde cero), por enunciado único y luego
 * por `label` dentro del ejercicio. Se exige que `label` e `isCorrect`
 * coincidan con la BD — si no, se señala y no se escribe nada.
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

export interface OptionTranslationEntry {
  exerciseId: string;
  grade: number;
  prompt: string;
  promptEn: string | null;
  /** Si está presente, `promptEn` reemplaza a este texto (y solo a este). */
  replacesPromptEn?: string;
  options: Array<{ id: string; label: string; labelEn: string | null; isCorrect: boolean }>;
}

export interface TranslationReport {
  exercisesMatched: number;
  optionsWritten: number;
  promptsWritten: number;
  problems: string[];
}

export function loadOptionTranslations(): OptionTranslationEntry[] {
  return JSON.parse(
    readFileSync(new URL("./alternativas_en.json", import.meta.url), "utf8"),
  ) as OptionTranslationEntry[];
}

export async function applyOptionTranslations(prisma: PrismaClient): Promise<TranslationReport> {
  const report: TranslationReport = { exercisesMatched: 0, optionsWritten: 0, promptsWritten: 0, problems: [] };

  for (const entry of loadOptionTranslations()) {
    let exercise = await prisma.exercise.findUnique({ where: { id: entry.exerciseId }, include: { options: true } });
    if (!exercise) {
      const candidates = await prisma.exercise.findMany({
        where: { prompt: entry.prompt, mathSkill: { grade: entry.grade } },
        include: { options: true },
      });
      if (candidates.length !== 1) {
        report.problems.push(`${entry.exerciseId}: ${candidates.length} ejercicios con el mismo enunciado`);
        continue;
      }
      exercise = candidates[0]!;
    }
    report.exercisesMatched += 1;

    if (entry.replacesPromptEn && entry.promptEn && exercise.promptEn !== entry.promptEn) {
      if (exercise.promptEn === entry.replacesPromptEn) {
        await prisma.exercise.update({ where: { id: exercise.id }, data: { promptEn: entry.promptEn } });
        report.promptsWritten += 1;
      } else {
        report.problems.push(`${entry.exerciseId}: promptEn distinto del esperado, no se corrige`);
      }
    }

    for (const t of entry.options) {
      const byId = exercise.options.find((o) => o.id === t.id);
      const byLabel = exercise.options.filter((o) => o.label === t.label);
      const option = byId ?? (byLabel.length === 1 ? byLabel[0] : undefined);
      if (!option || option.label !== t.label || option.isCorrect !== t.isCorrect) {
        report.problems.push(`${entry.exerciseId}: alternativa "${t.label}" no coincide con la BD`);
        continue;
      }
      if (t.labelEn === null || option.labelEn === t.labelEn) continue;
      await prisma.exerciseOption.update({ where: { id: option.id }, data: { labelEn: t.labelEn } });
      report.optionsWritten += 1;
    }
  }
  return report;
}
