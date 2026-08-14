import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PracticeScreen } from "./PracticeScreen.js";

const mocks = vi.hoisted(() => ({
  startSession: vi.fn(),
  getNextExercise: vi.fn(),
  submitAttempt: vi.fn(),
  submitPauseEvent: vi.fn(),
  getHomeSummary: vi.fn(),
  completeSession: vi.fn(),
}));

vi.mock("../api/endpoints.js", () => mocks);

mocks.getHomeSummary.mockResolvedValue({ companion: "capi", totalStars: 0, starsToday: 0, streak: 0 });
mocks.completeSession.mockResolvedValue({ id: "s1", starAwarded: true });

async function skipPrePause(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("button", { name: "Empezar ahora" });
  await user.click(screen.getByRole("button", { name: "Empezar ahora" }));
}

const ex1 = {
  id: "ex1",
  prompt: "¿Cuánto es 6 + 7?",
  options: [{ id: "a1", label: "13" }, { id: "a2", label: "12" }],
  procedureNote: "Cuenta hacia adelante desde 6.",
};
const ex2 = {
  id: "ex2",
  prompt: "¿Cuánto es 8 + 5?",
  options: [{ id: "b1", label: "13" }, { id: "b2", label: "12" }],
  procedureNote: "Cuenta hacia adelante desde 8.",
};

describe("PracticeScreen", () => {
  it("responde una pregunta, muestra feedback respetuoso y pasa a la siguiente", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1).mockResolvedValueOnce(ex2);
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: true,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
    });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipPrePause(user);
    await screen.findByText("¿Cuánto es 6 + 7?");
    await user.click(screen.getByRole("button", { name: "13" }));

    expect(await screen.findByText("Avanzaste un paso más.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await screen.findByText("¿Cuánto es 8 + 5?");
    expect(mocks.submitAttempt).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({ exerciseId: "ex1", selectedOptionId: "a1", hintsUsed: 0 }),
    );
  });

  it("pedir una pista suma 1 a hintsUsed en el siguiente intento", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: true,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
    });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipPrePause(user);
    await screen.findByText("¿Cuánto es 6 + 7?");
    await user.click(screen.getByRole("button", { name: "Necesito una pista" }));
    expect(screen.getByText("Pista: Cuenta hacia adelante desde 6.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "13" }));
    expect(mocks.submitAttempt).toHaveBeenCalledWith("s1", expect.objectContaining({ hintsUsed: 1 }));
  });

  it("cuando la acción es OFFER_PAUSE, ofrece la pausa y nunca bloquea si se rechaza", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1).mockResolvedValueOnce(ex2);
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: false,
      action: { type: "OFFER_PAUSE", ruleCode: "FATIGUE_SIGNAL", reason: "x" },
      level: 2,
    });
    mocks.submitPauseEvent.mockResolvedValue({ id: "p1", accepted: false });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipPrePause(user);
    await screen.findByText("¿Cuánto es 6 + 7?");
    await user.click(screen.getByRole("button", { name: "12" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await screen.findByRole("heading", { name: "Pausa para respirar" });
    await user.click(screen.getByRole("button", { name: "Prefiero seguir" }));

    expect(mocks.submitPauseEvent).toHaveBeenCalledWith("s1", { kind: "respiracion", accepted: false });
    await screen.findByText("¿Cuánto es 8 + 5?");
  });

  it("si falla el envío de una respuesta, el botón de reintento vuelve a enviar la misma respuesta", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitAttempt
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 2,
      });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipPrePause(user);
    await screen.findByText("¿Cuánto es 6 + 7?");
    await user.click(screen.getByRole("button", { name: "13" }));

    await user.click(await screen.findByRole("button", { name: "Intentar de nuevo" }));

    expect(await screen.findByText("Avanzaste un paso más.")).toBeInTheDocument();
    expect(mocks.submitAttempt).toHaveBeenLastCalledWith(
      "s1",
      expect.objectContaining({ exerciseId: "ex1", selectedOptionId: "a1" }),
    );
  });
});
