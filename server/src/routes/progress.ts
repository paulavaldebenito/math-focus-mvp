import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { getCurrentLevelForChild } from "../adaptive/levelLookup.js";
import { buildWellbeingCross, localDay, skillsToReview } from "../domain/wellbeing.js";
import { homeGameFor } from "../domain/homeGames.js";
import { EMOTION_GUIDANCE, HARDEST_GUIDANCE, summarizeFeelings, topicProgress } from "../domain/feelings.js";

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

  // isSpotError: false — la precisión que ve la familia es de resolver
  // ejercicios; una ronda de "detecta el error" mide diagnóstico, no
  // cálculo, y mezclarla distorsionaría este número.
  const attempts = await prisma.attempt.findMany({
    where: { session: { childProfileId: child.id }, isSpotError: false },
    include: {
      errorType: true,
      exercise: { select: { mathSkill: { select: { id: true, grade: true, name: true, nameEn: true } } } },
    },
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

  // Cruce ánimo × rendimiento por día (descriptivo, nunca un diagnóstico) y
  // contenidos con menos aciertos, cada uno con una sugerencia para la casa.
  const checkIns = await prisma.wellbeingCheckIn.findMany({
    where: { childProfileId: child.id },
    select: { createdAt: true, mood: true, mathFeeling: true },
  });
  const wellbeing = buildWellbeingCross(checkIns, attempts);
  const toReview = skillsToReview(attempts.map((a) => ({ isCorrect: a.isCorrect, skill: a.exercise.mathSkill }))).map(
    (s) => ({ ...s, game: homeGameFor(s.grade, s.name) }),
  );

  // Emociones al terminar cada práctica (specs/013): resumen de 14 días con
  // la guía de cómo acompañar, y la evolución de cada tema con su juego.
  const reflectionRows = (
    await prisma.sessionReflection.findMany({
      where: { childProfileId: child.id },
      select: {
        createdAt: true,
        emotion: true,
        weather: true,
        energy: true,
        hardest: true,
        mathSkill: { select: { id: true, name: true, nameEn: true } },
      },
    })
  ).map(({ mathSkill, ...r }) => ({ ...r, skill: mathSkill }));
  const summary = summarizeFeelings(reflectionRows, (d) => localDay(d));
  const feelings = {
    ...summary,
    guidance: summary.focus.map((e) => ({ emotion: e, ...EMOTION_GUIDANCE[e] })),
    hardestGuidance: summary.hardestFocus ? { key: summary.hardestFocus, ...HARDEST_GUIDANCE[summary.hardestFocus] } : null,
  };
  const plays = await prisma.homeGamePlay.groupBy({ by: ["mathSkillId"], where: { childProfileId: child.id }, _count: true });
  const playsBySkill = new Map(plays.map((p) => [p.mathSkillId, p._count]));
  const topics = topicProgress(
    attempts.map((a) => ({ createdAt: a.createdAt, isCorrect: a.isCorrect, skill: a.exercise.mathSkill })),
    reflectionRows,
    (d) => localDay(d),
  ).map((t) => ({ ...t, game: homeGameFor(t.grade, t.name), timesPlayed: playsBySkill.get(t.skillId) ?? 0 }));

  res.status(200).json({
    child: { id: child.id, displayName: child.displayName, grade: child.grade },
    currentLevel,
    totalSessions: sessions.length,
    lastSessionAt: sessions[0]?.startedAt ?? null,
    totalAttempts,
    correctAttempts,
    accuracy,
    errorBreakdown,
    wellbeing,
    skillsToReview: toReview,
    feelings,
    topics,
  });
});
