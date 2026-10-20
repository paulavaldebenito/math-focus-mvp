import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BreathingPause } from "./BreathingPause.js";
import { companionByKey } from "../lib/companions.js";

describe("BreathingPause", () => {
  it("muestra la mascota del niño acompañando el ejercicio de respiración", () => {
    const { container } = render(
      <BreathingPause lang="es" companion={companionByKey("conejo")} onDone={() => {}} />,
    );
    expect(container.querySelector("img")).toBeInTheDocument();
  });
});
