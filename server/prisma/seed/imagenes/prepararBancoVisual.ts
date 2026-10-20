/**
 * Prepara el paquete "banco_visual_completo_1a6_basico" para la app:
 *
 *   npx tsx prisma/seed/imagenes/prepararBancoVisual.ts <carpeta-del-paquete>
 *
 * 1. Copia public/exercise-images → client/public/exercise-images (PNG para
 *    mostrar, SVG de precisión), sin borrar nada que ya exista.
 * 2. Escribe banco_visual.json (junto a este archivo): por exerciseId, solo
 *    lo que la app necesita — ruta y tamaño del PNG, alt bilingüe, letras que
 *    aparecen dibujadas (A, B, C…), rowLabels, optionBindings y, SOLO para
 *    verificar leyendas en el servidor, los valores de barras/pictogramas.
 *    visualData completo y parámetros del generador nunca se guardan.
 *
 * El vínculo con la BD (exclusivamente por exerciseId) lo hace
 * bancoVisual.ts desde `npm run bank:images`.
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

interface ManifestEntry {
  exerciseId: string;
  grade: number;
  prompt: { es: string; en: string };
  image: { path: string; svgPath: string | null; alt: { es: string; en: string } };
  visualData: { kind: string; values?: number[]; scale?: number } & Record<string, unknown>;
  legend: { es: string; en: string };
  optionBindings: string[] | null;
  rowLabels?: Array<{ key: string; label: { es: string; en: string } }>;
}

export interface BancoVisualEntry {
  exerciseId: string;
  grade: number;
  /** Enunciado del paquete — para verificar que coincide con la BD. */
  prompt: { es: string; en: string };
  kind: string;
  src: string;
  svgSrc: string | null;
  width: number;
  height: number;
  alt: { es: string; en: string };
  /** Letras de referencia dibujadas en la imagen, en orden (A, B, C…). */
  letters: string[];
  rowLabels?: Array<{ key: string; label: { es: string; en: string } }>;
  optionBindings?: string[];
  /** Solo barras/pictogramas: valores por letra, para verificar nombres. */
  values?: number[];
  /** Solo pictogramas: cuánto vale cada dibujo (1, 2, 5, 10…). */
  scale?: number;
}

export interface BancoVisualFile {
  genericLegend: { es: string; en: string };
  entries: BancoVisualEntry[];
}

function pngSize(file: string): { width: number; height: number } {
  const b = readFileSync(file);
  if (b.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error(`No es PNG: ${file}`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function lettersIn(svgFile: string | null): string[] {
  if (!svgFile || !existsSync(svgFile)) return [];
  const texts = [...readFileSync(svgFile, "utf8").matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!.trim());
  return [...new Set(texts.filter((t) => /^[A-H]$/.test(t)))];
}

function main(pkgDir: string) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.resolve(here, "../../../../client/public");
  const manifest = JSON.parse(readFileSync(path.join(pkgDir, "imagenes_manifest.json"), "utf8")) as ManifestEntry[];

  cpSync(path.join(pkgDir, "public/exercise-images"), path.join(publicDir, "exercise-images"), { recursive: true });

  const entries: BancoVisualEntry[] = manifest.map((m) => {
    const png = path.join(publicDir, m.image.path);
    const svg = m.image.svgPath ? path.join(publicDir, m.image.svgPath) : null;
    const kind = m.visualData.kind;
    return {
      exerciseId: m.exerciseId,
      grade: m.grade,
      prompt: m.prompt,
      kind,
      src: m.image.path,
      svgSrc: m.image.svgPath,
      ...pngSize(png),
      alt: m.image.alt,
      letters: lettersIn(svg),
      ...(m.rowLabels?.length ? { rowLabels: m.rowLabels } : {}),
      ...(m.optionBindings?.length ? { optionBindings: m.optionBindings } : {}),
      ...((kind === "bars" || kind === "pictogram") && m.visualData.values ? { values: m.visualData.values } : {}),
      ...(kind === "pictogram" ? { scale: m.visualData.scale ?? 1 } : {}),
    };
  });

  const out: BancoVisualFile = { genericLegend: manifest[0]!.legend, entries };
  writeFileSync(path.join(here, "banco_visual.json"), JSON.stringify(out, null, 1) + "\n");
  console.log(`OK: ${entries.length} entradas en banco_visual.json; imágenes copiadas a client/public/exercise-images.`);
}

const pkg = process.argv[2];
if (!pkg) {
  console.error("Uso: npx tsx prisma/seed/imagenes/prepararBancoVisual.ts <carpeta-del-paquete>");
  process.exitCode = 1;
} else {
  main(path.resolve(pkg));
}
