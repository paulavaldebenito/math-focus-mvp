import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FamilyDashboardScreen } from "./FamilyDashboardScreen.js";

const mocks = vi.hoisted(() => ({ getProgress: vi.fn() }));
vi.mock("../api/endpoints.js", () => mocks);

describe("FamilyDashboardScreen", () => {
  it("muestra el progreso real y ningún dato de comparación con otros niños", async () => {
    mocks.getProgress.mockResolvedValue({
      child: { id: "c1", displayName: "Ana", grade: 1 },
      currentLevel: 3,
      totalSessions: 2,
      lastSessionAt: "2026-08-10T12:00:00.000Z",
      totalAttempts: 4,
      correctAttempts: 3,
      accuracy: 0.75,
      errorBreakdown: { calculo: 1 },
    });

    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Progreso de Ana" })).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("Cálculo puntual: 1")).toBeInTheDocument();
    expect(screen.queryByText(/ranking/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/comparad[oa] con/i)).not.toBeInTheDocument();
  });

  it("el botón volver llama a onBack", async () => {
    mocks.getProgress.mockResolvedValue({
      child: { id: "c1", displayName: "Ana", grade: 1 },
      currentLevel: 2,
      totalSessions: 0,
      lastSessionAt: null,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracy: null,
      errorBreakdown: {},
    });
    const onBack = vi.fn();

    render(<FamilyDashboardScreen childId="c1" onBack={onBack} />);
    await screen.findByRole("heading", { name: "Progreso de Ana" });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(onBack).toHaveBeenCalled();
  });
});
