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
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  it("al confirmar, crea el consentimiento y llama onConsented con su id", async () => {
    mocks.createConsent.mockResolvedValue({ id: "consent-123", scope: "x", grantedAt: "now" });
    const onConsented = vi.fn();

    render(<ConsentScreen onConsented={onConsented} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onConsented).toHaveBeenCalledWith("consent-123");
  });
});
