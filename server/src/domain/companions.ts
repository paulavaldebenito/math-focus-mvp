/// Catálogo cerrado de compañeros elegibles. El servidor solo valida la
/// clave — nombre/emoji/color son responsabilidad del cliente, para no
/// duplicar contenido de presentación en el backend.
export const COMPANION_KEYS = ["capi", "buho", "zorro", "conejo"] as const;

export type CompanionKey = (typeof COMPANION_KEYS)[number];

export function isCompanionKey(value: unknown): value is CompanionKey {
  return typeof value === "string" && (COMPANION_KEYS as readonly string[]).includes(value);
}
