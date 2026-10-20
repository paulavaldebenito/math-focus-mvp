import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MATH_MOVEMENT_EXERCISES, MOVEMENT_EXERCISES } from "../lib/pauses.js";
import { MovementPause } from "./MovementPause.js";
import { companionByKey } from "../lib/companions.js";

describe("MovementPause", () => {
  it("muestra la mascota del niño acompañando el ejercicio de movimiento", () => {
    const { container } = render(<MovementPause lang="es" companion={companionByKey("zorro")} onDone={() => {}} />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });
  it("la mascota se mueve imitando el ejercicio (su animación depende del tipo de movimiento)", () => {
    const { container } = render(
      <MovementPause lang="es" companion={companionByKey("zorro")} grade={1} onDone={() => {}} />,
    );
    const mascot = container.querySelector(".mascot-exercise")!;
    const motion = mascot.getAttribute("data-motion")!;
    const shown = MATH_MOVEMENT_EXERCISES.find((e) => screen.queryByText(e.es))!;
    expect(shown.motion).toBe(motion);
    expect(mascot).toHaveClass(`mascot-motion-${motion}`);
    expect(mascot.querySelector("img")).toBeInTheDocument();
  });

  it("si elige hacerlo sentado/a, la mascota lo acompaña con un movimiento más suave", () => {
    const { container } = render(<MovementPause lang="es" companion={companionByKey("zorro")} onDone={() => {}} />);
    expect(container.querySelector(".mascot-exercise")).not.toHaveClass("seated");
    fireEvent.click(screen.getByRole("button", { name: /sentado/i }));
    expect(container.querySelector(".mascot-exercise")).toHaveClass("seated");
  });

  it("cada ejercicio de movimiento tiene un movimiento de mascota", () => {
    for (const e of [...MOVEMENT_EXERCISES, ...MATH_MOVEMENT_EXERCISES]) expect(e.motion, e.key).toBeTruthy();
  });
});
