/**
 * Rutas a las fotos de cada mascota, una por estado de ánimo — para que
 * reaccionar a un acierto o a un error se vea en la cara del personaje, no
 * solo en la animación de rebote sobre la misma foto (ver
 * BrickCompanionAvatar.tsx). Debe cubrir exactamente las 4 claves de
 * COMPANIONS (capi/buho/zorro/conejo) — ver companions.ts — y los 3 moods
 * de CompanionMood (ver BrickCompanionAvatar.tsx; se repite el tipo acá en
 * vez de importarlo para no crear una dependencia circular entre ambos
 * archivos).
 */
type MascotMood = "idle" | "happy" | "encourage";

const MASCOT_IMAGES: Record<string, Record<MascotMood, string>> = {
  capi: {
    idle: "/mascots/capi-idle.jpg",
    happy: "/mascots/capi-happy.jpg",
    encourage: "/mascots/capi-encourage.jpg",
  },
  buho: {
    idle: "/mascots/buho-idle.jpg",
    happy: "/mascots/buho-happy.jpg",
    encourage: "/mascots/buho-encourage.jpg",
  },
  zorro: {
    idle: "/mascots/zorro-idle.jpg",
    happy: "/mascots/zorro-happy.jpg",
    encourage: "/mascots/zorro-encourage.jpg",
  },
  conejo: {
    idle: "/mascots/conejo-idle.jpg",
    happy: "/mascots/conejo-happy.jpg",
    encourage: "/mascots/conejo-encourage.jpg",
  },
};

export function mascotImageForCompanion(key: string | null | undefined, mood: MascotMood = "idle"): string {
  const entry = MASCOT_IMAGES[key ?? ""] ?? MASCOT_IMAGES.capi!;
  return entry[mood];
}
