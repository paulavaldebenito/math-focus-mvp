import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseVisual } from "./ExerciseVisual.js";
import { interestByKey } from "../lib/interests.js";

describe("ExerciseVisual", () => {
  it("contenido neutro (emoji por defecto) se personaliza con el interés del niño", () => {
    const espacio = interestByKey("espacio")!;
    render(<ExerciseVisual visual={{ kind: "combine", a: 2, b: 1, emoji: "🔵" }} interest={espacio} />);

    expect(screen.getAllByText("🚀")).toHaveLength(3);
    expect(screen.queryByText("🔵")).not.toBeInTheDocument();
  });

  it("un emoji ya temático por el contenido (no el por defecto) nunca se reemplaza", () => {
    const espacio = interestByKey("espacio")!;
    render(<ExerciseVisual visual={{ kind: "combine", a: 2, b: 1, emoji: "🐟" }} interest={espacio} />);

    expect(screen.getAllByText("🐟")).toHaveLength(3);
    expect(screen.queryByText("🚀")).not.toBeInTheDocument();
  });

  it("sin interés elegido, el contenido neutro cae de vuelta al emoji por defecto de siempre", () => {
    render(<ExerciseVisual visual={{ kind: "combine", a: 1, b: 1, emoji: "🔵" }} />);
    expect(screen.getAllByText("🔵")).toHaveLength(2);
  });

  it("en 'takeaway', lo quitado se marca sin cambiar el total de íconos mostrados", () => {
    const { container } = render(<ExerciseVisual visual={{ kind: "takeaway", total: 5, removed: 2, emoji: "⭐" }} />);
    expect(container.querySelectorAll(".pictorial-icon")).toHaveLength(5);
    expect(container.querySelectorAll(".pictorial-icon.removed")).toHaveLength(2);
  });

  it("sobre el umbral de bloques (>20), se muestra en decenas + unidades sueltas", () => {
    const { container } = render(<ExerciseVisual visual={{ kind: "combine", a: 23, b: 0, emoji: "⭐" }} />);
    expect(container.querySelectorAll(".pictorial-ten")).toHaveLength(2);
    expect(container.querySelectorAll(".pictorial-icon")).toHaveLength(3);
  });
});
