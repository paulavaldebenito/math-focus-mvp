import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedSession } from "./childAccess.js";
import { localDay } from "../domain/wellbeing.js";

/// true si el niño todavía no tiene check-in (respondido o saltado) hoy.
export async function isCheckInDue(childProfileId: string, now: Date = new Date()): Promise<boolean> {
  const last = await prisma.wellbeingCheckIn.findFirst({
    where: { childProfileId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return !last || localDay(last.createdAt) !== localDay(now);
}

/// Autorreporte con caritas en la PRIMERA práctica del día: 1-5 en cada
/// pregunta, ambas opcionales. Un cuerpo vacío significa "lo saltó" y
/// también se guarda (mood/mathFeeling NULL), para no volver a preguntarle
/// ese mismo día. Nunca bloquea ni cambia la práctica.
const checkInSchema = z
  .object({
    mood: z.number().int().min(1).max(5).optional(),
    mathFeeling: z.number().int().min(1).max(5).optional(),
  })
  .strict();

export const checkInsRouter = Router({ mergeParams: true });

checkInsRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await getOwnedSession(String(req.params.sessionId), req.session.adultUserId!);
  if (!practiceSession) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  // Uno por día (hora de Chile): un reintento o una segunda práctica el
  // mismo día no duplica el registro.
  if (!(await isCheckInDue(practiceSession.childProfileId))) {
    res.status(409).json({ error: "already_checked_in" });
    return;
  }

  const checkIn = await prisma.wellbeingCheckIn.create({
    data: { childProfileId: practiceSession.childProfileId, sessionId: practiceSession.id, ...parsed.data },
  });
  res.status(201).json({ id: checkIn.id });
});
