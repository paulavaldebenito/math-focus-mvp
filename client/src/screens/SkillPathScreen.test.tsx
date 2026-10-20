import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillPathScreen } from "./SkillPathScreen.js";
import { LangReactContext } from "../lib/i18n.js";

const mocks = vi.hoisted(() => ({ getSkillPath: vi.fn() }));
vi.mock("../api/endpoints.js", () => mocks);

const skills = [
  {
    id: "s1",
    grade: 4,
    axis: "Números y operaciones",
    name: "Sumas",
    axisEn: "Numbers and operations",
    nameEn: "Addition",
    oaCode: null,
    order: 0,
    status: "completed",
    correctCount: 8,
  },
  {
    id: "s2",
    grade: 4,
    axis: "Números y operaciones",
    name: "Restas",
    axisEn: "Numbers and operations",
    nameEn: "Subtraction",
    oaCode: null,
    order: 1,
    status: "available",
    correctCount: 2,
  },
  {
    id: "s3",
    grade: 4,
    axis: "Geometría",
    name: "Figuras",
    axisEn: "Geometry",
    nameEn: "Shapes",
    oaCode: null,
    order: 2,
    status: "locked",
    correctCount: 0,
  },
];

describe("SkillPathScreen", () => {
  it("muestra las habilidades en orden, con encabezado por eje", async () => {
    mocks.getSkillPath.mockResolvedValue({ grade: 4, skills });
    render(<SkillPathScreen childId="child-1" onSelect={vi.fn()} onBack={vi.fn()} />);

    await screen.findByText("Sumas");
    expect(screen.getByText("Restas")).toBeInTheDocument();
    expect(screen.getByText("Figuras")).toBeInTheDocument();
    expect(screen.getByText(/Números y operaciones/)).toBeInTheDocument();
    expect(screen.getByText(/Geometría/)).toBeInTheDocument();
  });

  it("un nodo bloqueado no se puede clickear; uno disponible sí, y avisa cuál sigue", async () => {
    mocks.getSkillPath.mockResolvedValue({ grade: 4, skills });
    const onSelect = vi.fn();
    render(<SkillPathScreen childId="child-1" onSelect={onSelect} onBack={vi.fn()} />);

    await screen.findByText("Sumas");
    const lockedNode = screen.getByRole("button", { name: /Figuras/ });
    expect(lockedNode).toBeDisabled();

    // Solo el primero disponible (no completado) lleva la insignia "¡Empezar!".
    expect(screen.getByText("¡Empezar!")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Restas/ }));
    expect(onSelect).toHaveBeenCalledWith({ id: "s2", name: "Restas", nameEn: "Subtraction" });
  });

  it("un nodo completado se puede volver a jugar", async () => {
    mocks.getSkillPath.mockResolvedValue({ grade: 4, skills });
    const onSelect = vi.fn();
    render(<SkillPathScreen childId="child-1" onSelect={onSelect} onBack={vi.fn()} />);

    await screen.findByText("Sumas");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Sumas/ }));
    expect(onSelect).toHaveBeenCalledWith({ id: "s1", name: "Sumas", nameEn: "Addition" });
  });

  it("el botón de volver llama a onBack", async () => {
    mocks.getSkillPath.mockResolvedValue({ grade: 4, skills });
    const onBack = vi.fn();
    render(<SkillPathScreen childId="child-1" onSelect={vi.fn()} onBack={onBack} />);

    await screen.findByText("Sumas");
    await userEvent.setup().click(screen.getByRole("button", { name: /Inicio/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it("si falla la carga, muestra error con reintento", async () => {
    mocks.getSkillPath.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ grade: 4, skills });
    render(<SkillPathScreen childId="child-1" onSelect={vi.fn()} onBack={vi.fn()} />);

    await screen.findByRole("alert");
    await userEvent.setup().click(screen.getByRole("button", { name: "Intentar de nuevo" }));
    await screen.findByText("Sumas");
  });

  it("en inglés, muestra el nombre y el eje traducidos, y al elegir un nodo avisa con ambos nombres", async () => {
    mocks.getSkillPath.mockResolvedValue({ grade: 4, skills });
    const onSelect = vi.fn();

    render(
      <LangReactContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
        <SkillPathScreen childId="child-1" onSelect={onSelect} onBack={vi.fn()} />
      </LangReactContext.Provider>,
    );

    await screen.findByText("Addition");
    expect(screen.getByText("Subtraction")).toBeInTheDocument();
    expect(screen.getByText(/Numbers and operations/)).toBeInTheDocument();
    expect(screen.queryByText("Sumas")).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: /Subtraction/ }));
    expect(onSelect).toHaveBeenCalledWith({ id: "s2", name: "Restas", nameEn: "Subtraction" });
  });
});
