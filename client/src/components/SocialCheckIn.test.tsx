import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialCheckIn } from "./SocialCheckIn.js";

const mocks = vi.hoisted(() => ({ getSocialCheckIn: vi.fn(), submitSocialCheckIn: vi.fn() }));
vi.mock("../api/endpoints.js", () => mocks);

describe("SocialCheckIn (pregunta social de la semana, specs/018)", () => {
  beforeEach(() => vi.resetAllMocks());

  it("no aparece si no toca esta semana o la familia no lo autorizó", async () => {
    mocks.getSocialCheckIn.mockResolvedValue({ due: false });
    const { container } = render(<SocialCheckIn childId="c1" lang="es" />);
    await vi.waitFor(() => expect(mocks.getSocialCheckIn).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("le dice al niño que su familia ve las respuestas, las envía, y si lo molestaron le sugiere contarle a un adulto", async () => {
    mocks.getSocialCheckIn.mockResolvedValue({ due: true });
    mocks.submitSocialCheckIn.mockResolvedValue({ id: "s1" });
    render(<SocialCheckIn childId="c1" lang="es" />);
    expect(await screen.findByText(/Tu familia las ve para poder ayudarte/)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: /sin nadie, y quería estar con alguien/ }));
    await user.click(screen.getByRole("radio", { name: /Una vez/ }));
    await user.click(screen.getByRole("button", { name: "Listo" }));
    expect(mocks.submitSocialCheckIn).toHaveBeenCalledWith("c1", { recess: 4, excluded: "una_vez" });
    expect(await screen.findByText(/no es tu culpa. Cuéntale a un adulto de confianza/)).toBeInTheDocument();
  });

  it("se puede saltar sin responder", async () => {
    mocks.getSocialCheckIn.mockResolvedValue({ due: true });
    mocks.submitSocialCheckIn.mockResolvedValue({ id: "s1" });
    render(<SocialCheckIn childId="c1" lang="es" />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Saltar" }));
    expect(mocks.submitSocialCheckIn).toHaveBeenCalledWith("c1", {});
  });

  it("si esta semana no fue al colegio, no le hace las otras dos preguntas", async () => {
    mocks.getSocialCheckIn.mockResolvedValue({ due: true });
    mocks.submitSocialCheckIn.mockResolvedValue({ id: "s1" });
    render(<SocialCheckIn childId="c1" lang="es" />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("radio", { name: /no fui al colegio/ }));
    expect(screen.queryByText(/a quien contarle tus cosas/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Listo" }));
    expect(mocks.submitSocialCheckIn).toHaveBeenCalledWith("c1", { recess: 5 });
  });
});
