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
      errorBreakdown: { E2_CAL: 1 },
    });

    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Progreso de Ana" })).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    // Aparece dos veces a propósito: en "dónde practicar más" y de nuevo
    // como encabezado de su sugerencia para el hogar.
    expect(screen.getAllByText("Cálculo puntual").length).toBeGreaterThan(0);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText(/ranking/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/comparad[oa] con/i)).not.toBeInTheDocument();
  });

  it("muestra hasta 2 sugerencias concretas para practicar en casa, priorizando las áreas con más ocurrencias", async () => {
    mocks.getProgress.mockResolvedValue({
      child: { id: "c1", displayName: "Ana", grade: 1 },
      currentLevel: 2,
      totalSessions: 3,
      lastSessionAt: "2026-08-10T12:00:00.000Z",
      totalAttempts: 10,
      correctAttempts: 6,
      accuracy: 0.6,
      errorBreakdown: { E1_OP: 5, E3_DATO: 2, E2_CAL: 1 },
    });

    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);

    await screen.findByRole("heading", { name: "Progreso de Ana" });
    expect(screen.getByText("Ideas para practicar en casa:")).toBeInTheDocument();
    // Las 2 áreas con más ocurrencias (E1_OP, E3_DATO) traen su sugerencia...
    expect(screen.getByText(/qué operación usaría y por qué/)).toBeInTheDocument();
    expect(screen.getByText(/marcando en voz alta los números/)).toBeInTheDocument();
    // ...la tercera (E2_CAL, menos frecuente) no se muestra, para no abrumar.
    expect(screen.queryByText(/cálculo mental simple/)).not.toBeInTheDocument();
  });

  it("sin errores registrados, no muestra la sección de sugerencias", async () => {
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

    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);

    await screen.findByRole("heading", { name: "Progreso de Ana" });
    expect(screen.queryByText("Ideas para practicar en casa:")).not.toBeInTheDocument();
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
  const base = {
    child: { id: "c1", displayName: "Ana", grade: 3 },
    currentLevel: 2,
    totalSessions: 5,
    lastSessionAt: "2026-09-29T12:00:00.000Z",
    totalAttempts: 20,
    correctAttempts: 12,
    accuracy: 0.6,
    errorBreakdown: {},
  };
  const day = (date: string, mood: number | null, mathFeeling: number | null, correct: number, attempts: number) => ({
    date,
    mood,
    mathFeeling,
    correct,
    attempts,
    accuracy: attempts > 0 ? correct / attempts : null,
  });

  it("cruza el ánimo con los aciertos, lo presenta como coincidencia y sugiere cómo acompañar los nervios", async () => {
    mocks.getProgress.mockResolvedValue({
      ...base,
      wellbeing: {
        days: [day("2026-09-29", 2, 1, 2, 6), day("2026-09-28", 4, 2, 3, 6), day("2026-09-27", 5, 4, 5, 6), day("2026-09-26", 4, 5, 6, 6)],
        comparison: {
          moodLow: { days: 1, accuracy: 0.33 },
          moodHigh: { days: 3, accuracy: 0.78 },
          mathNervous: { days: 2, accuracy: 5 / 12 },
          mathCalm: { days: 2, accuracy: 11 / 12 },
        },
        recentMathFeeling: 2,
      },
      skillsToReview: [],
    });

    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);

    expect(await screen.findByText("Cómo se ha sentido y cómo le ha ido")).toBeInTheDocument();
    expect(screen.getByText(/nervioso\/a con las matemáticas acertó un 42 %; .* tranquilo\/a, un 92 %/)).toBeInTheDocument();
    // Ánimo triste: 1 solo día — no alcanza para comparar, no se muestra.
    expect(screen.queryByText(/se sintió triste acertó/)).not.toBeInTheDocument();
    expect(screen.getByText(/coincidencia observada, no una conclusión/)).toBeInTheDocument();
    expect(screen.getByText("Si se siente nervioso/a con las matemáticas")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Muy nervioso/a" })).toHaveLength(1);
    expect(screen.getByText("33 % (2/6)")).toBeInTheDocument();
    expect(screen.queryByText(/diagn[oó]stico|trastorno|ansiedad/i)).not.toBeInTheDocument();
  });

  it("con pocos días lo dice, y sin registros explica cuándo se pregunta", async () => {
    mocks.getProgress.mockResolvedValue({
      ...base,
      wellbeing: {
        days: [],
        comparison: {
          moodLow: { days: 0, accuracy: null },
          moodHigh: { days: 0, accuracy: null },
          mathNervous: { days: 0, accuracy: null },
          mathCalm: { days: 0, accuracy: null },
        },
        recentMathFeeling: null,
      },
      skillsToReview: [],
    });
    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);
    expect(await screen.findByText(/Todavía no hay registros/)).toBeInTheDocument();
    expect(screen.getByText(/no hay contenidos con dificultad marcada/)).toBeInTheDocument();
  });

  it("muestra los contenidos a repasar con su porcentaje y una sugerencia para la casa, en el idioma elegido", async () => {
    mocks.getProgress.mockResolvedValue({
      ...base,
      skillsToReview: [
        {
          skillId: "s1",
          grade: 3,
          name: "Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4",
          nameEn: "Common fractions",
          attempts: 8,
          accuracy: 0.25,
          tip: { es: "Doblen hojas de papel en partes iguales.", en: "Fold sheets of paper into equal parts." },
        },
      ],
    });
    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);
    expect(await screen.findByText("Qué repasar y cómo hacerlo en casa")).toBeInTheDocument();
    expect(screen.getByText("Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4")).toBeInTheDocument();
    expect(screen.getByText("Acertó un 25 % en 8 preguntas")).toBeInTheDocument();
    expect(screen.getByText("Doblen hojas de papel en partes iguales.")).toBeInTheDocument();
  });
});
