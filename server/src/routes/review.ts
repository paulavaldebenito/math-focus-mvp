import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireReviewer } from "../auth/reviewer.js";
import { shuffle } from "../lib/shuffle.js";

/**
 * Modo revisión (specs/011-modo-revision): una revisora recorre el banco
 * completo por curso → habilidad → ejercicio y lo responde viendo lo mismo
 * que un niño (imagen, alternativas, pista, feedback de la alternativa).
 * Nunca crea Session, Attempt ni estrellas: no toca el progreso de ningún
 * niño. Lo único que escribe son sus comentarios (ReviewComment).
 */
export const reviewRouter = Router();
reviewRouter.use(requireReviewer);

reviewRouter.get("/skills", async (req, res) => {
  const grade = Number(req.query.grade);
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
    res.status(400).json({ error: "invalid_grade" });
    return;
  }
  const skills = await prisma.mathSkill.findMany({
    where: { grade },
    orderBy: { order: "asc" },
    include: { _count: { select: { exercises: true } } },
  });
  const open = await prisma.reviewComment.groupBy({
    by: ["exerciseId"],
    where: { resolvedAt: null, exercise: { mathSkill: { grade } } },
    _count: true,
  });
  const exerciseSkill = new Map(
    (
      await prisma.exercise.findMany({
        where: { id: { in: open.map((o) => o.exerciseId) } },
        select: { id: true, mathSkillId: true },
      })
    ).map((e) => [e.id, e.mathSkillId]),
  );
  const openBySkill = new Map<string, number>();
  for (const o of open) {
    const sk = exerciseSkill.get(o.exerciseId)!;
    openBySkill.set(sk, (openBySkill.get(sk) ?? 0) + o._count);
  }
  res.json({
    grade,
    skills: skills.map((s) => ({
      id: s.id,
      name: s.name,
      nameEn: s.nameEn,
      axis: s.axis,
      axisEn: s.axisEn,
      oaCode: s.oaCode,
      exerciseCount: s._count.exercises,
      openComments: openBySkill.get(s.id) ?? 0,
    })),
  });
});

reviewRouter.get("/skills/:skillId/exercises", async (req, res) => {
  const skill = await prisma.mathSkill.findUnique({ where: { id: req.params.skillId } });
  if (!skill) {
    res.status(404).json({ error: "skill_not_found" });
    return;
  }
  const exercises = await prisma.exercise.findMany({
    where: { mathSkillId: skill.id, retired: false },
    select: {
      id: true,
      prompt: true,
      theme: true,
      baseKey: true,
      difficultyLevel: true,
      _count: { select: { reviewComments: { where: { resolvedAt: null } } } },
    },
  });
  // Un problema y sus variantes temáticas quedan juntos (mismo baseKey), con
  // la versión neutra primero — así se revisan como grupo.
  const groupKey = (e: (typeof exercises)[number]) => e.baseKey ?? e.id;
  const firstPrompt = new Map<string, string>();
  for (const e of exercises) if (e.theme === null || !firstPrompt.has(groupKey(e))) firstPrompt.set(groupKey(e), e.prompt);
  exercises.sort(
    (a, b) =>
      a.difficultyLevel - b.difficultyLevel ||
      firstPrompt.get(groupKey(a))!.localeCompare(firstPrompt.get(groupKey(b))!) ||
      groupKey(a).localeCompare(groupKey(b)) ||
      (a.theme === null ? -1 : b.theme === null ? 1 : a.theme.localeCompare(b.theme)),
  );
  res.json({
    skill: { id: skill.id, grade: skill.grade, name: skill.name, nameEn: skill.nameEn, oaCode: skill.oaCode },
    exercises: exercises.map((e) => ({
      id: e.id,
      prompt: e.prompt,
      theme: e.theme,
      groupKey: groupKey(e),
      difficultyLevel: e.difficultyLevel,
      openComments: e._count.reviewComments,
    })),
  });
});

