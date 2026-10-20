import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChooseInterestScreen } from "./ChooseInterestScreen.js";

const mocks = vi.hoisted(() => ({ setInterests: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ setInterests: mocks.setInterests }));

describe("ChooseInterestScreen", () => {
  it("no permite continuar sin elegir ningún interés", () => {
    render(<ChooseInterestScreen childId="child-1" onDone={vi.fn()} />);
    expect(screen.getByRole("button", { name: "¡Listo, empezar!" })).toBeDisabled();
  });

  it("ofrece los 10 intereses", () => {
    render(<ChooseInterestScreen childId="child-1" onDone={vi.fn()} />);
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(10);
  });

  it("guarda varios intereses y llama onDone con la selección", async () => {
    mocks.setInterests.mockResolvedValue({ id: "child-1", interests: ["futbol", "cocina"] });
    const onDone = vi.fn();

    render(<ChooseInterestScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Fútbol/ }));
    await user.click(screen.getByRole("button", { name: /Cocina/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    expect(mocks.setInterests).toHaveBeenCalledWith("child-1", ["futbol", "cocina"]);
    expect(onDone).toHaveBeenCalledWith(["futbol", "cocina"]);
  });

  it("al llegar a 3 deshabilita los demás, y desmarcar uno los vuelve a habilitar", async () => {
    render(<ChooseInterestScreen childId="child-1" onDone={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Fútbol/ }));
    await user.click(screen.getByRole("button", { name: /Animales/ }));
    await user.click(screen.getByRole("button", { name: /Música/ }));

    expect(screen.getByText(/3\/3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vehículos/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Fútbol/ })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /Fútbol/ }));
    expect(screen.getByRole("button", { name: /Vehículos/ })).toBeEnabled();
  });

  it("al editar arranca con lo ya elegido marcado", () => {
    render(<ChooseInterestScreen childId="child-1" initial={["espacio"]} onDone={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Espacio/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "¡Listo, empezar!" })).toBeEnabled();
  });

  it("avanza igual si falla el guardado — elegir intereses nunca bloquea", async () => {
    mocks.setInterests.mockRejectedValue(new Error("network"));
    const onDone = vi.fn();

    render(<ChooseInterestScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Animales/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    expect(onDone).toHaveBeenCalledWith(["animales"]);
  });
});
