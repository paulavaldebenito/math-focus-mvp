import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild, getOwnedSession } from "./childAccess.js";
import { isCheckInDue } from "./checkIns.js";
import { getCurrentLevelForChild } from "../adaptive/levelLookup.js";
import { evaluateAdaptiveRules, applyLevelChange, type AttemptRecord } from "../adaptive/adaptiveEngine.js";
import { shuffle } from "../lib/shuffle.js";
import { allowedThemeWhere, notAttemptedWhere, pickExercise } from "../exercises/select.js";
import { buildSpotErrorRound, isSpotErrorEligible, wantsSpotErrorRound } from "../exercises/spotError.js";

// Cada cuántos aciertos seguidos (sin cortar racha) se otorga una estrella
// extra — decisión de diseño del juego, no un umbral pedagógico validado.
const STREAK_BONUS_EVERY = 3;

export const childSessionsRouter = Router({ mergeParams: true });
export const sessionAttemptsRouter = Router({ mergeParams: true });
export const spotErrorAttemptsRouter = Router({ mergeParams: true });

const startSessionSchema = z.object({
  // Nodo del mapa de habilidades que se está practicando. Opcional por
  // compatibilidad hacia atrás — sin él, la sesión es "de todo el curso"
  // como antes del mapa de habilidades.
  mathSkillId: z.string().min(1).optional(),
});

childSessionsRouter.post("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const parsed = startSessionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  if (parsed.data.mathSkillId) {
    const skill = await prisma.mathSkill.findUnique({ where: { id: parsed.data.mathSkillId } });
    if (!skill || skill.grade !== child.grade) {
      res.status(400).json({ error: "invalid_math_skill" });
      return;
    }
  }

  const session = await prisma.session.create({
    data: { childProfileId: child.id, mathSkillId: parsed.data.mathSkillId },
  });
  const currentLevel = await getCurrentLevelForChild(child.id);
  // Las preguntas de ánimo van solo en la primera práctica del día.
  const checkInDue = await isCheckInDue(child.id);

  res.status(201).json({ sessionId: session.id, currentLevel, checkInDue });
});

const attemptSchema = z.object({
  exerciseId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  responseTimeMs: z.number().int().positive().optional(),
  hintsUsed: z.number().int().min(0).default(0),
});

sessionAttemptsRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await getOwnedSession(String(req.params.sessionId), req.session.adultUserId!);

  if (!practiceSession) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  const parsed = attemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const { exerciseId, selectedOptionId, responseTimeMs, hintsUsed } = parsed.data;

  const option = await prisma.exerciseOption.findUnique({
    where: { id: selectedOptionId },
    include: { errorType: true },
  });
  const isCorrect = Boolean(option && option.exerciseId === exerciseId && option.isCorrect);
  // Código del tipo de error (p.ej. "E1_OP") para que el cliente muestre un
  // mensaje concreto de cómo mejorar — solo una parte del banco lo tiene
  // clasificado todavía (ver ErrorType en el schema); sin clasificar, el
  // cliente cae de vuelta a su mensaje genérico de siempre.
  const errorCode = !isCorrect ? (option?.errorType?.code ?? null) : null;
  // Mensaje propio de la alternativa elegida — recién ahora, después de
  // responder (enviarlo con la pregunta delataría cuáles son incorrectas).
  const ownOption = option && option.exerciseId === exerciseId ? option : null;
  const feedback = ownOption?.feedback ?? null;
  const feedbackEn = ownOption?.feedbackEn ?? null;

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

  // isSpotError: false — el historial que alimenta el motor adaptativo y la
  // racha de estrella bonus es solo de resolver ejercicios; una ronda de
  // "detecta el error" mide una habilidad distinta (diagnóstico) y no debe
  // subir/bajar el nivel de dificultad ni contar para la racha.
  const priorAttempts = await prisma.attempt.findMany({
    where: { sessionId: practiceSession.id, isSpotError: false },
    include: { errorType: true },
    orderBy: { createdAt: "asc" },
  });

  // Estrella extra cada STREAK_BONUS_EVERY aciertos seguidos EN ESTA SESIÓN
  // — puramente aditiva (nunca se quita nada al cortar la racha), y siempre
  // trazable (reason: "streak_bonus"). Constante de diseño del juego, no un
  // umbral pedagógico (mismo criterio que SKILL_COMPLETE_THRESHOLD o
  // FAST_RESPONSE_THRESHOLD_MS). El intento recién creado ya viene incluido
  // en priorAttempts (se guardó arriba, y esta consulta es posterior).
  let trailingCorrectStreak = 0;
  for (let i = priorAttempts.length - 1; i >= 0; i--) {
    if (!priorAttempts[i]!.isCorrect) break;
    trailingCorrectStreak += 1;
  }
  const bonusStarAwarded = isCorrect && trailingCorrectStreak > 0 && trailingCorrectStreak % STREAK_BONUS_EVERY === 0;
  if (bonusStarAwarded) {
    await prisma.starEvent.create({
      data: {
        childProfileId: practiceSession.childProfileId,
        sessionId: practiceSession.id,
        reason: "streak_bonus",
      },
    });
  }

  const history: AttemptRecord[] = priorAttempts.map((a) => ({
    isCorrect: a.isCorrect,
    errorLevel: (a.errorType?.level as 1 | 2 | 3 | null) ?? null,
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

  res.status(201).json({ isCorrect, action, level: newLevel, errorCode, feedback, feedbackEn, bonusStarAwarded });
});

const spotErrorAttemptSchema = z.object({
  exerciseId: z.string().min(1),
  // La alternativa (ya errada y clasificada) que le tocó diagnosticar —
  // nunca la eligió el niño, se la ofreció el servidor en /next-exercise.
  wrongOptionId: z.string().min(1),
  // Código de ErrorType que el niño cree que explica el error (una de las
  // `explanationOptions` que se le mostraron).
  chosenCode: z.string().min(1),
});

// Ronda "detecta el error": el niño diagnostica una respuesta ajena ya
// errada, no resuelve el ejercicio — no crea AdaptiveDecision ni afecta el
// nivel (ver el filtro isSpotError:false en sessionAttemptsRouter). Su
// única consecuencia además del feedback es una estrella si acierta el
// diagnóstico, siempre trazable y aditiva.
spotErrorAttemptsRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await getOwnedSession(String(req.params.sessionId), req.session.adultUserId!);
  if (!practiceSession) {
    res.status(404).json({ error: "session_not_found" });
    return;
  }

  const parsed = spotErrorAttemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const { exerciseId, wrongOptionId, chosenCode } = parsed.data;

  const wrongOption = await prisma.exerciseOption.findUnique({
    where: { id: wrongOptionId },
    include: { errorType: true },
  });
  const isValidRound = Boolean(
    wrongOption && wrongOption.exerciseId === exerciseId && !wrongOption.isCorrect && wrongOption.errorType,
  );
  if (!isValidRound) {
    res.status(400).json({ error: "invalid_spot_error_round" });
    return;
  }

  const correctCode = wrongOption!.errorType!.code;
  const isCorrect = chosenCode === correctCode;

  await prisma.attempt.create({
    data: {
      sessionId: practiceSession.id,
      exerciseId,
      isCorrect,
      isSpotError: true,
    },
  });

  if (isCorrect) {
    await prisma.starEvent.create({
      data: {
        childProfileId: practiceSession.childProfileId,
        sessionId: practiceSession.id,
        reason: "spot_error_correct",
      },
    });
  }

  const level = await getCurrentLevelForChild(practiceSession.childProfileId);

  res.status(201).json({
    isCorrect,
    correctCode,
    level,
    // Nunca ajusta el nivel ni ofrece pausa desde esta ronda — se devuelve
    // solo para que el cliente reutilice el mismo flujo de "Continuar".
    action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "Ronda de detectar el error." },
    errorCode: null,
    bonusStarAwarded: false,
  });
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

  // Si la sesión es de un nodo del mapa de habilidades, los ejercicios se
  // acotan a esa habilidad; sin ella (o sesión vieja de antes del mapa),
  // sigue siendo de todo el curso, como antes.
  const practiceSession = sessionId
    ? await prisma.session.findUnique({ where: { id: sessionId }, select: { mathSkillId: true } })
    : null;

  const attempted = sessionId
    ? await prisma.attempt.findMany({
        where: { sessionId },
        select: { exerciseId: true, exercise: { select: { baseKey: true } } },
      })
    : [];
  const alreadyAttempted = attempted.map((a) => a.exerciseId);
  // Un problema y sus variantes temáticas comparten baseKey: si el niño ya
  // respondió una, no se le sirve otra versión de la misma historia.
  const attemptedBaseKeys = attempted.flatMap((a) => (a.exercise.baseKey ? [a.exercise.baseKey] : []));

  // Se prioriza el nivel actual del niño; si ya no quedan ejercicios sin
  // repetir en ese nivel, se amplía a cualquier nivel del mismo curso antes
  // de repetir uno ya visto en esta sesión. Solo entran ejercicios neutros o
  // de los intereses del niño (nunca de un tema ajeno); `pickExercise` decide
  // entre temático y neutro con la proporción objetivo.
  const findPool = (extra: Prisma.ExerciseWhereInput) =>
    prisma.exercise.findMany({
      where: {
        AND: [
          {
            mathSkill: {
              grade: child.grade,
              ...(practiceSession?.mathSkillId ? { id: practiceSession.mathSkillId } : {}),
            },
          },
          allowedThemeWhere(child.interests),
          notAttemptedWhere(alreadyAttempted, attemptedBaseKeys),
          extra,
        ],
      },
      // isCorrect/errorType solo se piden para decidir acá si el ejercicio
      // sirve para una ronda "detecta el error" — nunca se envían tal cual
      // al cliente (se arman a mano en la respuesta, ver abajo) para no
      // delatar la alternativa correcta de una pregunta normal.
      include: {
        options: {
          select: {
            id: true,
            label: true,
            labelEn: true,
            isCorrect: true,
            errorTypeId: true,
            errorType: { select: { code: true } },
          },
        },
      },
    });

  const atLevel = await findPool({ difficultyLevel: currentLevel });
  const pool = atLevel.length > 0 ? atLevel : await findPool({});

  // Ronda "detecta el error": en vez de resolver desde cero, se le muestra
  // una respuesta ajena ya errada y clasificada, y elige qué le pasó —
  // reutiliza el mismo ErrorType de las alternativas normales. Solo entra
  // si, además de tocarle el turno, hay al menos un ejercicio del pool que
  // sirva para esto — si no, sigue como pregunta normal (ver spotError.ts).
  const spotErrorPool = wantsSpotErrorRound(alreadyAttempted.length) ? pool.filter(isSpotErrorEligible) : [];

  const chosen = spotErrorPool.length > 0 ? pickExercise(spotErrorPool) : pickExercise(pool);
  if (!chosen) {
    res.status(404).json({ error: "no_exercises_available" });
    return;
  }

  const spotErrorRound = spotErrorPool.length > 0 ? buildSpotErrorRound(chosen) : null;
  if (spotErrorRound) {
    res.status(200).json({
      id: chosen.id,
      mode: "spot_error",
      prompt: chosen.prompt,
      promptEn: chosen.promptEn,
      difficultyLevel: chosen.difficultyLevel,
      visual: chosen.visual,
      image: chosen.image,
      characterAnswerLabel: spotErrorRound.characterAnswerLabel,
      characterAnswerLabelEn: spotErrorRound.characterAnswerLabelEn,
      correctAnswerLabel: spotErrorRound.correctAnswerLabel,
      correctAnswerLabelEn: spotErrorRound.correctAnswerLabelEn,
      wrongOptionId: spotErrorRound.wrongOptionId,
      explanationOptions: spotErrorRound.explanationOptions,
      procedureNote: chosen.procedureNote,
      procedureNoteEn: chosen.procedureNoteEn,
    });
    return;
  }

  res.status(200).json({
    id: chosen.id,
    mode: "solve",
    prompt: chosen.prompt,
    promptEn: chosen.promptEn,
    difficultyLevel: chosen.difficultyLevel,
    // La opción correcta se siembra siempre primera en el banco de
    // ejercicios — sin mezclar acá, la respuesta se delata por posición.
    // Se mapea a {id,label} explícitamente: isCorrect/errorType NUNCA se
    // envían en modo "solve" (se pidieron arriba solo para decidir el modo).
    options: shuffle(chosen.options.map((o) => ({ id: o.id, label: o.label, labelEn: o.labelEn }))),
    visual: chosen.visual,
    // Ilustración SVG por idioma (banco de imágenes por curso) — si está,
    // el cliente la muestra en lugar de `visual`. NULL = representación actual.
    image: chosen.image,
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
  // Clave del ejercicio concreto (catálogo del cliente, lib/pauses.ts) —
  // solo formato: el catálogo vive en el cliente.
  exerciseKey: z.string().regex(/^[a-z0-9-]{1,40}$/).optional(),
});

export const pauseEventsRouter = Router({ mergeParams: true });

pauseEventsRouter.post("/", requireAuth, async (req, res) => {
  const practiceSession = await getOwnedSession(String(req.params.sessionId), req.session.adultUserId!);

  if (!practiceSession) {
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
  const practiceSession = await getOwnedSession(String(req.params.sessionId), req.session.adultUserId!);

  if (!practiceSession) {
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
