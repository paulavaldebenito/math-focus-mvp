/**
 * Inglés de aula: correcciones del inglés de enunciados (`Exercise.promptEn`),
 * pistas (`procedureNoteEn`) y del mapa (`MathSkill.axisEn` / `nameEn`) al
 * vocabulario escolar de EE. UU. (pictograph, bar graph, pie chart, soccer,
 * "What is 6 + 7?", ortografía US…) — ver ingles_de_aula.json y
 * specs/008-banco-imagenes-por-curso/ingles_de_aula.md.
 *
 * Nunca toca el español, ids, alternativas, respuestas ni progreso. Cada
 * cambio trae el texto anterior (`old`) y solo se escribe si la BD todavía
 * tiene EXACTAMENTE ese texto; si ya tiene el nuevo, no hace nada
 * (idempotente); si tiene otro distinto, lo señala y no escribe. Las
 * fuentes (grade*.ts, themes/*.ts) ya traen el texto nuevo, así que en una
 * BD sembrada desde cero todo queda "ya aplicado".
 *
 * Correspondencia: ejercicio por id; si no existe (BD sembrada desde cero),
 * por enunciado en español único dentro del curso. Habilidad por curso y
 * nombre en español.
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

export interface TextChange {
  /** Texto anterior aceptado — o varios, si el texto pasó por más de una
   * corrección (p. ej. inglés de aula y luego montos en pesos): una BD en
   * cualquiera de esos estados queda al día. */
  old: string | string[];
  new: string;
}

export interface ExerciseEnglishChange {
  exerciseId: string;
  grade: number;
  prompt: string;
  promptEn?: TextChange;
  procedureNoteEn?: TextChange;
}

export interface SkillEnglishChange {
  grade: number;
  name: string;
  axisEn?: TextChange;
  nameEn?: TextChange;
}

export interface ClassroomEnglishFile {
  habilidades: SkillEnglishChange[];
  ejercicios: ExerciseEnglishChange[];
}

export interface ClassroomEnglishReport {
  exercisesMatched: number;
  skillsMatched: number;
  fieldsWritten: number;
  alreadyApplied: number;
  problems: string[];
}

export function loadClassroomEnglish(): ClassroomEnglishFile {
  return JSON.parse(readFileSync(new URL("./ingles_de_aula.json", import.meta.url), "utf8")) as ClassroomEnglishFile;
}

export type Decision = "write" | "already" | "conflict";

/// Puro: qué hacer con un campo dado su valor actual en la BD.
export function decide(current: string | null, change: TextChange): Decision {
  if (current === change.new) return "already";
  const olds = Array.isArray(change.old) ? change.old : [change.old];
  if (current !== null && olds.includes(current)) return "write";
  return "conflict";
}

export async function applyClassroomEnglish(prisma: PrismaClient): Promise<ClassroomEnglishReport> {
  const data = loadClassroomEnglish();
  const report: ClassroomEnglishReport = {
    exercisesMatched: 0,
    skillsMatched: 0,
    fieldsWritten: 0,
    alreadyApplied: 0,
    problems: [],
  };

  for (const s of data.habilidades) {
    const skills = await prisma.mathSkill.findMany({ where: { grade: s.grade, name: s.name } });
    if (skills.length !== 1) {
      report.problems.push(`habilidad ${s.grade}° "${s.name}": ${skills.length} coincidencias`);
      continue;
    }
    const skill = skills[0]!;
    report.skillsMatched += 1;
    const update: { axisEn?: string; nameEn?: string } = {};
    for (const field of ["axisEn", "nameEn"] as const) {
      const change = s[field];
      if (!change) continue;
      const d = decide(skill[field], change);
      if (d === "write") update[field] = change.new;
      else if (d === "already") report.alreadyApplied += 1;
      else report.problems.push(`habilidad ${s.grade}° "${s.name}": ${field} distinto del esperado, no se corrige`);
    }
    if (Object.keys(update).length > 0) {
      await prisma.mathSkill.update({ where: { id: skill.id }, data: update });
      report.fieldsWritten += Object.keys(update).length;
    }
  }

  for (const e of data.ejercicios) {
    let exercise = await prisma.exercise.findUnique({
      where: { id: e.exerciseId },
      select: { id: true, prompt: true, promptEn: true, procedureNoteEn: true },
    });
    if (!exercise || exercise.prompt !== e.prompt) {
      const candidates = await prisma.exercise.findMany({
        where: { prompt: e.prompt, mathSkill: { grade: e.grade } },
        select: { id: true, prompt: true, promptEn: true, procedureNoteEn: true },
      });
      if (candidates.length !== 1) {
        report.problems.push(`${e.exerciseId}: ${candidates.length} ejercicios con el mismo enunciado`);
        continue;
      }
      exercise = candidates[0]!;
    }
    report.exercisesMatched += 1;
    const update: { promptEn?: string; procedureNoteEn?: string } = {};
    for (const field of ["promptEn", "procedureNoteEn"] as const) {
      const change = e[field];
      if (!change) continue;
      const d = decide(exercise[field], change);
      if (d === "write") update[field] = change.new;
      else if (d === "already") report.alreadyApplied += 1;
      else report.problems.push(`${e.exerciseId}: ${field} distinto del esperado, no se corrige`);
    }
    if (Object.keys(update).length > 0) {
      await prisma.exercise.update({ where: { id: exercise.id }, data: update });
      report.fieldsWritten += Object.keys(update).length;
    }
  }
  return report;
}
