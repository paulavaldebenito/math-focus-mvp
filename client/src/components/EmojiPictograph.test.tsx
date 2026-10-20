import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmojiPictograph } from "./EmojiPictograph.js";
import { ExerciseIllustration } from "./ExerciseIllustration.js";
import { LangReactContext, type Lang } from "../lib/i18n.js";
import type { EmojiPictographPublic } from "../api/types.js";

const PICTO: EmojiPictographPublic = {
  kind: "pictograph",
  source: "emoji_pictograph",
  rows: [
    { emoji: "🍎", count: 4, label: { es: "Manzanas", en: "Apples" } },
    { emoji: "🍌", count: 2, label: { es: "Plátanos", en: "Bananas" } },
  ],
  alt: { es: "Pictograma de frutas", en: "Fruit pictograph" },
};

const inLang = (lang: Lang, ui: React.ReactNode) =>
  render(<LangReactContext.Provider value={{ lang, setLang: () => {} }}>{ui}</LangReactContext.Provider>);

describe("EmojiPictograph", () => {
  it("una fila por categoría con su nombre y tantos emojis como vale, sin letras A/B", () => {
    const { container } = inLang("es", <EmojiPictograph image={PICTO} />);
    expect(screen.getByRole("img", { name: "Pictograma de frutas" })).toBeInTheDocument();
    expect(screen.getByText("Manzanas")).toBeInTheDocument();
    expect(screen.getAllByText("🍎")).toHaveLength(4);
    expect(screen.getAllByText("🍌")).toHaveLength(2);
    expect(screen.getByText("Cada dibujo vale 1")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\bA\b|\bB\b/);
  });

  it("los nombres y la clave cambian con el idioma", () => {
    inLang("en", <EmojiPictograph image={PICTO} />);
    expect(screen.getByText("Apples")).toBeInTheDocument();
    expect(screen.getByText("Each picture stands for 1")).toBeInTheDocument();
  });
});

describe("ExerciseIllustration — un solo apoyo visual, nunca dos", () => {
  it("pictograma de emojis antes que el dibujo del descriptor", () => {
    const { container } = inLang("es", <ExerciseIllustration image={PICTO} visual={{ kind: "combine", a: 1, b: 1 }} />);
    expect(container.querySelector(".emoji-pictograph")).toBeInTheDocument();
    expect(container.querySelector(".pictorial-row")).toBeNull();
  });

  it("sin imagen, el dibujo de emojis del descriptor", () => {
    const { container } = inLang("es", <ExerciseIllustration visual={{ kind: "takeaway", total: 5, removed: 2, emoji: "🐒" }} />);
    expect(container.querySelector(".pictorial-row")).toBeInTheDocument();
    expect(screen.getAllByText("🐒")).toHaveLength(5);
  });
});
