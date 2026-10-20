/// Catálogo cerrado de intereses elegibles. El servidor solo valida la
/// clave — nombre/emoji/color son responsabilidad del cliente, para no
/// duplicar contenido de presentación en el backend.
export const INTEREST_KEYS = [
  "futbol",
  "animales",
  "musica",
  "videojuegos",
  "espacio",
  "dinosaurios",
  "cocina",
  "naturaleza",
  "deportes",
  "vehiculos",
] as const;

export type InterestKey = (typeof INTEREST_KEYS)[number];

/// Cuántos intereses puede tener a la vez un niño (mínimo 1 al elegir).
export const MAX_INTERESTS = 3;

export function isInterestKey(value: unknown): value is InterestKey {
  return typeof value === "string" && (INTEREST_KEYS as readonly string[]).includes(value);
}
