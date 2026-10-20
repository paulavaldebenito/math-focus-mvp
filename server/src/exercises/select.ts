import type { Prisma } from "../generated/prisma/client.js";

/// Proporción objetivo de ejercicios temáticos cuando el pool los tiene. El
/// resto es contenido neutro: siempre hay respaldo y el banco temático no se
/// agota antes que el neutro.
export const THEMED_SHARE = 0.7;

/// Ejercicios que un niño puede recibir: neutros (theme NULL) o de alguno de
/// SUS intereses — nunca de un tema ajeno. Sin intereses, solo neutros.
export function allowedThemeWhere(interests: readonly string[]): Prisma.ExerciseWhereInput {
  return interests.length > 0
    ? { OR: [{ theme: null }, { theme: { in: [...interests] } }] }
    : { theme: null };
}

/// Excluye lo ya intentado y las variantes del mismo problema base. `notIn`
/// sobre una columna nullable descartaría también los NULL, por eso el OR.
export function notAttemptedWhere(
  exerciseIds: readonly string[],
  baseKeys: readonly string[],
): Prisma.ExerciseWhereInput {
  return {
    AND: [
      { id: { notIn: [...exerciseIds] } },
      { OR: [{ baseKey: null }, { baseKey: { notIn: [...baseKeys] } }] },
    ],
  };
}

interface Pickable {
  theme: string | null;
}

/// Elige un ejercicio del pool: con probabilidad `themedShare` uno temático
/// (si el pool tiene) y si no uno neutro; si el cubo elegido está vacío usa
/// el otro. Dentro del cubo temático reparte parejo entre los INTERESES
/// presentes (no entre ejercicios), para que un interés con más variantes no
/// tape a los demás. `rng` es inyectable para pruebas determinísticas.
export function pickExercise<T extends Pickable>(
  pool: readonly T[],
  options: { themedShare?: number; rng?: () => number } = {},
): T | undefined {
  const { themedShare = THEMED_SHARE, rng = Math.random } = options;
  const themed = pool.filter((e) => e.theme !== null);
  const neutral = pool.filter((e) => e.theme === null);
  if (themed.length === 0 && neutral.length === 0) return undefined;

  const pickUniform = <U>(items: readonly U[]): U => items[Math.min(items.length - 1, Math.floor(rng() * items.length))]!;

  const useThemed = themed.length > 0 && (neutral.length === 0 || rng() < themedShare);
  if (!useThemed) return pickUniform(neutral);

  const byTheme = new Map<string, T[]>();
  for (const e of themed) {
    const list = byTheme.get(e.theme!) ?? [];
    list.push(e);
    byTheme.set(e.theme!, list);
  }
  const groups = [...byTheme.values()];
  return pickUniform(pickUniform(groups));
}
