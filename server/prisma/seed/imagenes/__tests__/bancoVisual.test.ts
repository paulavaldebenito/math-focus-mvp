import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildLegend, emojiPictograph, loadBancoVisual, namesFromPrompt, publicLegend, toImage, type ExerciseForLegend } from "../bancoVisual.js";
import type { BancoVisualEntry } from "../prepararBancoVisual.js";

const GENERIC = { es: "A, B, C… siguen el orden…", en: "A, B, C… follow the order…" };

const entry = (over: Partial<BancoVisualEntry>): BancoVisualEntry => ({
  exerciseId: "ex1",
  grade: 1,
  prompt: { es: "p", en: "p" },
  kind: "bars",
  src: "/exercise-images/1b__ex1__bars.png",
  svgSrc: "/exercise-images/1b__ex1__bars.svg",
  width: 1000,
  height: 650,
  alt: { es: "Apoyo visual. p", en: "Visual support. p" },
  letters: ["A", "B"],
  ...over,
});

const exercise = (over: Partial<ExerciseForLegend>): ExerciseForLegend => ({
  prompt: "p",
  promptEn: "p",
  options: [
    { id: "o1", label: "6", labelEn: null, isCorrect: true },
    { id: "o2", label: "4", labelEn: null, isCorrect: false },
  ],
  ...over,
});

describe("namesFromPrompt — nombres de categorías solo si se pueden verificar", () => {
  it("extrae los nombres cuando los números del enunciado calzan exactos con las barras", () => {
    expect(
      namesFromPrompt("En un gráfico de barras, la barra de los perros llega hasta el 6 y la de los gatos hasta el 4.", [6, 4], "es"),
    ).toEqual(["perros", "gatos"]);
    expect(namesFromPrompt("In a bar graph, the dogs' bar reaches 6 and the cats' bar reaches 4.", [6, 4], "en")).toEqual([
      "dogs",
      "cats",
    ]);
    expect(namesFromPrompt("Cada dibujo vale 1 fruta. Manzanas: 🍎🍎🍎🍎. Plátanos: 🍌🍌. ¿Cuántas?", [4, 2], "es")).toEqual([
      "Manzanas",
      "Plátanos",
    ]);
  });

  it("no adivina: si los valores no calzan o el fragmento no es un nombre limpio, devuelve null", () => {
    expect(namesFromPrompt("La barra de los perros llega al 6 y la de los gatos al 5.", [6, 4], "es")).toBeNull();
    expect(namesFromPrompt("El lunes hay 3 símbolos y el martes 5.", [3, 5], "es")).toBeNull();
    expect(namesFromPrompt("La biblioteca tuvo 20 visitas el lunes, 30 el martes.", [20, 30], "es")).toBeNull();
  });
});