reviewRouter.get("/exercises/:exerciseId", async (req, res) => {
  const e = await prisma.exercise.findUnique({
    where: { id: req.params.exerciseId },
    include: {
      options: { select: { id: true, label: true, labelEn: true } },
      mathSkill: { select: { id: true, grade: true, name: true, nameEn: true, oaCode: true } },
      reviewComments: { orderBy: { createdAt: "asc" }, include: { adultUser: { select: { email: true } } } },
    },
  });
  if (!e) {
    res.status(404).json({ error: "exercise_not_found" });
    return;
  }
  // Mismo formato que /next-exercise en modo "solve": alternativas mezcladas
  // y sin isCorrect — la revisora responde igual que un niño, sin pistas.
  res.json({
    id: e.id,
    mode: "solve",
    prompt: e.prompt,
    promptEn: e.promptEn,
    difficultyLevel: e.difficultyLevel,
    options: shuffle(e.options),
    visual: e.visual,
    image: e.image,
    procedureNote: e.procedureNote,
    procedureNoteEn: e.procedureNoteEn,
    theme: e.theme,
    skill: e.mathSkill,
    comments: e.reviewComments.map(commentPublic),
  });
});

const answerSchema = z.object({ selectedOptionId: z.string().min(1) });

reviewRouter.post("/exercises/:exerciseId/answer", async (req, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const options = await prisma.exerciseOption.findMany({
    where: { exerciseId: req.params.exerciseId },
    include: { errorType: true },
  });
  const option = options.find((o) => o.id === parsed.data.selectedOptionId);
  if (!option) {
    res.status(400).json({ error: "invalid_option" });
    return;
  }
  // Mismo contenido que la respuesta de un intento real (sessions.ts), más
  // cuál era la correcta — pero sin guardar nada.
  res.json({
    isCorrect: option.isCorrect,
    errorCode: option.isCorrect ? null : (option.errorType?.code ?? null),
    feedback: option.feedback,
    feedbackEn: option.feedbackEn,
    correctOptionId: options.find((o) => o.isCorrect)?.id ?? null,
    // Desarrollo (specs/015): el del niño y, para revisar el contenido, el
    // paso equivocado previsto de cada alternativa incorrecta.
    solution: (await prisma.exercise.findUnique({ where: { id: req.params.exerciseId }, select: { solution: true } }))?.solution ?? null,
    wrongStep: option.isCorrect ? null : option.wrongStep,
    allWrongSteps: options.filter((o) => !o.isCorrect && o.wrongStep).map((o) => ({ label: o.label, labelEn: o.labelEn, wrongStep: o.wrongStep })),
    action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "Modo revisión." },
    level: 0,
    bonusStarAwarded: false,
  });
});

const commentSchema = z.object({ text: z.string().trim().min(1).max(2000) });

reviewRouter.post("/exercises/:exerciseId/comments", async (req, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const exercise = await prisma.exercise.findUnique({ where: { id: req.params.exerciseId }, select: { id: true } });
  if (!exercise) {
    res.status(404).json({ error: "exercise_not_found" });
    return;
  }
  const c = await prisma.reviewComment.create({
    data: { exerciseId: exercise.id, adultUserId: req.session.adultUserId!, text: parsed.data.text },
    include: { adultUser: { select: { email: true } } },
  });
  res.status(201).json(commentPublic(c));
});

reviewRouter.delete("/comments/:commentId", async (req, res) => {
  const c = await prisma.reviewComment.findUnique({ where: { id: req.params.commentId } });
  // Solo la autora borra su comentario; uno ajeno se trata como inexistente.
  if (!c || c.adultUserId !== req.session.adultUserId) {
    res.status(404).json({ error: "comment_not_found" });
    return;
  }
  await prisma.reviewComment.delete({ where: { id: c.id } });
  res.status(204).send();
});

/** Todos los comentarios sin resolver, para ver la lista completa de pendientes. */
reviewRouter.get("/comments", async (_req, res) => {
  const comments = await prisma.reviewComment.findMany({
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      adultUser: { select: { email: true } },
      exercise: { select: { prompt: true, theme: true, mathSkill: { select: { id: true, grade: true, name: true } } } },
    },
  });
  res.json({
    comments: comments.map((c) => ({
      ...commentPublic(c),
      exercise: { id: c.exerciseId, prompt: c.exercise.prompt, theme: c.exercise.theme, skill: c.exercise.mathSkill },
    })),
  });
});

function commentPublic(c: { id: string; text: string; createdAt: Date; resolvedAt: Date | null; adultUser: { email: string } }) {
  return { id: c.id, text: c.text, createdAt: c.createdAt, resolvedAt: c.resolvedAt, author: c.adultUser.email };
}
