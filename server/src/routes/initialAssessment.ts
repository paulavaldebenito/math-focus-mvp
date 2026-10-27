import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { placementAnswerSchema } from "../auth/schemas.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { computeInitialLevel } from "../assessment/initialCalibration.js";
import { computePlacement, PLACEMENT_MAX_QUESTIONS, reviewSkillIds } from "../assessment/placement.js";
import { loadPlacementSkills } from "../assessment/placementData.js";
import { getCurrentLevelForChild } from "../adaptive/levelLookup.js";
import { PREREQUISITES } from "../domain/prerequisites.js";
import { shuffle } from "../lib/shuffle.js";
import { allowedThemeWhere, notAttemptedWhere, pickExercise } from "../exercises/select.js";

/**
 * Evaluación de ubicación adaptativa (specs/020-ubicacion-adaptativa). Reemplaza al control de 3
 * preguntas al azar de su curso: ahora se responde de a una y la siguiente depende de la anterior,
 * bajando de curso por los prerrequisitos de Números y operaciones hasta encontrar lo que el niño
 * domina (assessment/placement.ts). Al terminar guarda qué domina y qué reforzar (SkillPlacement),
 * que arma su Repaso en el mapa, y el nivel de dificultad de partida, como antes.
 */
const NEUTRAL_STARTING_LEVEL = 2;
const PREFERRED_DIFFICULTY = 2;

export const initialAssessmentRouter = Router({ mergeParams: true });

type Child = NonNullable<Awaited<ReturnType<typeof getOwnedChild>>>;
type Answered = { exerciseId: string; isCorrect: boolean; exercise: { mathSkillId: string; baseKey: string | null } };

async function sessionAnswers(sessionId: string): Promise<Answered[]> {
  return prisma.attempt.findMany({
    where: { sessionId, isSpotError: false },
    orderBy: { createdAt: "asc" },
    select: { exerciseId: true, isCorrect: true, exercise: { select: { mathSkillId: true, baseKey: true } } },
  });
}

/**
 * Un ejercicio de la habilidad, de dificultad media si hay. No repite un problema base en la
 * evaluación; si ya no queda otro, acepta repetir la historia (nunca el mismo ejercicio) antes de
 * dejar la habilidad sin preguntar.
 */
async function exerciseFor(child: Child, skillId: string, answered: Answered[]) {
  const ids = answered.map((a) => a.exerciseId);
  const baseKeys = answered.flatMap((a) => (a.exercise.baseKey ? [a.exercise.baseKey] : []));
  const include = { options: { select: { id: true, label: true, labelEn: true } } }; // sin isCorrect
  const find = (extra: object) =>
    prisma.exercise.findMany({ where: { AND: [{ mathSkillId: skillId, retired: false }, allowedThemeWhere(child.interests), extra] }, include });
  const chosen =
    pickExercise(await find({ AND: [notAttemptedWhere(ids, baseKeys), { difficultyLevel: PREFERRED_DIFFICULTY }] })) ??
    pickExercise(await find(notAttemptedWhere(ids, baseKeys))) ??
    pickExercise(await find({ id: { notIn: ids } }));
  if (!chosen) return null;
  return {
    id: chosen.id,
    prompt: chosen.prompt,
    promptEn: chosen.promptEn,
    // La opción correcta se siembra primera: sin mezclar, se delataría por posición.
    options: shuffle(chosen.options),
    visual: chosen.visual,
    image: chosen.image,
  };
}

/**
 * Estado actual y siguiente pregunta. Una habilidad sin ejercicios disponibles se salta (queda sin
 * evidencia) en vez de cortar toda la evaluación.
 */
async function advance(child: Child, answered: Answered[]) {
  const skills = await loadPlacementSkills();
  const answers = answered.map((a) => ({ skillId: a.exercise.mathSkillId, isCorrect: a.isCorrect }));
  const unavailable = new Set<string>();
  for (;;) {
    const state = computePlacement(child.grade, skills, PREREQUISITES, answers, PLACEMENT_MAX_QUESTIONS, unavailable);
    if (!state.nextSkillId) return { skills, state, exercise: null };
    const exercise = await exerciseFor(child, state.nextSkillId, answered);
    if (exercise) return { skills, state, exercise };
    unavailable.add(state.nextSkillId);
  }
}