describe("buildLegend", () => {
  it("barras con nombres verificados en ambos idiomas: leyenda con nombres", () => {
    const legend = buildLegend(
      entry({ values: [6, 4] }),
      exercise({ prompt: "Gráfico: perros 6 y gatos 4.", promptEn: "Graph: dogs 6 and cats 4." }),
      GENERIC,
    );
    expect(legend).toEqual({
      type: "named",
      source: "prompt",
      items: [
        { key: "A", label: { es: "perros", en: "dogs" } },
        { key: "B", label: { es: "gatos", en: "cats" } },
      ],
    });
  });

  it("si en un idioma no se puede verificar, usa la leyenda genérica", () => {
    const legend = buildLegend(entry({ values: [6, 4] }), exercise({ prompt: "Gráfico: perros 6 y gatos 4.", promptEn: "Graph." }), GENERIC);
    expect(legend).toMatchObject({ type: "generic", text: GENERIC, reason: "nombres_no_verificables" });
  });

  it("rowLabels de fracciones: se usan, salvo que revelen la respuesta", () => {
    const rowLabels = [{ key: "A", label: { es: "1/3", en: "1/3" } }];
    const fr = entry({ kind: "fractions", letters: ["A"], rowLabels });
    const reveals = exercise({
      options: [
        { id: "a", label: "1/3", labelEn: null, isCorrect: true },
        { id: "b", label: "3/1", labelEn: null, isCorrect: false },
      ],
    });
    expect(buildLegend(fr, reveals, GENERIC)).toMatchObject({ type: "generic", reason: "rowLabels_revela_respuesta" });

    const safe = exercise({
      options: [
        { id: "a", label: "3", labelEn: null, isCorrect: true },
        { id: "b", label: "2", labelEn: null, isCorrect: false },
      ],
    });
    expect(buildLegend(fr, safe, GENERIC)).toMatchObject({ type: "named", source: "rowLabels" });
  });

  it("rowLabels que solo repiten las alternativas (¿cuál es la mayor?) sí se muestran", () => {
    const labels = ["1/2", "1/3"];
    const fr = entry({
      kind: "fractions",
      letters: ["A", "B"],
      rowLabels: labels.map((l, i) => ({ key: "AB"[i]!, label: { es: l, en: l } })),
    });
    const ex = exercise({ options: labels.map((l, i) => ({ id: l, label: l, labelEn: null, isCorrect: i === 0 })) });
    expect(buildLegend(fr, ex, GENERIC)).toMatchObject({ type: "named", source: "rowLabels" });
  });

  it("optionBindings: cada letra queda ligada al ID de su alternativa, con su texto en ambos idiomas", () => {
    const legend = buildLegend(
      entry({ kind: "shapes", letters: ["A", "B"], optionBindings: ["o2", "o1"] }),
      exercise({
        options: [
          { id: "o1", label: "círculo", labelEn: "circle", isCorrect: true },
          { id: "o2", label: "cuadrado", labelEn: "square", isCorrect: false },
        ],
      }),
      GENERIC,
    );
    expect(legend).toEqual({
      type: "named",
      source: "optionBindings",
      items: [
        { key: "A", optionId: "o2", label: { es: "cuadrado", en: "square" } },
        { key: "B", optionId: "o1", label: { es: "círculo", en: "circle" } },
      ],
    });
  });

  it("sin letras dibujadas no hay leyenda; letras que son las propias alternativas tampoco", () => {
    expect(buildLegend(entry({ kind: "clocks", letters: [] }), exercise({}), GENERIC)).toEqual({ type: "none" });
    expect(buildLegend(entry({ kind: "letters", letters: ["A", "F"] }), exercise({}), GENERIC)).toEqual({ type: "none" });
  });

  it("grupos sin nombre (p. ej. 6 + 7) usan la leyenda genérica del paquete", () => {
    expect(buildLegend(entry({ kind: "rows" }), exercise({}), GENERIC)).toMatchObject({ type: "generic", reason: "grupos_sin_nombre" });
  });
});

describe("toImage", () => {
  it("misma imagen para ambos idiomas, alt en inglés con el enunciado vigente y sin datos internos", () => {
    const e = entry({ kind: "rows", prompt: { es: "¿Cuánto es 6 + 7?", en: "How much is 6 + 7?" }, alt: { es: "Grupos. ¿Cuánto es 6 + 7?", en: "Groups. How much is 6 + 7?" } });
    const legend = buildLegend(e, exercise({}), GENERIC);
    const image = toImage(e, exercise({ prompt: "¿Cuánto es 6 + 7?", promptEn: "What is 6 + 7?" }), legend);
    expect(image.src).toEqual({ es: e.src, en: e.src });
    expect(image.alt).toEqual({ es: "Grupos. ¿Cuánto es 6 + 7?", en: "Groups. What is 6 + 7?" });
    expect(image.legend).toEqual({ type: "generic", text: GENERIC });
    expect(JSON.stringify(image)).not.toMatch(/reason|values|visualData/);
    expect(publicLegend({ type: "none" })).toEqual({ type: "none" });
  });

  it("con un enunciado editado, el alt en español también termina con el texto vigente", () => {
    const e = entry({ kind: "fractions", prompt: { es: "Ema usa 3 partes.", en: "Ema uses 3 parts." }, alt: { es: "Una barra. Ema usa 3 partes.", en: "A bar. Ema uses 3 parts." } });
    const image = toImage(e, exercise({ prompt: "Ema usa 2 partes.", promptEn: "Ema uses 2 parts." }), buildLegend(e, exercise({}), GENERIC));
    expect(image.alt).toEqual({ es: "Una barra. Ema usa 2 partes.", en: "A bar. Ema uses 2 parts." });
  });
});

