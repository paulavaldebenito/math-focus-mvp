import { describe, expect, it } from "vitest";
import { loadImageIndex, matchImages, type ExerciseForMatch, type ImageIndexEntry } from "../linkImages.js";

const entry = (over: Partial<ImageIndexEntry> = {}): ImageIndexEntry => ({
  exerciseId: "idx1",
  grade: 1,
  skillName: "Adición y sustracción dentro de 20",
  theme: null,
  baseKey: "k1",
  prompt: "¿Cuánto es 6 + 7?",
  kind: "conteo",
  size: { es: { width: 640, height: 588 }, en: { width: 640, height: 588 } },
  src: { es: "/banco-imagenes/1_basico/es/idx1.svg", en: "/banco-imagenes/1_basico/en/idx1.svg" },
  alt: { es: "¿Cuánto es 6 + 7?", en: "How much is 6 + 7?" },
  ...over,
});

const exercise = (over: Partial<ExerciseForMatch> = {}): ExerciseForMatch => ({
  id: "idx1",
  grade: 1,
  skillName: "Adición y sustracción dentro de 20",
  theme: null,
  baseKey: "k1",
  prompt: "¿Cuánto es 6 + 7?",
  ...over,
});

describe("matchImages", () => {
  it("vincula por id cuando curso, habilidad, tema, baseKey y enunciado coinciden", () => {
    const [r] = matchImages([entry()], [exercise()]);
    expect(r).toMatchObject({ status: "by_id", exerciseId: "idx1" });
  });

  it("no vincula un id cuyo curso o tema no coincide — lo señala", () => {
    const [r] = matchImages([entry()], [exercise({ grade: 2, theme: "espacio" })]);
    expect(r).toMatchObject({ status: "id_mismatch", fields: ["grade", "theme"] });
  });

  it("sin el id (BD sembrada desde cero) busca una correspondencia única por contenido", () => {
    const [r] = matchImages([entry()], [exercise({ id: "otro" })]);
    expect(r).toMatchObject({ status: "by_content", exerciseId: "otro" });
  });

  it("dos candidatos por contenido es ambiguo y no se vincula", () => {
    const [r] = matchImages([entry()], [exercise({ id: "a" }), exercise({ id: "b" })]);
    expect(r).toMatchObject({ status: "ambiguous", candidates: ["a", "b"] });
  });

  it("una variante temática con el mismo enunciado base no se confunde con el ejercicio neutro", () => {
    const [r] = matchImages([entry()], [exercise({ id: "t", theme: "espacio" })]);
    expect(r.status).toBe("not_found");
  });
});

describe("indice_imagenes.json", () => {
  const index = loadImageIndex();

  it("tiene 798 ejercicios únicos, con ruta, tamaño y texto alternativo en ambos idiomas", () => {
    expect(index).toHaveLength(798);
    expect(new Set(index.map((e) => e.exerciseId)).size).toBe(798);
    for (const e of index) {
      for (const lang of ["es", "en"] as const) {
        expect(e.src[lang]).toMatch(new RegExp(`^/banco-imagenes/${e.grade}_basico/${lang}/${e.exerciseId}\\.(svg|jpg|png)$`));
        expect(e.alt[lang].length).toBeGreaterThan(0);
        expect(e.size[lang].width).toBeGreaterThan(0);
        expect(e.size[lang].height).toBeGreaterThan(0);
      }
    }
  });
});
