import type { Lang } from "./i18n.js";

export interface Interest {
  key: string;
  emoji: string;
  color: string;
  es: string;
  en: string;
}

/** Máximo de intereses por niño (server: MAX_INTERESTS). */
export const MAX_INTERESTS = 3;

/** Debe reflejar exactamente INTEREST_KEYS del servidor (server/src/domain/interests.ts). */
export const INTERESTS: Interest[] = [
  { key: "futbol", emoji: "⚽", color: "#0B7FB0", es: "Fútbol", en: "Soccer" },
  { key: "animales", emoji: "🦊", color: "#16A34A", es: "Animales", en: "Animals" },
  { key: "musica", emoji: "🎵", color: "#C97D0A", es: "Música", en: "Music" },
  { key: "videojuegos", emoji: "🎮", color: "#7C3AED", es: "Videojuegos", en: "Video games" },
  { key: "espacio", emoji: "🚀", color: "#1E3A8A", es: "Espacio y planetas", en: "Space and planets" },
  { key: "dinosaurios", emoji: "🦕", color: "#15803D", es: "Dinosaurios", en: "Dinosaurs" },
  { key: "cocina", emoji: "🧁", color: "#DB2777", es: "Cocina y repostería", en: "Cooking and baking" },
  { key: "naturaleza", emoji: "🌊", color: "#0891B2", es: "Naturaleza y mar", en: "Nature and sea" },
  { key: "deportes", emoji: "🏀", color: "#EA580C", es: "Otros deportes", en: "Other sports" },
  { key: "vehiculos", emoji: "🚗", color: "#DC2626", es: "Vehículos", en: "Vehicles" },
];

export function interestName(interest: Interest, lang: Lang): string {
  return lang === "en" ? interest.en : interest.es;
}

/** Busca un interés por clave — para temar puntualmente una pantalla (p. ej. la
 * práctica) según el primer interés elegido por el niño. `undefined` si no
 * existe la clave o el niño no tiene intereses (perfil sin elegir aún). */
export function interestByKey(key: string | undefined): Interest | undefined {
  return INTERESTS.find((i) => i.key === key);
}
