/**
 * Vincula las ilustraciones SVG del banco de imágenes por curso
 * (indice_imagenes.json, 798 ejercicios × 2 idiomas) con los ejercicios de
 * la BD. Idempotente: solo escribe `Exercise.image`, nunca toca ids,
 * alternativas, intentos ni progreso.
 *
 * Correspondencia: primero por id (el índice se exportó de esta misma BD),
 * verificando curso, habilidad, tema, baseKey y enunciado. Si el id no
 * existe (p. ej. una BD sembrada desde cero, con otros cuid), se busca una
 * correspondencia ÚNICA por esos mismos cinco campos. Todo lo demás
 * (id con datos distintos, cero o varios candidatos) queda señalado y NO se
 * vincula — mejor sin imagen que con la de otro ejercicio.
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

type Lang = "es" | "en";

export interface ImageIndexEntry {
  exerciseId: string;
  grade: number;
  skillName: string;
  theme: string | null;
  baseKey: string | null;
  prompt: string;
  kind: string;
  size: Record<Lang, { width: number; height: number }>;
  src: Record<Lang, string>;
  alt: Record<Lang, string>;
}

/// Forma persistida en Exercise.image (y enviada tal cual al cliente).
export interface ExerciseImage {
  kind: string;
  size: Record<Lang, { width: number; height: number }>;
  src: Record<Lang, string>;
  alt: Record<Lang, string>;
}

export interface ExerciseForMatch {
  id: string;
  grade: number;
  skillName: string;
  theme: string | null;
  baseKey: string | null;
  prompt: string;
}

export type MatchResult =
  | { status: "by_id"; entry: ImageIndexEntry; exerciseId: string }
  | { status: "by_content"; entry: ImageIndexEntry; exerciseId: string }
  | { status: "id_mismatch"; entry: ImageIndexEntry; fields: string[] }
  | { status: "ambiguous"; entry: ImageIndexEntry; candidates: string[] }
  | { status: "not_found"; entry: ImageIndexEntry };

export function loadImageIndex(): ImageIndexEntry[] {
  return JSON.parse(readFileSync(new URL("./indice_imagenes.json", import.meta.url), "utf8")) as ImageIndexEntry[];
}

export function toExerciseImage(entry: ImageIndexEntry): ExerciseImage {
  return { kind: entry.kind, size: entry.size, src: entry.src, alt: entry.alt };
}

function contentKey(e: Pick<ExerciseForMatch, "grade" | "skillName" | "theme" | "baseKey" | "prompt">): string {
  return JSON.stringify([e.grade, e.skillName, e.theme, e.baseKey, e.prompt]);
}

function mismatchedFields(entry: ImageIndexEntry, ex: ExerciseForMatch): string[] {
  const fields: string[] = [];
  if (entry.grade !== ex.grade) fields.push("grade");
  if (entry.skillName !== ex.skillName) fields.push("skill");
  if (entry.theme !== ex.theme) fields.push("theme");
  if (entry.baseKey !== ex.baseKey) fields.push("baseKey");
  if (entry.prompt !== ex.prompt) fields.push("prompt");
  return fields;
}

/// Puro (sin BD): decide a qué ejercicio corresponde cada entrada del índice.
export function matchImages(entries: ImageIndexEntry[], exercises: ExerciseForMatch[]): MatchResult[] {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const byContent = new Map<string, string[]>();
  for (const e of exercises) {
    const k = contentKey(e);
    byContent.set(k, [...(byContent.get(k) ?? []), e.id]);
  }

  return entries.map((entry): MatchResult => {
    const ex = byId.get(entry.exerciseId);
    if (ex) {
      const fields = mismatchedFields(entry, ex);
      return fields.length === 0
        ? { status: "by_id", entry, exerciseId: ex.id }
        : { status: "id_mismatch", entry, fields };
    }
    const candidates = byContent.get(contentKey(entry)) ?? [];
    if (candidates.length === 1) return { status: "by_content", entry, exerciseId: candidates[0]! };
    if (candidates.length > 1) return { status: "ambiguous", entry, candidates };
    return { status: "not_found", entry };
  });
}

/// Aplica el índice a la BD. Devuelve el detalle para el reporte.
/// `skipIds`: ejercicios cuya imagen viene de otra fuente (banco visual
/// completo) — no se reescriben con la ilustración anterior.
export async function linkImages(prisma: PrismaClient, skipIds: ReadonlySet<string> = new Set()): Promise<MatchResult[]> {
  const rows = await prisma.exercise.findMany({
    select: { id: true, prompt: true, theme: true, baseKey: true, mathSkill: { select: { grade: true, name: true } } },
  });
  const exercises: ExerciseForMatch[] = rows.map((r) => ({
    id: r.id,
    grade: r.mathSkill.grade,
    skillName: r.mathSkill.name,
    theme: r.theme,
    baseKey: r.baseKey,
    prompt: r.prompt,
  }));

  const results = matchImages(loadImageIndex(), exercises);
  for (const r of results) {
    if ((r.status === "by_id" || r.status === "by_content") && !skipIds.has(r.exerciseId)) {
      await prisma.exercise.update({ where: { id: r.exerciseId }, data: { image: toExerciseImage(r.entry) as never } });
    }
  }
  return results;
}
