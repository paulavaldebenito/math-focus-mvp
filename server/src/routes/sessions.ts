import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { getCurrentLevelForChild } from "../adaptive/levelLookup.js";
import { evaluateAdaptiveRules, applyLevelChange, type AttemptRecord } from "../adaptive/adaptiveEngine.js";

export const childSessionsRouter = Router({ mergeParams: true });
export const sessionAttemptsRouter = Router({ mergeParams: true });

childSessionsRouter.post("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const session = await prisma.session.create({ data: { childProfileId: child.id } });
  const currentLevel = await getCurrentLevelForChild(child.id);

  res.status(201).json({ sessionId: session.id, currentLevel });
});

const attemptSchema = z.object({
  exerciseId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  responseTimeMs: z.number().int().positive().optional(),
  hintsUsed: z.number().int().min(0).default(0),
});

sessionAttemptsRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await prisma.session.findUnique({
    where: { id: String(req.params.sessionId) },
    include: { childProfile: true },
  });

  if (!practiceSession || practiceSession.childProfile.adultUserId !== req.session.adultUserId!) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  const parsed = attemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const { exerciseId, selectedOptionId, responseTimeMs, hintsUsed } = parsed.data;

  const option = await prisma.exerciseOption.findUnique({ where: { id: selectedOptionId } });
  const isCorrect = Boolean(option && option.exerciseId === exerciseId && option.isCorrect);

  await prisma.attempt.create({
    data: {
      sessionId: practiceSession.id,
      exerciseId,
      selectedOptionId,
      isCorrect,
      errorTypeId: !isCorrect ? (option?.errorTypeId ?? null) : null,
      responseTimeMs,
      hintsUsed,
    },
  });

  const priorAttempts = await prisma.attempt.findMany({
    where: { sessionId: practiceSession.id },
    include: { errorType: true },
    orderBy: { createdAt: "asc" },
  });

  const history: AttemptRecord[] = priorAttempts.map((a) => ({
    isCorrect: a.isCorrect,
    errorTypeCode: (a.errorType?.code as AttemptRecord["errorTypeCode"]) ?? null,
    responseTimeMs: a.responseTimeMs,
    hintsUsed: a.hintsUsed,
  }));

  const action = evaluateAdaptiveRules(history);
  const currentLevel = await getCurrentLevelForChild(practiceSession.childProfileId);
  const newLevel = applyLevelChange(currentLevel, action);

  if (action.type !== "NO_CHANGE") {
    await prisma.adaptiveDecision.create({
      data: {
        sessionId: practiceSession.id,
        ruleCode: action.ruleCode,
        reason: action.reason,
        previousLevel: currentLevel,
        newLevel,
      },
    });
  }

  res.status(201).json({ isCorrect, action, level: newLevel });
});
