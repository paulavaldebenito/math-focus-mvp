import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentScreen } from "./ConsentScreen.js";

const mocks = vi.hoisted(() => ({ createConsent: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ createConsent: mocks.createConsent }));

describe("ConsentScreen", () => {
  it("el botón de continuar está deshabilitado hasta marcar la casilla", async () => {
    render(<ConsentScreen onConsented={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();

    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox", { name: /doy mi consentimiento/ }));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  it("al confirmar, crea el consentimiento y llama onConsented con su id", async () => {
    mocks.createConsent.mockResolvedValue({ id: "consent-123", scope: "x", grantedAt: "now" });
    const onConsented = vi.fn();

    render(<ConsentScreen onConsented={onConsented} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox", { name: /doy mi consentimiento/ }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onConsented).toHaveBeenCalledWith("consent-123", false);
  });

  it("la pregunta social semanal es un consentimiento aparte y opcional (specs/018)", async () => {
    const user = userEvent.setup();
    const onConsented = vi.fn();
    mocks.createConsent.mockResolvedValue({ id: "consent-456", scope: "x", grantedAt: "2026-10-26" });
    render(<ConsentScreen onConsented={onConsented} />);
    await user.click(screen.getByRole("checkbox", { name: /doy mi consentimiento/ }));
    await user.click(screen.getByRole("checkbox", { name: /una vez por semana/ }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onConsented).toHaveBeenCalledWith("consent-456", true);
  });
});
