import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeScreen } from "./HomeScreen.js";

const mocks = vi.hoisted(() => ({ getHomeSummary: vi.fn(), logout: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ getHomeSummary: mocks.getHomeSummary }));
vi.mock("../context/useAuth.js", () => ({ useAuth: () => ({ logout: mocks.logout }) }));

describe("HomeScreen", () => {
  it("muestra el compañero, la racha y las estrellas del resumen real", async () => {
    mocks.getHomeSummary.mockResolvedValue({ companion: "buho", totalStars: 12, starsToday: 3, streak: 4 });

    render(<HomeScreen childId="child-1" displayName="Ana" onPractice={vi.fn()} onViewProgress={vi.fn()} />);

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/4/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Buho" })).toBeInTheDocument();
  });

  it("sin racha (0), no muestra la pastilla de racha", async () => {
    mocks.getHomeSummary.mockResolvedValue({ companion: "capi", totalStars: 0, starsToday: 0, streak: 0 });

    render(<HomeScreen childId="child-2" displayName="Beto" onPractice={vi.fn()} onViewProgress={vi.fn()} />);

    await screen.findByRole("heading", { name: "Capi" });
    expect(screen.queryByText(/días seguidos/)).not.toBeInTheDocument();
  });
});
