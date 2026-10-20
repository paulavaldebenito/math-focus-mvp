import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeScreen } from "./HomeScreen.js";

const mocks = vi.hoisted(() => ({ getHomeSummary: vi.fn(), logout: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ getHomeSummary: mocks.getHomeSummary }));
vi.mock("../context/useAuth.js", () => ({ useAuth: () => ({ logout: mocks.logout }) }));

describe("HomeScreen", () => {
  it("muestra el compañero, la racha y las estrellas del resumen real", async () => {
    mocks.getHomeSummary.mockResolvedValue({ companion: "buho", totalStars: 12, starsToday: 3, streak: 4, rank: 2, starsIntoRank: 2, starsToNextRank: 8 });

    render(<HomeScreen childId="child-1" displayName="Ana" onOpenMap={vi.fn()} onViewProgress={vi.fn()} onChangeInterests={vi.fn()} onChangeMascotName={vi.fn()} />);

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/4/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Búho" })).toBeInTheDocument();
  });

  it("sin racha (0), no muestra la pastilla de racha", async () => {
    mocks.getHomeSummary.mockResolvedValue({ companion: "capi", totalStars: 0, starsToday: 0, streak: 0, rank: 1, starsIntoRank: 0, starsToNextRank: 10 });

    render(<HomeScreen childId="child-2" displayName="Beto" onOpenMap={vi.fn()} onViewProgress={vi.fn()} onChangeInterests={vi.fn()} onChangeMascotName={vi.fn()} />);

    await screen.findByRole("heading", { name: "Capi" });
    expect(screen.queryByText(/días seguidos/)).not.toBeInTheDocument();
  });

  it("el botón «Cambiar mis intereses» avisa al padre", async () => {
    mocks.getHomeSummary.mockResolvedValue({ companion: "capi", totalStars: 0, starsToday: 0, streak: 0, rank: 1, starsIntoRank: 0, starsToNextRank: 10 });
    const onChangeInterests = vi.fn();

    render(
      <HomeScreen childId="child-3" displayName="Cata" onOpenMap={vi.fn()} onViewProgress={vi.fn()} onChangeInterests={onChangeInterests} onChangeMascotName={vi.fn()} />,
    );

    await userEvent.setup().click(await screen.findByRole("button", { name: "Cambiar mis intereses" }));
    expect(onChangeInterests).toHaveBeenCalled();
  });

  it("si el niño le puso un nombre propio a su mascota, se muestra ese en vez del nombre por defecto", async () => {
    mocks.getHomeSummary.mockResolvedValue({
      companion: "buho",
      mascotName: "Pelusa",
      totalStars: 0,
      starsToday: 0,
      streak: 0,
      rank: 1,
      starsIntoRank: 0,
      starsToNextRank: 10,
    });

    render(
      <HomeScreen
        childId="child-5"
        displayName="Emi"
        onOpenMap={vi.fn()}
        onViewProgress={vi.fn()}
        onChangeInterests={vi.fn()}
        onChangeMascotName={vi.fn()}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Pelusa" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Búho" })).not.toBeInTheDocument();
  });

  it("el botón «Cambiar tu mascota o su nombre» avisa al padre con el compañero, su nombre y los nombres de cada mascota", async () => {
    mocks.getHomeSummary.mockResolvedValue({
      companion: "zorro",
      mascotName: "Firu",
      mascotNames: { zorro: "Firu", buho: "Sabio" },
      totalStars: 0,
      starsToday: 0,
      streak: 0,
      rank: 1,
      starsIntoRank: 0,
      starsToNextRank: 10,
    });
    const onChangeMascotName = vi.fn();

    render(
      <HomeScreen
        childId="child-6"
        displayName="Nico"
        onOpenMap={vi.fn()}
        onViewProgress={vi.fn()}
        onChangeInterests={vi.fn()}
        onChangeMascotName={onChangeMascotName}
      />,
    );

    await screen.findByRole("heading", { name: "Firu" });
    await userEvent.setup().click(screen.getByRole("button", { name: "Cambiar tu mascota o su nombre" }));
    expect(onChangeMascotName).toHaveBeenCalledWith("zorro", "Firu", { zorro: "Firu", buho: "Sabio" });
  });

  it("muestra el rango y cuántas estrellas faltan para el siguiente", async () => {
    mocks.getHomeSummary.mockResolvedValue({ companion: "buho", totalStars: 24, starsToday: 1, streak: 0, rank: 3, starsIntoRank: 4, starsToNextRank: 6 });

    render(<HomeScreen childId="child-4" displayName="Leo" onOpenMap={vi.fn()} onViewProgress={vi.fn()} onChangeInterests={vi.fn()} onChangeMascotName={vi.fn()} />);

    expect(await screen.findByText(/Rango 3/)).toBeInTheDocument();
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });
});
