/**
 * Imágenes quitadas por la revisión pedagógica (specs/017): imagenes_quitadas.json. Son ejercicios
 * cuya imagen era la respuesta (el número o la descomposición pedidos). La entrada ya no está en
 * banco_visual.json, así que una BD nueva nunca la vincula; en una BD existente hay que borrar el
 * `image` que quedó de antes. Idempotente.
 */
import { readFileSync } from "node:fs";
import { Prisma, type PrismaClient } from "../../../src/generated/prisma/client.js";

export interface ImageRemoval {
  exerciseId: string;
  prompt: string;
  motivo: string;
}

export function loadImageRemovals(): ImageRemoval[] {
  return JSON.parse(readFileSync(new URL("./imagenes_quitadas.json", import.meta.url), "utf8")) as ImageRemoval[];
}

export async function applyImageRemovals(prisma: PrismaClient): Promise<{ cleared: number }> {
  const ids = loadImageRemovals().map((r) => r.exerciseId);
  const res = await prisma.exercise.updateMany({
    where: { id: { in: ids }, NOT: { image: { equals: Prisma.DbNull } } },
    data: { image: Prisma.DbNull },
  });
  return { cleared: res.count };
}
