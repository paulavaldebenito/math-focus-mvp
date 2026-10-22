import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewScreen } from "./ReviewScreen.js";

const mocks = vi.hoisted(() => ({
  reviewSkills: vi.fn(),
  reviewSkillExercises: vi.fn(),
  reviewExercise: vi.fn(),
  reviewAnswer: vi.fn(),
  reviewAddComment: vi.fn(),
  reviewDeleteComment: vi.fn(),
  reviewPendingComments: vi.fn(),
}));
vi.mock("../api/endpoints.js", () => mocks);

const skill = { id: "sk1", name: "Porcentajes", nameEn: "Percentages", axis: "Números", axisEn: null, oaCode: "MA06 OA04", exerciseCount: 2, openComments: 0 };
const exercise = (id: string, prompt: string) => ({
  id,
  mode: "solve",
  prompt,
  promptEn: null,
  difficultyLevel: 2,
  options: [
    { id: `${id}-a`, label: "15", labelEn: null },
    { id: `${id}-b`, label: "35", labelEn: null },
  ],
  visual: null,
  image: null,
  procedureNote: "El 25% es la cuarta parte.",
  procedureNoteEn: null,
  theme: null,
  skill: { id: "sk1", grade: 6, name: "Porcentajes", nameEn: null, oaCode: "MA06 OA04" },
  comments: [],
});

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.reviewSkills.mockResolvedValue({ grade: 1, skills: [skill] });
  mocks.reviewSkillExercises.mockResolvedValue({
    skill: skill,
    exercises: [
      { id: "e1", prompt: "¿Cuál es el 25% de 60?", theme: null, groupKey: "g1", difficultyLevel: 2, openComments: 0 },
      { id: "e2", prompt: "¿Cuál es el 10% de 350?", theme: null, groupKey: "g2", difficultyLevel: 2, openComments: 0 },
    ],
  });
  mocks.reviewExercise.mockImplementation(async (id: string) => exercise(id, id === "e1" ? "¿Cuál es el 25% de 60?" : "¿Cuál es el 10% de 350?"));
});

describe("ReviewScreen", () => {
  it("si se cambia de curso rápido, una respuesta atrasada del curso anterior no pisa la lista", async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    mocks.reviewSkills.mockReset();
    mocks.reviewSkills.mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)));
    mocks.reviewSkills.mockResolvedValueOnce({ grade: 6, skills: [{ ...skill, id: "s6", name: "Porcentajes de 6°" }] });
    const user = userEvent.setup();
    render(<ReviewScreen onExit={vi.fn()} />);
    await user.click(screen.getByRole("tab", { name: "6° básico" }));
    expect(await screen.findByRole("button", { name: /Porcentajes de 6°/ })).toBeInTheDocument();
    resolveFirst({ grade: 1, skills: [{ ...skill, id: "s1", name: "Habilidad de 1°" }] });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("button", { name: /Habilidad de 1°/ })).not.toBeInTheDocument();
  });

  it("cambia de curso y abre las preguntas de una habilidad", async () => {
    const user = userEvent.setup();
    render(<ReviewScreen onExit={vi.fn()} />);

    await user.click(await screen.findByRole("tab", { name: "6° básico" }));
    expect(mocks.reviewSkills).toHaveBeenLastCalledWith(6);
    await user.click(await screen.findByRole("button", { name: /Porcentajes/ }));

    expect(await screen.findByRole("heading", { name: "¿Cuál es el 25% de 60?" })).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("al fallar muestra el feedback de la alternativa, la estrategia y la respuesta correcta; sin guardar intentos de niño", async () => {
    mocks.reviewAnswer.mockResolvedValue({
      isCorrect: false,
      errorCode: "E1_OP",
      feedback: "Le restaste 25 a 60.",
      feedbackEn: null,
      correctOptionId: "e1-a",
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "" },
      level: 0,
      bonusStarAwarded: false,
    });
    const user = userEvent.setup();
    render(<ReviewScreen onExit={vi.fn()} />);
    await user.click(await screen.findByRole("button", { name: /Porcentajes/ }));
    await user.click(await screen.findByRole("button", { name: "35" }));

    expect(mocks.reviewAnswer).toHaveBeenCalledWith("e1", "e1-b");
    expect(await screen.findByText("Le restaste 25 a 60.")).toBeInTheDocument();
    expect(screen.getByText(/El 25% es la cuarta parte/)).toBeInTheDocument();
    expect(screen.getByText("Respuesta correcta:").parentElement).toHaveTextContent("15");

    await user.click(screen.getByRole("button", { name: "Responder de nuevo" }));
    expect(screen.getByRole("button", { name: "35" })).toBeEnabled();

    await user.click(screen.getAllByRole("button", { name: "Siguiente →" })[0]!);
    expect(await screen.findByRole("heading", { name: "¿Cuál es el 10% de 350?" })).toBeInTheDocument();
  });

  it("guarda un comentario y lo muestra en la pregunta", async () => {
    mocks.reviewAddComment.mockResolvedValue({ id: "c1", text: "Cambiar la imagen", createdAt: "2026-10-21T12:00:00Z", resolvedAt: null, author: "r@example.test" });
    const user = userEvent.setup();
    render(<ReviewScreen onExit={vi.fn()} />);
    await user.click(await screen.findByRole("button", { name: /Porcentajes/ }));

    await user.type(await screen.findByRole("textbox", { name: "Comentarios sobre esta pregunta" }), "Cambiar la imagen");
    await user.click(screen.getByRole("button", { name: "Guardar comentario" }));

    expect(mocks.reviewAddComment).toHaveBeenCalledWith("e1", "Cambiar la imagen");
    expect(await screen.findByText("💬 Cambiar la imagen")).toBeInTheDocument();
  });
});
