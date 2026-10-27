import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { computeSkillPath } from "../skillPath/skillPath.js";
import { loadChildReview } from "../assessment/placementData.js";

export const skillPathRouter = Router({ mergeParams: true });

skillPathRouter.get("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const skills = await prisma.mathSkill.findMany({
    where: { grade: child.grade },
    orderBy: { order: "asc" },
    select: { id: true, grade: true, axis: true, name: true, axisEn: true, nameEn: true, oaCode: true, order: true },
  });

  // Aciertos históricos por habilidad — incluye intentos de antes de esta
  // funcionalidad, nunca se pierde progreso real. Volumen bajo por niño, así
  // que se reduce en memoria en vez de un agregado SQL entre relaciones.
  const correctAttempts = await prisma.attempt.findMany({
    // Solo aciertos de práctica: los de la evaluación de ubicación no completan nodos (specs/020).
    where: { isCorrect: true, session: { childProfileId: child.id, kind: "practica" } },
    select: { exercise: { select: { mathSkillId: true } } },
  });
  const correctCountsBySkillId: Record<string, number> = {};
  for (const a of correctAttempts) {
    correctCountsBySkillId[a.exercise.mathSkillId] = (correctCountsBySkillId[a.exercise.mathSkillId] ?? 0) + 1;
  }

  // Repaso de cursos anteriores (specs/020-ubicacion-adaptativa): va antes de las habilidades de su
  // curso que lo necesitan, que se marcan con `afterReview` (siguen abiertas: es una recomendación).
  const review = await loadChildReview(child.id, child.grade);
  const waiting = new Set(review.waitingOnReview);
  res.status(200).json({
    grade: child.grade,
    skills: computeSkillPath(skills, correctCountsBySkillId).map((s) => ({ ...s, afterReview: waiting.has(s.id) })),
    review: review.nodes,
    placedAt: review.placedAt,
  });
});
