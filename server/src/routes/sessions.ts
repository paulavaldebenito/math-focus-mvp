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

  // Estrella por acierto — nunca se resta por error, nunca aleatoria (regla
  // de gamificación del proyecto: siempre trazable a un motivo concreto).
  if (isCorrect) {
    await prisma.starEvent.create({
      data: {
        childProfileId: practiceSession.childProfileId,
        sessionId: practiceSession.id,
        reason: "correct_answer",
      },
    });
  }

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

export const nextExerciseRouter = Router({ mergeParams: true });

nextExerciseRouter.get("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
  const currentLevel = await getCurrentLevelForChild(child.id);

  const alreadyAttempted = sessionId
    ? (await prisma.attempt.findMany({ where: { sessionId }, select: { exerciseId: true } })).map(
        (a) => a.exerciseId,
      )
    : [];

  // Se prioriza el nivel actual del niño; si ya no quedan ejercicios sin
  // repetir en ese nivel, se amplía a cualquier nivel del mismo curso antes
  // de repetir uno ya visto en esta sesión.
  const atLevel = await prisma.exercise.findMany({
    where: {
      mathSkill: { grade: child.grade },
      difficultyLevel: currentLevel,
      id: { notIn: alreadyAttempted },
    },
    include: { options: { select: { id: true, label: true } } },
  });

  const pool =
    atLevel.length > 0
      ? atLevel
      : await prisma.exercise.findMany({
          where: { mathSkill: { grade: child.grade }, id: { notIn: alreadyAttempted } },
          include: { options: { select: { id: true, label: true } } },
        });

  if (pool.length === 0) {
    res.status(404).json({ error: "no_exercises_available" });
    return;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)]!;

  res.status(200).json({
    id: chosen.id,
    prompt: chosen.prompt,
    promptEn: chosen.promptEn,
    difficultyLevel: chosen.difficultyLevel,
    options: chosen.options,
    visual: chosen.visual,
    // Se envía para poder mostrarlo como pista SI el niño la pide — nunca
    // se muestra por defecto (eso lo decide el cliente).
    procedureNote: chosen.procedureNote,
    procedureNoteEn: chosen.procedureNoteEn,
  });
});

const pauseEventSchema = z.object({
  kind: z.enum(["respiracion", "movimiento"]),
  accepted: z.boolean(),
  durationMs: z.number().int().positive().optional(),
});

export const pauseEventsRouter = Router({ mergeParams: true });

pauseEventsRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await prisma.session.findUnique({
    where: { id: String(req.params.sessionId) },
    include: { childProfile: true },
  });

  if (!practiceSession || practiceSession.childProfile.adultUserId !== req.session.adultUserId!) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  const parsed = pauseEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const pause = await prisma.pauseEvent.create({
    data: { sessionId: practiceSession.id, ...parsed.data },
  });

  // Estrella por tomarse la pausa — nunca por rechazarla (regla: la pausa
  // jamás bloquea ni castiga).
  if (pause.accepted) {
    await prisma.starEvent.create({
      data: {
        childProfileId: practiceSession.childProfileId,
        sessionId: practiceSession.id,
        reason: "pause_taken",
      },
    });
  }

  res.status(201).json({ id: pause.id, accepted: pause.accepted });
});

export const sessionCompleteRouter = Router({ mergeParams: true });

sessionCompleteRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await prisma.session.findUnique({
    where: { id: String(req.params.sessionId) },
    include: { childProfile: true },
  });

  if (!practiceSession || practiceSession.childProfile.adultUserId !== req.session.adultUserId!) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  // Idempotente: si ya se cerró antes (doble click, reintento de red), no
  // se otorga una segunda estrella por la misma sesión.
  const alreadyCompleted = practiceSession.endedAt !== null;

  if (!alreadyCompleted) {
    await prisma.session.update({ where: { id: practiceSession.id }, data: { endedAt: new Date() } });
    await prisma.starEvent.create({
      data: {
        childProfileId: practiceSession.childProfileId,
        sessionId: practiceSession.id,
        reason: "session_complete",
      },
    });
  }

  res.status(200).json({ id: practiceSession.id, starAwarded: !alreadyCompleted });
});
