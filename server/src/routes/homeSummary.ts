import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { toMascotNames } from "../domain/mascotNames.js";

export const homeSummaryRouter = Router({ mergeParams: true });

// Estrellas por rango — decisión de diseño del juego (mismo criterio que
// SKILL_COMPLETE_THRESHOLD en skillPath.ts o FAST_RESPONSE_THRESHOLD_MS en
// adaptiveEngine.ts: no es un umbral pedagógico validado). "Rango", no
// "Nivel": el nivel de dificultad (1-3) ya se llama así en la práctica —
// mismo nombre para dos cosas distintas confundiría a las familias.
export const RANK_STEP = 10;

/// Rango del niño a partir de las estrellas totales — nunca baja, nunca se
/// compara entre niños. Función pura para poder probarla sin BD.
export function rankFromStars(totalStars: number) {
  const rank = 1 + Math.floor(totalStars / RANK_STEP);
  const starsIntoRank = totalStars % RANK_STEP;
  return { rank, starsIntoRank, starsToNextRank: RANK_STEP - starsIntoRank };
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Racha = días distintos consecutivos con al menos una sesión, contando
 * hacia atrás desde hoy o ayer. Se calcula a partir del historial real de
 * sesiones — no se guarda como contador aparte para que nunca se desincronice.
 */
function computeStreak(sessionDates: Date[]): number {
  const days = [...new Set(sessionDates.map(dayKey))].sort().reverse();
  if (days.length === 0) return 0;

  const today = new Date();
  const msPerDay = 86_400_000;
  const mostRecent = new Date(days[0]! + "T00:00:00Z");
  const todayMidnight = new Date(dayKey(today) + "T00:00:00Z");
  const gapFromToday = Math.round((todayMidnight.getTime() - mostRecent.getTime()) / msPerDay);

  if (gapFromToday > 1) return 0; // no practicó hoy ni ayer: racha rota

  let streak = 1;
  let cursor = mostRecent;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i]! + "T00:00:00Z");
    const gap = Math.round((cursor.getTime() - prev.getTime()) / msPerDay);
    if (gap === 1) {
      streak += 1;
      cursor = prev;
    } else {
      break;
    }
  }
  return streak;
}

homeSummaryRouter.get("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const sessions = await prisma.session.findMany({
    where: { childProfileId: child.id },
    select: { startedAt: true },
  });

  const startOfToday = new Date(dayKey(new Date()) + "T00:00:00Z");

  const [totalStars, starsToday] = await Promise.all([
    prisma.starEvent.count({ where: { childProfileId: child.id } }),
    prisma.starEvent.count({ where: { childProfileId: child.id, createdAt: { gte: startOfToday } } }),
  ]);

  res.status(200).json({
    companion: child.companion,
    mascotName: child.mascotName,
    // Nombre que el niño le puso a cada mascota — la pantalla de editar la
    // mascota lo recupera al volver a elegir una.
    mascotNames: toMascotNames(child.mascotNames),
    interests: child.interests,
    totalStars,
    starsToday,
    streak: computeStreak(sessions.map((s) => s.startedAt)),
    ...rankFromStars(totalStars),
  });
});
