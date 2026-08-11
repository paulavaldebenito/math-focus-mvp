import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { getCurrentLevelForChild } from "../adaptive/levelLookup.js";

export const progressRouter = Router({ mergeParams: true });

progressRouter.get("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const sessions = await prisma.session.findMany({
    where: { childProfileId: child.id },
    orderBy: { startedAt: "desc" },
  });

  const attempts = await prisma.attempt.findMany({
    where: { session: { childProfileId: child.id } },
    include: { errorType: true },
  });

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : null;

  const errorBreakdown: Record<string, number> = {};
  for (const a of attempts) {
    if (!a.isCorrect && a.errorType) {
      errorBreakdown[a.errorType.code] = (errorBreakdown[a.errorType.code] ?? 0) + 1;
    }
  }

  const currentLevel = await getCurrentLevelForChild(child.id);

  res.status(200).json({
    child: { id: child.id, displayName: child.displayName, grade: child.grade },
    currentLevel,
    totalSessions: sessions.length,
    lastSessionAt: sessions[0]?.startedAt ?? null,
    totalAttempts,
    correctAttempts,
    accuracy,
    errorBreakdown,
  });
});
