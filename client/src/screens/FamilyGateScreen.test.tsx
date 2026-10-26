import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FamilyGateScreen } from "./FamilyGateScreen.js";
import { ApiError } from "../api/client.js";

const mocks = vi.hoisted(() => ({ getFamilyStatus: vi.fn(), setFamilyPin: vi.fn(), unlockFamily: vi.fn() }));
vi.mock("../api/endpoints.js", () => mocks);

describe("FamilyGateScreen (espacio familia con PIN, specs/018)", () => {
  beforeEach(() => vi.resetAllMocks());

  it("sin PIN, pide crearlo con la contraseña de la cuenta y entra", async () => {
    mocks.getFamilyStatus.mockResolvedValue({ hasPin: false, unlocked: false, plan: "familia" });
    mocks.setFamilyPin.mockResolvedValue(undefined);
    const onUnlocked = vi.fn();
    render(<FamilyGateScreen onUnlocked={onUnlocked} onBack={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("PIN (4 dígitos)"), "2468");
    await user.type(screen.getByLabelText("Repite el PIN"), "2468");
    await user.type(screen.getByLabelText("Contraseña de tu cuenta"), "mi-clave");
    await user.click(screen.getByRole("button", { name: "Crear PIN y entrar" }));
    expect(mocks.setFamilyPin).toHaveBeenCalledWith("2468", "mi-clave");
    expect(onUnlocked).toHaveBeenCalled();
  });

  it("con PIN, un PIN equivocado no entra y dice cuántos intentos quedan", async () => {
    mocks.getFamilyStatus.mockResolvedValue({ hasPin: true, unlocked: false, plan: "familia" });
    mocks.unlockFamily.mockRejectedValue(new ApiError(401, { error: "wrong_pin", attemptsLeft: 3 }));
    const onUnlocked = vi.fn();
    render(<FamilyGateScreen onUnlocked={onUnlocked} onBack={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("PIN (4 dígitos)"), "1111");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("PIN incorrecto. Te quedan 3 intentos.");
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it("si ya estaba desbloqueado, entra directo", async () => {
    mocks.getFamilyStatus.mockResolvedValue({ hasPin: true, unlocked: true, plan: "familia" });
    const onUnlocked = vi.fn();
    render(<FamilyGateScreen onUnlocked={onUnlocked} onBack={vi.fn()} />);
    await vi.waitFor(() => expect(onUnlocked).toHaveBeenCalled());
  });
});
