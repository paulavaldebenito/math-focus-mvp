import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { initialAssessmentAttemptsSchema } from "../auth/schemas.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { computeInitialLevel } from "../assessment/initialCalibration.js";

const ASSESSMENT_SIZE = 5;
const NEUTRAL_STARTING_LEVEL = 2;

export const initialAssessmentRouter = Router({ mergeParams: true });

initialAssessmentRouter.get("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const exercises = await prisma.exercise.findMany({
    where: { mathSkill: { grade: child.grade } },
    take: ASSESSMENT_SIZE,
    include: { options: { select: { id: true, label: true } } }, // sin isCorrect ni errorTypeId
  });

  res.status(200).json({
    exercises: exercises.map((ex) => ({
      id: ex.id,
      prompt: ex.prompt,
      options: ex.options,
    })),
  });
});

initialAssessmentRouter.post("/attempts", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const parsed = initialAssessmentAttemptsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const session = await prisma.session.create({ data: { childProfileId: child.id } });

  let correctCount = 0;
  for (const a of parsed.data.attempts) {
    // La corrección la decide el servidor a partir de la opción real —
    // nunca se confía en un booleano "correcto" enviado por el cliente.
    const option = await prisma.exerciseOption.findUnique({ where: { id: a.selectedOptionId } });
    const isCorrect = Boolean(option && option.exerciseId === a.exerciseId && option.isCorrect);
    if (isCorrect) correctCount += 1;

    await prisma.attempt.create({
      data: {
        sessionId: session.id,
        exerciseId: a.exerciseId,
        selectedOptionId: a.selectedOptionId,
        isCorrect,
        errorTypeId: !isCorrect ? (option?.errorTypeId ?? null) : null,
        responseTimeMs: a.responseTimeMs,
      },
    });
  }

  const total = parsed.data.attempts.length;
  const initialLevel = computeInitialLevel(correctCount, total);

  await prisma.adaptiveDecision.create({
    data: {
      sessionId: session.id,
      ruleCode: "INITIAL_ASSESSMENT",
      reason: `Evaluación inicial: ${correctCount}/${total} correctas.`,
      previousLevel: NEUTRAL_STARTING_LEVEL,
      newLevel: initialLevel,
    },
  });

  res.status(201).json({ sessionId: session.id, correctCount, total, initialLevel });
});
