/// Variantes temáticas: la misma pregunta contada con el vocabulario de un
/// interés. La matemática se hereda del ejercicio base (opciones, respuesta
/// correcta, tipos de error, nivel); quien escribe una variante solo
/// reescribe la historia. Módulo puro, sin acceso a BD.
import { createHash } from "node:crypto";
import { INTEREST_KEYS } from "../../../src/domain/interests.js";
import type { SeedExercise, SkillBlock } from "../lib.js";

export interface ThemedVariant {
  grade: number;
  /// Nombre exacto del contenido (skill.name) al que pertenece el ejercicio base.
  skill: string;
  /// Enunciado base EXACTO (prompt del ejercicio neutro).
  base: string;
  prompt: string;
  promptEn: string;
  procedureNote: string;
  procedureNoteEn: string;
  /// Cambia el emoji del visual heredado (solo 1°-2°). Sin él, un visual con
  /// emoji se omite (para no mostrar 🔵 en una historia de dinosaurios).
  emoji?: string;
}

export interface ThemeFile {
  theme: string;
  variants: ThemedVariant[];
}

/// Identificador estable del problema: agrupa al base y a todas sus variantes.
export function baseKeyOf(grade: number, skill: string, basePrompt: string): string {
  return createHash("sha1").update(`${grade}|${skill}|${basePrompt}`).digest("hex").slice(0, 12);
}

/// Números del enunciado (con separadores), para comprobar que una variante no
/// cambió los datos del problema. Se comparan como multiconjunto ordenado.
export function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).sort();
}

export function extractVisual(visual: unknown, emoji: string | undefined): unknown {
  if (visual === null || visual === undefined) return null;
  if (typeof visual === "object" && "emoji" in (visual as Record<string, unknown>)) {
    return emoji ? { ...(visual as Record<string, unknown>), emoji } : null;
  }
  return visual;
}

export interface ThemedResult {
  blocks: SkillBlock[];
  problems: string[];
}

/// Agrega a cada contenido sus variantes temáticas (después de los ejercicios
/// base) y marca con `baseKey` al base y a sus variantes. Devuelve además la
/// lista de problemas (base inexistente, números distintos, prompt repetido…);
/// quien siembra debe abortar si hay alguno.
export function withThemes(blocks: SkillBlock[], files: ThemeFile[]): ThemedResult {
  const problems: string[] = [];
  const out: SkillBlock[] = blocks.map((b) => ({ skill: b.skill, exercises: b.exercises.map((e) => ({ ...e })) }));
  const seenKeys = new Set<string>();

  for (const file of files) {
    if (!(INTEREST_KEYS as readonly string[]).includes(file.theme)) {
      problems.push(`tema desconocido "${file.theme}"`);
      continue;
    }
    for (const v of file.variants) {
      const at = `[${file.theme} ${v.grade}° ${v.skill}] "${v.base.slice(0, 40)}…"`;
      const target = out.find((b) => b.skill.grade === v.grade && b.skill.name === v.skill);
      if (!target) {
        problems.push(`${at} contenido inexistente`);
        continue;
      }
      const base = target.exercises.find((e) => e.prompt === v.base && e.theme === undefined);
      if (!base) {
        problems.push(`${at} el enunciado base no existe (debe copiarse exacto del ejercicio neutro)`);
        continue;
      }
      const key = baseKeyOf(v.grade, v.skill, v.base);
      if (seenKeys.has(`${file.theme}|${key}`)) {
        problems.push(`${at} ya hay una variante de ${file.theme} para este base`);
        continue;
      }
      seenKeys.add(`${file.theme}|${key}`);

      for (const f of ["prompt", "promptEn", "procedureNote", "procedureNoteEn"] as const) {
        if (!v[f] || !v[f].trim()) problems.push(`${at} ${f} vacío`);
      }
      if (target.exercises.some((e) => e.prompt === v.prompt)) {
        problems.push(`${at} el prompt ya existe en el contenido (igual al base u otra variante)`);
        continue;
      }
      if (numbersIn(v.prompt).join("|") !== numbersIn(base.prompt).join("|")) {
        problems.push(`${at} los números del enunciado cambiaron: base [${numbersIn(base.prompt)}] vs variante [${numbersIn(v.prompt)}]`);
      }
      if (numbersIn(v.promptEn).join("|") !== numbersIn(base.promptEn).join("|")) {
        problems.push(`${at} los números de promptEn cambiaron: base [${numbersIn(base.promptEn)}] vs variante [${numbersIn(v.promptEn)}]`);
      }
      const correct = base.options.find((o) => o.isCorrect)!.label.trim();
      const token = new RegExp(`(?<![\\p{L}\\p{N},.])${correct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u");
      if (token.test(v.procedureNote) || token.test(v.procedureNoteEn)) {
        problems.push(`${at} la pista revela la respuesta correcta "${correct}"`);
      }

      base.baseKey = key;
      const variant: SeedExercise = {
        prompt: v.prompt,
        promptEn: v.promptEn,
        procedureNote: v.procedureNote,
        procedureNoteEn: v.procedureNoteEn,
        difficultyLevel: base.difficultyLevel,
        visual: extractVisual(base.visual, v.emoji),
        theme: file.theme,
        baseKey: key,
        options: base.options.map((o) => ({ ...o })),
      };
      target.exercises.push(variant);
    }
  }
  return { blocks: out, problems };
}
