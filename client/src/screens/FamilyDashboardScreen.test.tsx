import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FamilyDashboardScreen } from "./FamilyDashboardScreen.js";

const mocks = vi.hoisted(() => ({ getProgress: vi.fn(), playHomeGame: vi.fn(), childEnrollment: vi.fn().mockResolvedValue(null) }));
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
    expect(screen.getAllByText("Hacer los cálculos con cuidado").length).toBeGreaterThan(0);
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
    expect(screen.getByText(/subraye o diga en voz alta los números/)).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "🔒 Salir del espacio familia" }));
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

    expect(await screen.findByText("🙂 Ánimo al empezar a practicar y aciertos")).toBeInTheDocument();
    expect(screen.getByText(/sentir nervios con las matemáticas acertó un 42 %; .* con calma, un 92 %/)).toBeInTheDocument();
    // Ánimo triste: 1 solo día — no alcanza para comparar, no se muestra.
    expect(screen.queryByText(/se sintió triste acertó/)).not.toBeInTheDocument();
    expect(screen.getByText(/coincidencia observada, no una conclusión/)).toBeInTheDocument();
    expect(screen.getByText("Si siente nervios con las matemáticas")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Con muchos nervios" })).toHaveLength(1);
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
  });

  const game = {
    emoji: "🥪",
    name: { es: "El sándwich en partes", en: "The sandwich in parts" },
    minutes: 10,
    materials: { es: "Hojas de papel", en: "Sheets of paper" },
    steps: { es: ["Doblen una hoja en 2 partes.", "Pinten 1/2 y 1/4.", "Corten el sándwich."], en: ["Fold a sheet in 2.", "Color 1/2 and 1/4.", "Cut the sandwich."] },
  };
  const topic = (over: Record<string, unknown> = {}) => ({
    skillId: "s1",
    grade: 3,
    name: "Fracciones de uso común: 1/4, 1/3, 1/2, 2/3 y 3/4",
    nameEn: "Common fractions",
    attempts: 8,
    accuracy: 0.25,
    recentAttempts: 8,
    recentCorrect: 2,
    trend: null,
    lastPracticed: "2026-10-21",
    lastEmotion: "nervios",
    needsHelp: ["aciertos", "emocion"],
    game,
    timesPlayed: 0,
    ...over,
  });
  const feelings = (over: Record<string, unknown> = {}) => ({
    answered: 3,
    counts: { orgullo: 0, alegria: 1, calma: 0, aburrimiento: 0, rabia: 0, nervios: 2 },
    recent: [{ date: "2026-10-21", emotion: "nervios", skill: { id: "s1", name: "Fracciones", nameEn: null } }],
    weatherAvg: 2.4,
    energyAvg: null,
    hardestCounts: { entender: 0, cuentas: 2, concentrarme: 0, nada: 0 },
    focus: ["nervios"],
    guidance: [
      {
        emotion: "nervios",
        emoji: "😰",
        label: { es: "Nervios", en: "Nerves" },
        meaning: { es: "Sintió inseguridad.", en: "They felt unsure." },
        say: { es: ["«Aquí equivocarse está permitido.»"], en: ["“Mistakes are allowed here.”"] },
        do: { es: ["Sesiones cortas y tranquilas."], en: ["Short, calm sessions."] },
      },
    ],
    hardestGuidance: { key: "cuentas", emoji: "🧮", label: { es: "Hacer las cuentas", en: "Doing the math" }, tip: { es: "Cálculo mental jugando.", en: "Mental math games." } },
    ...over,
  });

  it("muestra cómo se ha sentido al practicar, con qué decir y qué hacer, sin lenguaje clínico", async () => {
    mocks.getProgress.mockResolvedValue({ ...base, feelings: feelings(), topics: [] });
    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);
    expect(await screen.findByText("💛 Cómo se ha sentido al practicar")).toBeInTheDocument();
    expect(screen.getByText(/contó cómo se sintió en 3 prácticas/)).toBeInTheDocument();
    expect(screen.getByText("💬 Qué decir")).toBeInTheDocument();
    expect(screen.getByText("«Aquí equivocarse está permitido.»")).toBeInTheDocument();
    expect(screen.getByText("Sesiones cortas y tranquilas.")).toBeInTheDocument();
    expect(screen.getByText(/Lo que más le ha costado: 🧮 Hacer las cuentas/)).toBeInTheDocument();
    expect(screen.getByText(/no un diagnóstico/)).toBeInTheDocument();
    expect(screen.queryByText(/trastorno|ansiedad/i)).not.toBeInTheDocument();
  });

  it("propone un juego para la casa por tema débil y registra «¡Lo jugamos!»", async () => {
    mocks.getProgress.mockResolvedValue({ ...base, feelings: feelings({ answered: 0, weatherAvg: null }), topics: [topic()] });
    mocks.playHomeGame.mockResolvedValue({ timesPlayed: 1 });
    const user = userEvent.setup();
    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);

    expect(await screen.findByText("🎲 Juegos para la casa")).toBeInTheDocument();
    expect(screen.getByText("Le está costando: en sus últimas 8 preguntas acertó 2.")).toBeInTheDocument();
    expect(screen.getByText(/La última vez que lo practicó sintió nervios/)).toBeInTheDocument();
    expect(screen.getAllByText("El sándwich en partes")[0]).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "¡Lo jugamos! ✅" })[0]!);
    expect(mocks.playHomeGame).toHaveBeenCalledWith("c1", "s1");
    expect(await screen.findByText("Jugado 1 vez 🎉")).toBeInTheDocument();
  });

  it("muestra la evolución de cada tema con su tendencia y la emoción más reciente; sin temas débiles lo dice", async () => {
    mocks.getProgress.mockResolvedValue({
      ...base,
      feelings: feelings({ answered: 0, weatherAvg: null }),
      topics: [topic({ accuracy: 0.9, attempts: 20, trend: "up", needsHelp: [], lastEmotion: "orgullo" })],
    });
    render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);
    expect(await screen.findByText("📈 Cómo va en cada tema")).toBeInTheDocument();
    expect(screen.getByText("90 % de aciertos en 20 preguntas")).toBeInTheDocument();
    expect(screen.getByText("↗ Mejorando")).toBeInTheDocument();
    expect(screen.getByTitle("Orgullo")).toHaveTextContent("🤩");
    expect(screen.getByText(/ningún tema necesita refuerzo/)).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay respuestas/)).toBeInTheDocument();
  });

  describe("espacio familia: la semana, con los demás y el plan (specs/018)", () => {
    const week = {
      weekKey: "2026-W44",
      learning: { status: "atento", practices: 3, practicesPrev: 1, attempts: 30, accuracy: 0.6, accuracyPrev: null, topics: [], focusTopic: { name: "Adición y sustracción dentro de 20", nameEn: null } },
      feelings: { status: "bien", topEmotion: "alegria", topEmotionPrev: null, moodAvg: 4, moodAvgPrev: null },
      social: { status: "atencion", answeredThisWeek: true },
    };
    const social = {
      enabled: true,
      answeredWeeks: 1,
      latest: { weekKey: "2026-W44", recess: 4, confidant: 2, excluded: "varias" },
      history: [{ weekKey: "2026-W44", recess: 4, confidant: 2, excluded: "varias" }],
      signal: { level: "atencion", reasons: ["excluded_often"] },
      notes: [],
      guidance: {
        open: [{ es: "Busquen un momento tranquilo.", en: "Find a calm moment." }],
        avoid: [{ es: "Evitar minimizar.", en: "Avoid brushing it off." }],
        school: { es: "Hablen con el encargado de convivencia escolar.", en: "Talk with the coexistence coordinator." },
        professional: { es: "Busca apoyo profesional si dura.", en: "Seek support if it lasts." },
        urgent: { es: "Llama gratis a la línea *4141.", en: "Call *4141." },
        resources: { es: "Fono Infancia 800 200 818.", en: "Fono Infancia." },
        reasons: [{ key: "excluded_often", es: "En su última respuesta contó que alguien lo molestó o lo dejó fuera varias veces esta semana.", en: "x" }],
      },
    };
    const progress = (plan: "familia" | "gratis") => ({
      plan,
      week,
      social,
      child: { id: "c1", displayName: "Sofía", grade: 2 },
      currentLevel: 2,
      totalSessions: 3,
      lastSessionAt: null,
      totalAttempts: 30,
      correctAttempts: 18,
      accuracy: 0.6,
      errorBreakdown: {},
    });

    it("muestra «La semana de…», la señal social con qué hacer, y el historial con nombres cortos para la familia", async () => {
      mocks.getProgress.mockResolvedValue(progress("familia"));
      render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);
      expect(await screen.findByRole("heading", { name: "📅 La semana de Sofía" })).toBeInTheDocument();
      expect(screen.getByText("Para reforzar: Sumar y restar hasta 20")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "🧡 Conviene conversar en los próximos días" })).toBeInTheDocument();
      expect(screen.getByText(/varias veces esta semana/)).toBeInTheDocument();
      expect(screen.getByText("Llama gratis a la línea *4141.")).toBeInTheDocument();
      expect(screen.getByText(/encargado de convivencia escolar/)).toBeInTheDocument();
      expect(screen.getByText(/el colegio no las ve/)).toBeInTheDocument();
      expect(screen.getByText("😔 sin nadie, y quería estar con alguien")).toBeInTheDocument();
    });

    it("en el plan gratis muestra aprendizaje, «Con los demás» (una señal de acoso no va detrás de un pago) y el Plan Familia, sin emociones", async () => {
      mocks.getProgress.mockResolvedValue(progress("gratis"));
      render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} />);
      expect(await screen.findByRole("heading", { name: "⭐ Plan Familia" })).toBeInTheDocument();
      expect(screen.getByText("📚 Aprendizaje")).toBeInTheDocument();
      expect(screen.queryByText("💛 Cómo se siente")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "🤝 Con los demás" })).toBeInTheDocument();
    });

    it("si el espacio familia se bloqueó, vuelve a pedir el PIN", async () => {
      const { ApiError } = await import("../api/client.js");
      mocks.getProgress.mockRejectedValue(new ApiError(403, { error: "family_locked" }));
      const onLocked = vi.fn();
      render(<FamilyDashboardScreen childId="c1" onBack={vi.fn()} onLocked={onLocked} />);
      await vi.waitFor(() => expect(onLocked).toHaveBeenCalled());
    });
  });
});
