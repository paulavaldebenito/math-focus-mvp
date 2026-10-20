import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { computeSkillPath } from "../skillPath/skillPath.js";

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
    where: { isCorrect: true, session: { childProfileId: child.id } },
    select: { exercise: { select: { mathSkillId: true } } },
  });
  const correctCountsBySkillId: Record<string, number> = {};
  for (const a of correctAttempts) {
    correctCountsBySkillId[a.exercise.mathSkillId] = (correctCountsBySkillId[a.exercise.mathSkillId] ?? 0) + 1;
  }

  res.status(200).json({
    grade: child.grade,
    skills: computeSkillPath(skills, correctCountsBySkillId),
  });
});
