import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChooseCompanionScreen } from "./ChooseCompanionScreen.js";

const mocks = vi.hoisted(() => ({ setCompanion: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ setCompanion: mocks.setCompanion }));

describe("ChooseCompanionScreen", () => {
  it("no permite continuar sin elegir un compañero", () => {
    render(<ChooseCompanionScreen childId="child-1" onDone={vi.fn()} />);
    expect(screen.getByRole("button", { name: "¡Listo, empezar!" })).toBeDisabled();
  });

  it("guarda el compañero elegido y llama onDone", async () => {
    mocks.setCompanion.mockResolvedValue({ id: "child-1", companion: "zorro" });
    const onDone = vi.fn();

    render(<ChooseCompanionScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Zorro/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    expect(mocks.setCompanion).toHaveBeenCalledWith("child-1", "zorro");
    expect(onDone).toHaveBeenCalled();
  });

  it("avanza igual si falla el guardado — elegir compañero nunca bloquea", async () => {
    mocks.setCompanion.mockRejectedValue(new Error("network"));
    const onDone = vi.fn();

    render(<ChooseCompanionScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Capi/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    expect(onDone).toHaveBeenCalled();
  });
});
