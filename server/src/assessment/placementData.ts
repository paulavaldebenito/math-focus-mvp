import { prisma } from "../db/prisma.js";
import { NUMBERS_AXIS, PREREQUISITES } from "../domain/prerequisites.js";
import { SKILL_COMPLETE_THRESHOLD } from "../skillPath/skillPath.js";
import type { PlacementSkill } from "./placement.js";

/**
 * Lectura de la ubicación de un niño para el mapa, el espacio familia y el panel docente
 * (specs/020-ubicacion-adaptativa). El Repaso son las habilidades «reforzar» de cursos anteriores;
 * cada una se supera al completarla practicando (los mismos aciertos que un nodo del mapa).
 */
type CatalogSkill = PlacementSkill & { name: string; nameEn: string | null; axis: string };
// El catálogo de habilidades es fijo mientras corre el servidor (cambia solo con un seed): se lee una vez.
let catalog: Promise<CatalogSkill[]> | null = null;

export function loadPlacementSkills(): Promise<CatalogSkill[]> {
  catalog ??= prisma.mathSkill
    .findMany({
      where: { axis: NUMBERS_AXIS, oaCode: { in: Object.keys(PREREQUISITES) } },
      select: { id: true, grade: true, order: true, oaCode: true, name: true, nameEn: true, axis: true },
    })
    .then((skills) => {
      // Si la BD aún no tiene habilidades (p. ej., antes del seed), se vuelve a leer la próxima vez.
      if (skills.length === 0) catalog = null;
      return skills;
    })
    .catch((err: unknown) => {
      catalog = null;
      throw err;
    });
  return catalog;
}

/// Aciertos de práctica por habilidad, contados desde que se marcó para reforzar: lo que acertó antes
/// de que la evaluación (o la práctica) detectara el vacío no cuenta para superarlo.
async function correctSince(childId: string, since: ReadonlyMap<string, Date>): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (since.size === 0) return counts;
  const oldest = new Date(Math.min(...[...since.values()].map((d) => d.getTime())));
  const rows = await prisma.attempt.findMany({
    where: { isCorrect: true, createdAt: { gte: oldest }, session: { childProfileId: childId, kind: "practica" }, exercise: { mathSkillId: { in: [...since.keys()] } } },
    select: { createdAt: true, exercise: { select: { mathSkillId: true } } },
  });
  for (const a of rows) {
    const from = since.get(a.exercise.mathSkillId);
    if (from && a.createdAt >= from) counts[a.exercise.mathSkillId] = (counts[a.exercise.mathSkillId] ?? 0) + 1;
  }
  return counts;
}

export interface ReviewNode {
  id: string;
  grade: number;
  name: string;
  nameEn: string | null;
  oaCode: string | null;
  status: "locked" | "available" | "completed";
  correctCount: number;
}

export interface ChildReview {
  /** Repaso de cursos anteriores, de la base más básica a la más avanzada. */
  nodes: ReviewNode[];
  /** Habilidades (de cualquier curso) que esperan una base del repaso aún no superada. */
  waitingOnReview: string[];
  /** Fecha de la última evaluación de ubicación; null si nunca la hizo. */
  placedAt: Date | null;
}

