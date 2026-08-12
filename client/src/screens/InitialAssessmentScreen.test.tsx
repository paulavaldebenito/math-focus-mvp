import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InitialAssessmentScreen } from "./InitialAssessmentScreen.js";

const mocks = vi.hoisted(() => ({
  getInitialAssessment: vi.fn(),
  submitInitialAssessment: vi.fn(),
  getHomeSummary: vi.fn(),
}));

vi.mock("../api/endpoints.js", () => mocks);

mocks.getHomeSummary.mockResolvedValue({ companion: "capi", totalStars: 0, starsToday: 0, streak: 0 });

const exercises = [
  { id: "ex1", prompt: "¿Cuánto es 6 + 7?", options: [{ id: "a1", label: "13" }, { id: "a2", label: "12" }] },
  { id: "ex2", prompt: "¿Cuánto es 20 − 20?", options: [{ id: "b1", label: "0" }, { id: "b2", label: "20" }] },
];

describe("InitialAssessmentScreen", () => {
  it("muestra una pregunta a la vez y avanza al responder", async () => {
    mocks.getInitialAssessment.mockResolvedValue({ exercises });

    render(<InitialAssessmentScreen childId="child-1" onDone={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Empezar" }));

    await screen.findByText("¿Cuánto es 6 + 7?");
    expect(screen.queryByText("¿Cuánto es 20 − 20?")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "13" }));

    await screen.findByText("¿Cuánto es 20 − 20?");
    expect(screen.queryByText("¿Cuánto es 6 + 7?")).not.toBeInTheDocument();
  });

  it("al responder la última pregunta, envía todos los intentos, muestra el cierre y llama onDone al continuar", async () => {
    mocks.getInitialAssessment.mockResolvedValue({ exercises });
    mocks.submitInitialAssessment.mockResolvedValue({
      sessionId: "s1",
      correctCount: 2,
      total: 2,
      initialLevel: 3,
    });
    const onDone = vi.fn();

    render(<InitialAssessmentScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Empezar" }));

    await screen.findByText("¿Cuánto es 6 + 7?");
    await user.click(screen.getByRole("button", { name: "13" }));
    await screen.findByText("¿Cuánto es 20 − 20?");
    await user.click(screen.getByRole("button", { name: "0" }));

    expect(mocks.submitInitialAssessment).toHaveBeenCalledWith("child-1", [
      expect.objectContaining({ exerciseId: "ex1", selectedOptionId: "a1" }),
      expect.objectContaining({ exerciseId: "ex2", selectedOptionId: "b1" }),
    ]);

    const continueBtn = await screen.findByRole("button", { name: "Vamos a practicar" });
    expect(onDone).not.toHaveBeenCalled();
    await user.click(continueBtn);

    expect(onDone).toHaveBeenCalledWith(
      expect.objectContaining({ initialLevel: 3, correctCount: 2 }),
    );
  });
});
