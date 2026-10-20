/**
 * Nombre propio por mascota: cada una recuerda el nombre que el niño le
 * puso, así al cambiar de mascota y volver lo recupera. Funciones puras —
 * las rutas (routes/children.ts) solo leen y guardan el resultado.
 * `mascotName` del perfil es siempre el nombre de la mascota ACTUAL.
 */
export type MascotNames = Record<string, string>;

/// Normaliza lo que viene de la columna JSON (defensivo ante datos viejos).
export function toMascotNames(value: unknown): MascotNames {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "string" && v.trim() !== "")) as MascotNames;
}

/// Cambiar de mascota: guarda el nombre de la actual y recupera el que
/// ya tenía la nueva (null si nunca le puso uno — la UI usa el nombre por
/// defecto del personaje).
export function switchCompanion(
  names: MascotNames,
  current: { companion: string | null; mascotName: string | null },
  next: string,
): { mascotNames: MascotNames; mascotName: string | null } {
  const saved = { ...names };
  if (current.companion && current.mascotName) saved[current.companion] = current.mascotName;
  return { mascotNames: saved, mascotName: saved[next] ?? null };
}

/// Ponerle nombre a la mascota actual: también queda recordado para ella.
export function renameMascot(names: MascotNames, companion: string | null, name: string): MascotNames {
  return companion ? { ...names, [companion]: name } : { ...names };
}
