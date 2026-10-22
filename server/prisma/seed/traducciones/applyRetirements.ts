/**
 * Ejercicios retirados por la revisión pedagógica (specs/017): ver
 * ejercicios_retirados.json. No se borran —los intentos los referencian y el
 * historial del niño se conserva—: se marcan `retired` y dejan de entregarse
 * en práctica, evaluación inicial y modo revisión.
 *
 * Cada entrada nombra un ejercicio base por id. `alcance`:
 * - "familia": el base y todas sus variantes temáticas (el problema tenía un
 *   defecto de fondo y se reemplaza por uno nuevo).
 * - "variantes": solo las variantes; el base se conserva con su enunciado
 *   editado (p. ej. un gráfico cuyo dato venía escrito en el texto: el base se
 *   corrige en enunciados_editados.json y las variantes, que repiten el dato,
 *   se retiran).
 *
 * Idempotente. Nunca "des-retira": sacar una entrada del JSON no reactiva el
 * ejercicio en una BD existente (eso sería una decisión explícita).
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "../../../src/generated/prisma/client.js";

export interface Retirement {
  exerciseId: string;
  /// Enunciado del base, solo para que el JSON se lea solo.
  prompt: string;
  alcance: "familia" | "variantes";
  motivo: string;
}

export function loadRetirements(): Retirement[] {
  return JSON.parse(readFileSync(new URL("./ejercicios_retirados.json", import.meta.url), "utf8")) as Retirement[];
}

export async function applyRetirements(
  prisma: PrismaClient,
): Promise<{ written: number; already: number; problems: string[] }> {
  const report = { written: 0, already: 0, problems: [] as string[] };
  for (const r of loadRetirements()) {
    const base = await prisma.exercise.findUnique({ where: { id: r.exerciseId }, select: { baseKey: true } });
    if (!base) {
      report.problems.push(`${r.exerciseId}: no existe (retiro)`);
      continue;
    }
    const family = base.baseKey
      ? { OR: [{ id: r.exerciseId }, { baseKey: base.baseKey }] }
      : { id: r.exerciseId };
    const where = r.alcance === "variantes" ? { AND: [family, { theme: { not: null } }] } : family;
    const res = await prisma.exercise.updateMany({ where: { AND: [where, { retired: false }] }, data: { retired: true } });
    report.written += res.count;
    report.already += await prisma.exercise.count({ where: { AND: [where, { retired: true }] } }) - res.count;
  }
  return report;
}
