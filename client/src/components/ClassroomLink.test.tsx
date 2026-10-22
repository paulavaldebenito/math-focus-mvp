import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClassroomLink } from "./ClassroomLink.js";

const mocks = vi.hoisted(() => ({ childEnrollment: vi.fn(), joinClassroom: vi.fn(), setShareEmotions: vi.fn(), leaveClassroom: vi.fn() }));
vi.mock("../api/endpoints.js", () => mocks);

describe("ClassroomLink", () => {
  it("exige autorizar el progreso y deja las emociones como consentimiento aparte", async () => {
    mocks.childEnrollment.mockResolvedValue(null);
    mocks.joinClassroom.mockResolvedValue({ classroomName: "3° B", schoolName: "Colegio Ficticio", grade: 3, shareEmotions: false });
    const user = userEvent.setup();
    render(<ClassroomLink childId="k1" lang="es" />);
    await user.type(await screen.findByLabelText("Código del curso"), "3b-k7q2x");
    const join = screen.getByRole("button", { name: "Vincular" });
    expect(join).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /compartir con el colegio su progreso/ }));
    await user.click(join);
    expect(mocks.joinClassroom).toHaveBeenCalledWith("k1", "3B-K7Q2X", false);
    expect(await screen.findByText("Vinculado a 3° B · Colegio Ficticio.")).toBeInTheDocument();
    expect(screen.getByText("La profesora no ve sus emociones individuales.")).toBeInTheDocument();
  });

  it("explica si el código es de otro curso escolar", async () => {
    mocks.childEnrollment.mockResolvedValue(null);
    mocks.joinClassroom.mockRejectedValue({ status: 409, body: { classroomGrade: 5 } });
    const user = userEvent.setup();
    render(<ClassroomLink childId="k1" lang="es" />);
    await user.type(await screen.findByLabelText("Código del curso"), "5B-AAAAA");
    await user.click(screen.getByRole("checkbox", { name: /compartir con el colegio su progreso/ }));
    await user.click(screen.getByRole("button", { name: "Vincular" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ese código es de un curso de 5° básico");
  });
});