describe("banco_visual.json", () => {
  const { entries } = loadBancoVisual();
  const publicDir = fileURLToPath(new URL("../../../../../client/public", import.meta.url));

  it("tiene 2.123 ejercicios únicos y las 4.153 rutas (2.123 PNG + 2.030 SVG; los dibujos nuevos de fracciones — dinosaurios, comida redonda y rectángulos — son solo PNG) existen en client/public", () => {
    expect(entries).toHaveLength(2123);
    expect(new Set(entries.map((e) => e.exerciseId)).size).toBe(2123);
    const paths = entries.flatMap((e) => (e.svgSrc ? [e.src, e.svgSrc] : [e.src]));
    expect(paths.filter((p) => p.endsWith(".png"))).toHaveLength(2123);
    expect(paths.filter((p) => p.endsWith(".svg"))).toHaveLength(2030);
    expect(paths.filter((p) => !existsSync(publicDir + p))).toEqual([]);
  });

  it("cada ruta pertenece a su curso y a su ejercicio", () => {
    for (const e of entries) expect(e.src.startsWith(`/exercise-images/${e.grade}b__${e.exerciseId}__`), e.exerciseId).toBe(true);
  });
});

describe("emojiPictograph — pictogramas de 1.° y 2.° con emojis", () => {
  const pic = (over: Partial<BancoVisualEntry>) =>
    entry({ kind: "pictogram", grade: 1, values: [4, 2], scale: 1, letters: ["A", "B"], ...over });
  const ex = exercise({
    prompt: "Cada dibujo vale 1 fruta. Manzanas: 🍎🍎🍎🍎. Plátanos: 🍌🍌. ¿Cuántas manzanas hay?",
    promptEn: "Each picture stands for 1 fruit. Apples: 🍎🍎🍎🍎. Bananas: 🍌🍌. How many apples are there?",
  });

  it("toma de cada fila del enunciado su emoji, su cantidad y su nombre en ambos idiomas", () => {
    expect(emojiPictograph(pic({}), ex)).toEqual([
      { emoji: "🍎", count: 4, label: { es: "Manzanas", en: "Apples" } },
      { emoji: "🍌", count: 2, label: { es: "Plátanos", en: "Bananas" } },
    ]);
  });

  it("filas con el mismo emoji se distinguen por su nombre", () => {
    const soccer = exercise({
      prompt: "Cada dibujo vale 1 gol. Lunes: ⚽⚽⚽. Viernes: ⚽⚽. ¿Cuántos?",
      promptEn: "Each picture stands for 1 goal. Monday: ⚽⚽⚽. Friday: ⚽⚽. How many?",
    });
    expect(emojiPictograph(pic({ values: [3, 2] }), soccer)?.map((r) => r.label?.es)).toEqual(["Lunes", "Viernes"]);
  });

  it("solo 1.° y 2.° con escala 1, y solo si las filas calzan exactas con el gráfico", () => {
    expect(emojiPictograph(pic({ grade: 3 }), ex)).toBeNull();
    expect(emojiPictograph(pic({ scale: 5 }), ex)).toBeNull();
    expect(emojiPictograph(pic({ values: [4, 3] }), ex)).toBeNull();
    expect(emojiPictograph(pic({}), exercise({ prompt: "5 niños prefieren gatos y 7 perros." }))).toBeNull();
  });
});
