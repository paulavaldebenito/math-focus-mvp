import { prisma } from "../db/prisma.js";

const DEFAULT_STARTING_LEVEL = 2;

/** Nivel actual de un niño: la última decisión adaptativa registrada en
 * cualquiera de sus sesiones (incluida la evaluación inicial). Si no hay
 * ninguna todavía, se usa el nivel neutro de partida. */
export async function getCurrentLevelForChild(childId: string): Promise<number> {
  const lastDecision = await prisma.adaptiveDecision.findFirst({
    where: { session: { childProfileId: childId } },
    orderBy: { createdAt: "desc" },
  });
  return lastDecision?.newLevel ?? DEFAULT_STARTING_LEVEL;
}
