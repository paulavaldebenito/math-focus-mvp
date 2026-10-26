import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { requireFamilyUnlock } from "./family.js";
import { CONFIDANT, EXCLUDED, NO_SCHOOL, RECESS, RETENTION_WEEKS, SOCIAL_CONSENT_VERSION, weekKey, weeksAgo } from "../domain/social.js";

/**
 * Pregunta social semanal (specs/018). La app del niño pregunta si toca (`due`) al terminar una
 * práctica y envía sus respuestas; todo es opcional y un cuerpo vacío es "la saltó" (también se
 * guarda, para no volver a preguntar esa semana). Solo con consentimiento de la familia, que se
 * activa o desactiva desde el espacio familia (con PIN). Nunca afecta nivel ni estrellas.
 */
export const socialCheckInRouter = Router({ mergeParams: true });

socialCheckInRouter.get("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  if (!child.socialCheckInConsent) {
    res.status(200).json({ due: false });
    return;
  }
  const done = await prisma.socialCheckIn.findUnique({
    where: { childProfileId_weekKey: { childProfileId: child.id, weekKey: weekKey(new Date()) } },
  });
  res.status(200).json({ due: !done });
});

const answerSchema = z
  .object({
    recess: z.number().int().refine((n) => (RECESS as readonly number[]).includes(n)).optional(),
    confidant: z.number().int().refine((n) => (CONFIDANT as readonly number[]).includes(n)).optional(),
    excluded: z.enum(EXCLUDED).optional(),
  })
  .strict();

socialCheckInRouter.post("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  if (!child.socialCheckInConsent) {
    res.status(403).json({ error: "no_consent" });
    return;
  }
  const parsed = answerSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const key = weekKey(new Date());
  const existing = await prisma.socialCheckIn.findUnique({ where: { childProfileId_weekKey: { childProfileId: child.id, weekKey: key } } });
  if (existing) {
    res.status(409).json({ error: "already_answered" });
    return;
  }
  // "No fui al colegio" esta semana: las otras dos preguntas no aplican.
  const data = parsed.data.recess === NO_SCHOOL ? { recess: NO_SCHOOL } : parsed.data;
  const row = await prisma.socialCheckIn.create({ data: { childProfileId: child.id, weekKey: key, ...data } });
  // Minimización: solo se guardan las últimas RETENTION_WEEKS semanas.
  await prisma.socialCheckIn.deleteMany({ where: { childProfileId: child.id, weekKey: { lt: weeksAgo(new Date(), RETENTION_WEEKS - 1) } } });
  res.status(201).json({ id: row.id });
});

/// La familia activa o desactiva la pregunta social (consentimiento aparte, desde el espacio familia).
export const socialConsentRouter = Router({ mergeParams: true });

socialConsentRouter.put("/", requireAuth, requireFamilyUnlock, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  const parsed = z.object({ enabled: z.boolean(), deleteAnswers: z.boolean().optional() }).strict().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }
  const { enabled, deleteAnswers } = parsed.data;
  await prisma.childProfile.update({
    where: { id: child.id },
    data: enabled
      ? { socialCheckInConsent: true, socialConsentAt: new Date(), socialConsentVersion: SOCIAL_CONSENT_VERSION }
      : { socialCheckInConsent: false },
  });
  // Al desactivar se puede pedir borrar también sus respuestas (derecho a eliminar los datos).
  if (!enabled && deleteAnswers) await prisma.socialCheckIn.deleteMany({ where: { childProfileId: child.id } });
  res.status(200).json({ enabled });
});