export async function loadChildReview(childId: string, grade: number): Promise<ChildReview> {
  // Consultas en serie: `prisma dev` (desarrollo local) no tolera bien varias a la vez.
  const skills = await loadPlacementSkills();
  const placements = await prisma.skillPlacement.findMany({ where: { childProfileId: childId, status: "reforzar" } });
  // Fecha de la última ubicación: la de lo que escribió (una evaluación abandonada no cuenta).
  const lastPlacement = await prisma.skillPlacement.findFirst({
    where: { childProfileId: childId, source: "ubicacion" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const byId = new Map(skills.map((s) => [s.id, s]));
  const byOa = new Map(skills.map((s) => [s.oaCode!, s]));
  const reviewSkills = placements
    .map((p) => byId.get(p.mathSkillId))
    .filter((s): s is NonNullable<typeof s> => Boolean(s && s.grade < grade))
    .sort((a, b) => a.grade - b.grade || a.order - b.order);

  const markedAt = new Map(placements.map((p) => [p.mathSkillId, p.createdAt]));
  const counts = await correctSince(childId, new Map(reviewSkills.map((s) => [s.id, markedAt.get(s.id)!])));

  const pending = new Set(reviewSkills.filter((s) => (counts[s.id] ?? 0) < SKILL_COMPLETE_THRESHOLD).map((s) => s.id));
  const prereqIds = (oa: string | null) => (PREREQUISITES[oa ?? ""] ?? []).flatMap((p) => (byOa.has(p.oa) ? [byOa.get(p.oa)!.id] : []));
  // ¿Depende (directa o indirectamente) de una base del repaso aún no superada?
  const memo = new Map<string, boolean>();
  const waits = (id: string): boolean => {
    if (memo.has(id)) return memo.get(id)!;
    memo.set(id, false);
    const result = prereqIds(byId.get(id)?.oaCode ?? null).some((p) => pending.has(p) || waits(p));
    memo.set(id, result);
    return result;
  };

  const nodes: ReviewNode[] = reviewSkills.map((s) => ({
    id: s.id,
    grade: s.grade,
    name: s.name,
    nameEn: s.nameEn,
    oaCode: s.oaCode,
    correctCount: counts[s.id] ?? 0,
    status: !pending.has(s.id) ? "completed" : waits(s.id) ? "locked" : "available",
  }));
  return { nodes, waitingOnReview: skills.filter((s) => !pending.has(s.id) && waits(s.id)).map((s) => s.id), placedAt: lastPlacement?.createdAt ?? null };
}

/**
 * Detección durante la práctica: si en una habilidad de Números el niño ya está en la dificultad
 * más baja y sigue con errores conceptuales, se marcan para reforzar sus bases que no domina
 * comprobadamente (sin ubicación «dominada» respondida ni completadas practicando). Las bases de su
 * propio curso ya están en su mapa: desde ellas se sigue bajando hasta las de cursos anteriores, que
 * son las que forman su Repaso. Devuelve cuántas bases se agregaron.
 */
export async function flagPrerequisitesFromPractice(childId: string, childGrade: number, mathSkillId: string): Promise<number> {
  const skills = await loadPlacementSkills();
  const byId = new Map(skills.map((s) => [s.id, s]));
  const byOa = new Map(skills.map((s) => [s.oaCode!, s]));
  const prereqs = (id: string) => (PREREQUISITES[byId.get(id)?.oaCode ?? ""] ?? []).flatMap((p) => (byOa.has(p.oa) ? [byOa.get(p.oa)!.id] : []));
  if (!byId.has(mathSkillId)) return 0;

  const existing = new Map((await prisma.skillPlacement.findMany({ where: { childProfileId: childId } })).map((p) => [p.mathSkillId, p]));
  // Completada practicando (cualquier fecha): para no volver a marcar algo que ya demostró.
  const correct = await prisma.attempt.findMany({
    where: { isCorrect: true, session: { childProfileId: childId, kind: "practica" } },
    select: { exercise: { select: { mathSkillId: true } } },
  });
  const counts: Record<string, number> = {};
  for (const a of correct) counts[a.exercise.mathSkillId] = (counts[a.exercise.mathSkillId] ?? 0) + 1;
  const proven = (id: string) => {
    const p = existing.get(id);
    return (p?.status === "dominada" && p.direct) || (counts[id] ?? 0) >= SKILL_COMPLETE_THRESHOLD;
  };

  const toFlag = new Set<string>();
  const seen = new Set<string>();
  const visit = (id: string) => {
    for (const p of prereqs(id)) {
      if (seen.has(p)) continue;
      seen.add(p);
      if (byId.get(p)!.grade >= childGrade) visit(p); // de su curso: está en su mapa; se baja desde ahí
      else if (existing.get(p)?.status !== "reforzar" && !proven(p)) toFlag.add(p);
    }
  };
  visit(mathSkillId);
  for (const id of toFlag) {
    await prisma.skillPlacement.upsert({
      where: { childProfileId_mathSkillId: { childProfileId: childId, mathSkillId: id } },
      create: { childProfileId: childId, mathSkillId: id, status: "reforzar", source: "practica", direct: false },
      update: { status: "reforzar", source: "practica", direct: false, createdAt: new Date() },
    });
  }
  return toFlag.size;
}
