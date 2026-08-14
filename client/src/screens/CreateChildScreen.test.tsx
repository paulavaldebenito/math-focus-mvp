import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateChildScreen } from "./CreateChildScreen.js";

const mocks = vi.hoisted(() => ({ createChild: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ createChild: mocks.createChild }));

describe("CreateChildScreen", () => {
  it("no permite continuar sin nombre", () => {
    render(<CreateChildScreen consentId="c1" onCreated={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });

  it("no permite continuar sin elegir curso", async () => {
    render(<CreateChildScreen consentId="c1" onCreated={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nombre"), "Ana");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });

  it("crea el perfil con el consentId, nombre y curso elegidos, y llama onCreated", async () => {
    mocks.createChild.mockResolvedValue({ id: "child-1", displayName: "Ana", grade: 2, language: "es" });
    const onCreated = vi.fn();

    render(<CreateChildScreen consentId="consent-abc" onCreated={onCreated} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.click(screen.getByRole("button", { name: "2° básico" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(mocks.createChild).toHaveBeenCalledWith("consent-abc", "Ana", 2);
    expect(onCreated).toHaveBeenCalledWith({ id: "child-1", displayName: "Ana", grade: 2, language: "es" });
  });
});
