import type { Lang } from "./i18n.js";

export interface Companion {
  key: string;
  emoji: string;
  color: string;
  bg: string;
  es: string;
  en: string;
}

/** Debe reflejar exactamente COMPANION_KEYS del servidor (server/src/domain/companions.ts). */
export const COMPANIONS: Companion[] = [
  { key: "capi", emoji: "🦫", color: "#A8641F", bg: "#F3E3CE", es: "Capi", en: "Capi" },
  { key: "buho", emoji: "🦉", color: "#235E58", bg: "#DCE9E6", es: "Buho", en: "Hoot" },
  { key: "zorro", emoji: "🦊", color: "#A87A18", bg: "#F1E4C4", es: "Zorro", en: "Fox" },
  { key: "conejo", emoji: "🐰", color: "#6B4C82", bg: "#E9E1EF", es: "Conejo", en: "Bunny" },
];

export function companionByKey(key: string | null | undefined): Companion {
  return COMPANIONS.find((c) => c.key === key) ?? COMPANIONS[0]!;
}

export function companionName(companion: Companion, lang: Lang): string {
  return lang === "en" ? companion.en : companion.es;
}
