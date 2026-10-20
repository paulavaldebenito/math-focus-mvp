import type { SkillBlock } from "../lib.js";
import { withThemes, type ThemeFile, type ThemedResult } from "./lib.js";
import futbol from "./futbol.js";
import animales from "./animales.js";
import musica from "./musica.js";
import videojuegos from "./videojuegos.js";
import espacio from "./espacio.js";
import dinosaurios from "./dinosaurios.js";
import cocina from "./cocina.js";
import naturaleza from "./naturaleza.js";
import deportes from "./deportes.js";
import vehiculos from "./vehiculos.js";

/// Un archivo por interés (`<clave>.ts`, export default `ThemeFile`).
export const THEME_FILES: ThemeFile[] = [
  futbol,
  animales,
  musica,
  videojuegos,
  espacio,
  dinosaurios,
  cocina,
  naturaleza,
  deportes,
  vehiculos,
];

/// Bloques de UN curso con sus variantes temáticas. Filtra las variantes por
/// curso para poder validar un curso sin cargar los demás.
export function themedBlocks(grade: number, blocks: SkillBlock[]): ThemedResult {
  return withThemes(
    blocks,
    THEME_FILES.map((f) => ({ theme: f.theme, variants: f.variants.filter((v) => v.grade === grade) })),
  );
}