async function finish(child: Child, sessionId: string, answered: Answered[], ctx: Awaited<ReturnType<typeof advance>>) {
  const { skills, state } = ctx;
  const evaluated = new Set(state.evaluated);
  // Una base solo inferida («dominada» por algo que sí sabe) no pisa lo que la práctica detectó.
  const fromPractice = new Set(
    (await prisma.skillPlacement.findMany({ where: { childProfileId: child.id, source: "practica", status: "reforzar" }, select: { mathSkillId: true } })).map(
      (p) => p.mathSkillId,
    ),
  );
  const toWrite = Object.entries(state.results).filter(([id, status]) => evaluated.has(id) || status !== "dominada" || !fromPractice.has(id));
  const now = new Date();
  // La ubicación nueva reemplaza a la anterior.
  await prisma.$transaction([
    prisma.skillPlacement.deleteMany({ where: { childProfileId: child.id, source: "ubicacion" } }),
    ...toWrite.map(([mathSkillId, status]) =>
      prisma.skillPlacement.upsert({
        where: { childProfileId_mathSkillId: { childProfileId: child.id, mathSkillId } },
        create: { childProfileId: child.id, mathSkillId, status, source: "ubicacion", direct: evaluated.has(mathSkillId), createdAt: now },
        update: { status, source: "ubicacion", direct: evaluated.has(mathSkillId), createdAt: now },
      }),
    ),
  ]);

  // Dificultad de partida (1–3) con las respuestas de su propio curso, como el control anterior.
  // Si ya practicaba (evaluación repetida), se mantiene el nivel que ganó practicando.
  const gradeOf = new Map(skills.map((s) => [s.id, s.grade]));
  const own = answered.filter((a) => gradeOf.get(a.exercise.mathSkillId) === child.grade);
  const basis = own.length > 0 ? own : answered;
  const correctCount = answered.filter((a) => a.isCorrect).length;
  const calibrated = basis.length > 0 ? computeInitialLevel(basis.filter((a) => a.isCorrect).length, basis.length) : NEUTRAL_STARTING_LEVEL;
  const hadLevel = await prisma.adaptiveDecision.findFirst({ where: { session: { childProfileId: child.id }, NOT: { sessionId } } });
  const previousLevel = hadLevel ? await getCurrentLevelForChild(child.id) : NEUTRAL_STARTING_LEVEL;
  const initialLevel = hadLevel ? previousLevel : calibrated;
  const review = reviewSkillIds(child.grade, skills, state.results);

  await prisma.adaptiveDecision.create({
    data: {
      sessionId,
      ruleCode: "INITIAL_ASSESSMENT",
      reason: `Ubicación: ${correctCount}/${answered.length} correctas; ${review.length} habilidades de cursos anteriores para repasar.`,
      previousLevel,
      newLevel: initialLevel,
    },
  });
  await prisma.session.update({ where: { id: sessionId }, data: { endedAt: now, pendingExerciseId: null } });

  return { done: true as const, sessionId, correctCount, total: answered.length, initialLevel, reviewCount: review.length };
}

/// Empieza una evaluación de ubicación (también sirve para repetirla) y entrega la primera pregunta.
initialAssessmentRouter.post("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  const ctx = await advance(child, []);
  const session = await prisma.session.create({ data: { childProfileId: child.id, kind: "ubicacion", pendingExerciseId: ctx.exercise?.id ?? null } });
  if (!ctx.exercise) {
    res.status(201).json(await finish(child, session.id, [], ctx));
    return;
  }
  res.status(201).json({ sessionId: session.id, done: false, exercise: ctx.exercise, answered: 0, maxQuestions: PLACEMENT_MAX_QUESTIONS });
});

initialAssessmentRouter.post("/:sessionId/answers", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  const session = await prisma.session.findUnique({ where: { id: String(req.params.sessionId) } });
  if (!session || session.childProfileId !== child.id || session.kind !== "ubicacion") {
    res.status(404).json({ error: "session_not_found" });
    return;
  }
  if (session.endedAt) {
    res.status(409).json({ error: "assessment_finished" });
    return;
  }
  const parsed = placementAnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  // La corrección la decide el servidor a partir de la opción real, nunca el cliente.
  const option = parsed.data.selectedOptionId ? await prisma.exerciseOption.findUnique({ where: { id: parsed.data.selectedOptionId } }) : null;
  if (!parsed.data.dontKnow && (!option || option.exerciseId !== parsed.data.exerciseId)) {
    res.status(400).json({ error: "invalid_option" });
    return;
  }

  // Solo se acepta la pregunta servida, y una sola vez: se «reclama» de forma atómica, así un doble
  // toque o un reintento no cuentan dos respuestas, ni se puede responder otra pregunta.
  const claimed = await prisma.session.updateMany({
    where: { id: session.id, pendingExerciseId: parsed.data.exerciseId, endedAt: null },
    data: { pendingExerciseId: null },
  });
  if (claimed.count === 0) {
    res.status(409).json({ error: "unexpected_exercise" });
    return;
  }

  await prisma.attempt.create({
    data: {
      sessionId: session.id,
      exerciseId: parsed.data.exerciseId,
      selectedOptionId: option?.id ?? null,
      isCorrect: option?.isCorrect ?? false,
      errorTypeId: option && !option.isCorrect ? (option.errorTypeId ?? null) : null,
      responseTimeMs: parsed.data.responseTimeMs,
    },
  });

  const answered = await sessionAnswers(session.id);
  const ctx = await advance(child, answered);
  if (!ctx.exercise) {
    res.status(200).json(await finish(child, session.id, answered, ctx));
    return;
  }
  await prisma.session.update({ where: { id: session.id }, data: { pendingExerciseId: ctx.exercise.id } });
  res.status(200).json({ done: false, exercise: ctx.exercise, answered: answered.length, maxQuestions: PLACEMENT_MAX_QUESTIONS });
});
