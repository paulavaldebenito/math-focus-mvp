import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild, getOwnedSession } from "./childAccess.js";
import { EMOTIONS, HARDEST } from "../domain/feelings.js";
import { requireFamilyUnlock } from "./family.js";

/// Reflexión al TERMINAR una práctica (specs/013): emoción + una pregunta
/// lúdica que rota. Todo opcional; un cuerpo vacío = "lo saltó" y también se
/// guarda. Una por sesión (409 si ya existe). Nunca afecta nivel ni estrellas.
const reflectionSchema = z
  .object({
    emotion: z.enum(EMOTIONS).optional(),
    weather: z.number().int().min(1).max(4).optional(),
    energy: z.number().int().min(1).max(3).optional(),
    hardest: z.enum(HARDEST).optional(),
  })
  .strict();

export const reflectionRouter = Router({ mergeParams: true });

reflectionRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await getOwnedSession(String(req.params.sessionId), req.session.adultUserId!);
  if (!practiceSession) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }
  const parsed = reflectionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.sessionReflection.findUnique({ where: { sessionId: practiceSession.id } });
  if (existing) {
    res.status(409).json({ error: "already_reflected" });
    return;
  }
  const r = await prisma.sessionReflection.create({
    data: {
      childProfileId: practiceSession.childProfileId,
      sessionId: practiceSession.id,
      mathSkillId: practiceSession.mathSkillId,
      ...parsed.data,
    },
  });
  res.status(201).json({ id: r.id });
});

/// "¡Lo jugamos!": la familia registra que jugó el juego para la casa de un tema.
const homeGameSchema = z.object({ mathSkillId: z.string().min(1) }).strict();

export const homeGamesRouter = Router({ mergeParams: true });

homeGamesRouter.post("/", requireAuth, requireFamilyUnlock, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  const parsed = homeGameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const skill = await prisma.mathSkill.findUnique({ where: { id: parsed.data.mathSkillId } });
  if (!skill) {
    res.status(400).json({ error: "invalid_math_skill" });
    return;
  }
  await prisma.homeGamePlay.create({ data: { childProfileId: child.id, mathSkillId: skill.id } });
  const timesPlayed = await prisma.homeGamePlay.count({ where: { childProfileId: child.id, mathSkillId: skill.id } });
  res.status(201).json({ timesPlayed });
});
