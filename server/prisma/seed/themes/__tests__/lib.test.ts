import { describe, expect, it } from "vitest";
import { baseKeyOf, numbersIn, withThemes, type ThemeFile } from "../lib.js";
import { block, type SkillBlock } from "../../lib.js";

const skill = { grade: 1, axis: "Números y operaciones", name: "Sumas" };

function blocks(): SkillBlock[] {
  return [
    block(skill, [
      {
        prompt: "Ana tiene 6 lápices y compra 7 más. ¿Cuántos tiene?",
        promptEn: "Ana has 6 pencils and buys 7 more. How many does she have?",
        procedureNote: "Cuenta hacia adelante.",
        procedureNoteEn: "Count forward.",
        difficultyLevel: 2,
        visual: { kind: "combine", a: 6, b: 7, emoji: "🔵" },
        options: [
          { label: "13", isCorrect: true },
          { label: "1", isCorrect: false, errorTypeId: "E1_OP" },
          { label: "12", isCorrect: false, errorTypeId: "E2_CAL" },
          { label: "14", isCorrect: false, errorTypeId: "E2_CAL" },
        ],
      },
    ]),
  ];
}

const variant = {
  grade: 1,
  skill: "Sumas",
  base: "Ana tiene 6 lápices y compra 7 más. ¿Cuántos tiene?",
  prompt: "Un piloto recorre 6 planetas y luego 7 más. ¿Cuántos visitó?",
  promptEn: "A pilot visits 6 planets and then 7 more. How many did they visit?",
  procedureNote: "Avanza contando desde el primer número.",
  procedureNoteEn: "Count on from the first number.",
  emoji: "🪐",
};

const file = (v: Partial<typeof variant> = {}): ThemeFile => ({ theme: "espacio", variants: [{ ...variant, ...v }] });

describe("withThemes", () => {
  it("hereda opciones y nivel del base, cambia el emoji del visual y enlaza con baseKey", () => {
    const { blocks: out, problems } = withThemes(blocks(), [file()]);
    expect(problems).toEqual([]);
    const [base, themed] = out[0]!.exercises;
    const key = baseKeyOf(1, "Sumas", variant.base);
    expect(base!.baseKey).toBe(key);
    expect(themed!.baseKey).toBe(key);
    expect(themed!.theme).toBe("espacio");
    expect(themed!.difficultyLevel).toBe(2);
    expect(themed!.options).toEqual(base!.options);
    expect(themed!.options).not.toBe(base!.options);
    expect(themed!.visual).toEqual({ kind: "combine", a: 6, b: 7, emoji: "🪐" });
  });

  it("sin emoji omite un visual con emoji (para no mostrar 🔵 en otra historia)", () => {
    const { blocks: out } = withThemes(blocks(), [file({ emoji: undefined })]);
    expect(out[0]!.exercises[1]!.visual).toBeNull();
  });

  it("no muta los bloques de entrada", () => {
    const input = blocks();
    withThemes(input, [file()]);
    expect(input[0]!.exercises).toHaveLength(1);
    expect(input[0]!.exercises[0]!.baseKey).toBeUndefined();
  });

  it("rechaza variantes con números distintos al base, en español o en inglés", () => {
    expect(withThemes(blocks(), [file({ prompt: "Un piloto recorre 6 planetas y luego 8 más. ¿Cuántos visitó?" })]).problems.join()).toMatch(/números del enunciado/);
    expect(withThemes(blocks(), [file({ promptEn: "A pilot visits 6 planets and then 9 more." })]).problems.join()).toMatch(/promptEn/);
  });

  it("rechaza base inexistente, contenido inexistente, tema desconocido, prompt repetido y pista que revela la respuesta", () => {
    expect(withThemes(blocks(), [file({ base: "otro enunciado" })]).problems.join()).toMatch(/base no existe/);
    expect(withThemes(blocks(), [file({ skill: "Restas" })]).problems.join()).toMatch(/contenido inexistente/);
    expect(withThemes(blocks(), [{ theme: "unicornios", variants: [variant] }]).problems.join()).toMatch(/tema desconocido/);
    expect(withThemes(blocks(), [file({ prompt: variant.base })]).problems.join()).toMatch(/ya existe/);
    expect(withThemes(blocks(), [file({ procedureNote: "El resultado es 13." })]).problems.join()).toMatch(/revela/);
  });

  it("no permite dos variantes del mismo tema para el mismo base", () => {
    const f = file();
    f.variants.push({ ...variant, prompt: "Otra redacción con 6 y 7 planetas." });
    expect(withThemes(blocks(), [f]).problems.join()).toMatch(/ya hay una variante/);
  });
});

describe("numbersIn", () => {
  it("extrae los números con separadores, ordenados", () => {
    expect(numbersIn("Tiene 1.250 y 3,5 y 7")).toEqual(["1.250", "3,5", "7"]);
  });
});
