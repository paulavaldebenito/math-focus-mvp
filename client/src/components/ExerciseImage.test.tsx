import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExerciseImage } from "./ExerciseImage.js";
import { LangReactContext, type Lang } from "../lib/i18n.js";
import type { ExerciseImagePublic, ExerciseOptionPublic } from "../api/types.js";

const IMAGE: ExerciseImagePublic = {
  kind: "conteo",
  size: { es: { width: 640, height: 588 }, en: { width: 640, height: 600 } },
  src: { es: "/banco-imagenes/1_basico/es/abc.svg", en: "/banco-imagenes/1_basico/en/abc.svg" },
  alt: { es: "¿Cuánto es 6 + 7?", en: "What is 6 + 7?" },
};

function renderIn(lang: Lang, image: ExerciseImagePublic = IMAGE, options?: ExerciseOptionPublic[]) {
  return render(
    <LangReactContext.Provider value={{ lang, setLang: () => {} }}>
      <ExerciseImage image={image} options={options} />
    </LangReactContext.Provider>,
  );
}

describe("ExerciseImage", () => {
  it("en español usa el SVG, el texto alternativo y la proporción de la versión española", () => {
    renderIn("es");
    const img = screen.getByRole("img", { name: "¿Cuánto es 6 + 7?" });
    expect(img).toHaveAttribute("src", "/banco-imagenes/1_basico/es/abc.svg");
    expect(img).toHaveAttribute("width", "640");
    expect(img).toHaveAttribute("height", "588");
  });

  it("en inglés cambia el archivo, el texto alternativo y la proporción", () => {
    renderIn("en");
    const img = screen.getByRole("img", { name: "What is 6 + 7?" });
    expect(img).toHaveAttribute("src", "/banco-imagenes/1_basico/en/abc.svg");
    expect(img).toHaveAttribute("height", "600");
    expect(screen.getByRole("button", { name: /Zoom in/ })).toBeInTheDocument();
  });

  it("se amplía en un diálogo que se cierra con el botón o con Escape", () => {
    renderIn("es");
    fireEvent.click(screen.getByRole("button", { name: /Ampliar imagen/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cerrar imagen/ })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: /Cerrar imagen/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ampliar imagen/ }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("la leyenda de las letras va fuera de la imagen y cambia con el idioma", () => {
    const image: ExerciseImagePublic = {
      ...IMAGE,
      legend: {
        type: "named",
        source: "prompt",
        items: [
          { key: "A", label: { es: "perros", en: "dogs" } },
          { key: "B", label: { es: "gatos", en: "cats" } },
        ],
      },
    };
    const { unmount } = renderIn("es", image);
    const legend = screen.getByRole("list", { name: "Qué significan las letras de la imagen" });
    expect(legend).toHaveTextContent("A perros");
    expect(legend).toHaveTextContent("B gatos");
    // Fuera del botón de la imagen (no es parte de la imagen ni de su alt).
    expect(screen.getByRole("button", { name: /Ampliar imagen/ })).not.toContainElement(legend);
    unmount();

    renderIn("en", image);
    expect(screen.getByRole("list", { name: "What the letters in the picture mean" })).toHaveTextContent("A dogs");
  });

  it("una letra ligada a una opción muestra el texto actual de ESA opción por su ID, aunque las opciones estén mezcladas", () => {
    const image: ExerciseImagePublic = {
      ...IMAGE,
      legend: {
        type: "named",
        source: "optionBindings",
        items: [
          { key: "A", optionId: "o-circle", label: { es: "círculo", en: "circle" } },
          { key: "B", optionId: "o-square", label: { es: "cuadrado", en: "square" } },
        ],
      },
    };
    // Orden mezclado: el cuadrado primero.
    const shuffled: ExerciseOptionPublic[] = [
      { id: "o-square", label: "cuadrado", labelEn: "square" },
      { id: "o-circle", label: "círculo", labelEn: "circle" },
    ];
    renderIn("en", image, shuffled);
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["A circle", "B square"]);
  });

  it("sin nombres verificables muestra la leyenda genérica como nota; sin letras, nada", () => {
    const { unmount } = renderIn("es", { ...IMAGE, legend: { type: "generic", text: { es: "A, B, C… siguen el orden", en: "A, B, C… follow the order" } } });
    expect(screen.getByText("A, B, C… siguen el orden")).toBeInTheDocument();
    unmount();
    renderIn("es", { ...IMAGE, legend: { type: "none" } });
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
