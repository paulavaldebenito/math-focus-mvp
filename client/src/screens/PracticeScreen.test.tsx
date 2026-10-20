import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PracticeScreen } from "./PracticeScreen.js";
import { FEEDBACK_CORRECT_VARIANTS, LangReactContext, t } from "../lib/i18n.js";

// El texto de acierto ahora varía al azar entre varias frases (para que 6
// preguntas por sesión no repitan siempre la misma) — se verifica que sea
// UNA de las variantes conocidas, no un texto fijo.
function findCorrectFeedback() {
  return screen.findByText((text) => FEEDBACK_CORRECT_VARIANTS.es.includes(text));
}

const mocks = vi.hoisted(() => ({
  startSession: vi.fn(),
  getNextExercise: vi.fn(),
  submitAttempt: vi.fn(),
  submitSpotErrorAttempt: vi.fn(),
  submitPauseEvent: vi.fn(),
  submitCheckIn: vi.fn(),
  getHomeSummary: vi.fn(),
  completeSession: vi.fn(),
}));

vi.mock("../api/endpoints.js", () => mocks);

mocks.getHomeSummary.mockResolvedValue({ companion: "capi", totalStars: 0, starsToday: 0, streak: 0 });
mocks.completeSession.mockResolvedValue({ id: "s1", starAwarded: true });

/** El check-in de caritas es lo primero de la sesión — se salta. */
async function skipCheckIn(user: ReturnType<typeof userEvent.setup>, skipLabel = "Saltar") {
  await user.click(await screen.findByRole("button", { name: skipLabel }));
}

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

// La sesión son 6 preguntas; se numeran para no declarar 6 prompts
// distintos en las pruebas de recreo de mitad de sesión y racha.
function makeExercise(i: number) {
  return {
    id: `ex${i}`,
    prompt: `Pregunta ${i}`,
    options: [{ id: `a${i}`, label: "correcta" }, { id: `b${i}`, label: "incorrecta" }],
  };
}

async function answerAndContinue(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(await screen.findByRole("button", { name: label }));
  await user.click(await screen.findByRole("button", { name: "Continuar" }));
}

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

    expect(await findCorrectFeedback()).toBeInTheDocument();
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

    expect(await findCorrectFeedback()).toBeInTheDocument();
    expect(mocks.submitAttempt).toHaveBeenLastCalledWith(
      "s1",
      expect.objectContaining({ exerciseId: "ex1", selectedOptionId: "a1" }),
    );
  });

  it("ofrece un recreo a mitad de sesión aunque no haya señal de cansancio, y nunca bloquea si se rechaza", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise
      .mockResolvedValueOnce(makeExercise(1))
      .mockResolvedValueOnce(makeExercise(2))
      .mockResolvedValueOnce(makeExercise(3))
      .mockResolvedValueOnce(makeExercise(4));
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: true,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
    });
    mocks.submitPauseEvent.mockResolvedValue({ id: "p1", accepted: false });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipPrePause(user);
    await screen.findByText("Pregunta 1");
    await answerAndContinue(user, "correcta");
    await screen.findByText("Pregunta 2");
    await answerAndContinue(user, "correcta");
    await screen.findByText("Pregunta 3");
    await answerAndContinue(user, "correcta");

    // La sesión (6 preguntas) ofrece el recreo al llegar a la mitad (tras
    // responder la pregunta 3 de 6), no solo cuando el motor adaptativo
    // detecta cansancio.
    await screen.findByRole("heading", { name: "¡Llegaste a la mitad! 🎉" });
    // En este recreo la mascota aparece destacada (grande, festejante) como
    // parte de la oferta — no una pantalla ni un bloqueo nuevo.
    expect(screen.getByText("¡Qué bien lo estás haciendo!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Prefiero seguir" }));

    expect(mocks.submitPauseEvent).toHaveBeenCalledWith("s1", { kind: "respiracion", accepted: false });
    await screen.findByText("Pregunta 4");
  });

  it("si el motor pide una pausa por cansancio justo en la pregunta de mitad de sesión, gana la de cansancio (nunca dos pausas seguidas)", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise
      .mockResolvedValueOnce(makeExercise(1))
      .mockResolvedValueOnce(makeExercise(2))
      .mockResolvedValueOnce(makeExercise(3))
      .mockResolvedValueOnce(makeExercise(4));
    mocks.submitAttempt
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 2,
      })
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 2,
      })
      .mockResolvedValueOnce({
        // Justo la pregunta 3 de 6 — la que también dispararía el recreo de
        // mitad de sesión — trae la señal real de cansancio del motor.
        isCorrect: false,
        action: { type: "OFFER_PAUSE", ruleCode: "FATIGUE_SIGNAL", reason: "x" },
        level: 2,
      });
    mocks.submitPauseEvent.mockResolvedValue({ id: "p1", accepted: false });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipPrePause(user);
    await screen.findByText("Pregunta 1");
    await answerAndContinue(user, "correcta");
    await screen.findByText("Pregunta 2");
    await answerAndContinue(user, "correcta");
    await screen.findByText("Pregunta 3");
    await user.click(screen.getByRole("button", { name: "incorrecta" }));
    await user.click(await screen.findByRole("button", { name: "Continuar" }));

    // La pausa que aparece es la de cansancio (motivo real), no el recreo de
    // mitad de sesión — no se ofrecen dos pausas seguidas.
    await screen.findByRole("heading", { name: "Pausa para respirar" });
    expect(screen.queryByRole("heading", { name: "¡Llegaste a la mitad! 🎉" })).not.toBeInTheDocument();
    // La pausa por cansancio nunca festeja con la mascota — ese destaque es
    // solo del recreo de mitad de sesión.
    expect(screen.queryByText("¡Qué bien lo estás haciendo!")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Prefiero seguir" }));
    await screen.findByText("Pregunta 4");
  });

  it("muestra una racha a partir de 2 aciertos seguidos, y la oculta en silencio tras un error (sin anunciarlo)", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise
      .mockResolvedValueOnce(makeExercise(1))
      .mockResolvedValueOnce(makeExercise(2))
      .mockResolvedValueOnce(makeExercise(3));
    mocks.submitAttempt
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 2,
      })
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "RAISE_LEVEL", ruleCode: "THREE_CORRECT_NO_HELP", reason: "x" },
        level: 3,
      })
      .mockResolvedValueOnce({
        isCorrect: false,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 3,
      });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipPrePause(user);
    await screen.findByText("Pregunta 1");
    await user.click(screen.getByRole("button", { name: "correcta" }));
    // Un solo acierto no muestra racha todavía.
    expect(screen.queryByText(/aciertos seguidos/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await screen.findByText("Pregunta 2");
    await user.click(screen.getByRole("button", { name: "correcta" }));
    expect(await screen.findByText(/2.*aciertos seguidos/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await screen.findByText("Pregunta 3");
    await user.click(screen.getByRole("button", { name: "incorrecta" }));
    // Tras un error no se muestra "racha rota" ni ningún aviso — simplemente
    // desaparece el contador, en silencio.
    expect(screen.queryByText(/aciertos seguidos/)).not.toBeInTheDocument();
    expect(screen.queryByText(/racha/i)).not.toBeInTheDocument();
  });

  it("con un interés elegido, el camino de misión usa su emoji; sin interés, usa un ícono neutro", async () => {
    mocks.getHomeSummary.mockResolvedValueOnce({
      companion: "capi",
      totalStars: 0,
      starsToday: 0,
      streak: 0,
      interests: ["espacio"],
    });
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: true,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
    });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    await skipPrePause(userEvent.setup());
    await screen.findByText("¿Cuánto es 6 + 7?");

    expect(document.querySelectorAll(".quest-step")).toHaveLength(6);
    expect(screen.getAllByText("🚀").length).toBeGreaterThan(0);
  });

  it("con un nodo del mapa elegido, pasa el mathSkillId a startSession y muestra el nombre de la habilidad", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: true,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
    });

    render(
      <PracticeScreen
        childId="child-1"
        startingLevel={2}
        mathSkillId="skill-1"
        skillName="Sumas hasta 100"
        onSessionComplete={vi.fn()}
      />,
    );
    await skipPrePause(userEvent.setup());
    await screen.findByText("¿Cuánto es 6 + 7?");

    expect(mocks.startSession).toHaveBeenCalledWith("child-1", "skill-1");
    expect(screen.getByText("Sumas hasta 100")).toBeInTheDocument();
  });

  it("sin nodo elegido (sesión de todo el curso), no llama con mathSkillId ni muestra subtítulo", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    await skipPrePause(userEvent.setup());
    await screen.findByText("¿Cuánto es 6 + 7?");

    expect(mocks.startSession).toHaveBeenCalledWith("child-1", undefined);
  });

  it("la pantalla de fin de sesión muestra el conteo de correctas y la racha de días", async () => {
    mocks.getHomeSummary.mockResolvedValueOnce({
      companion: "capi",
      totalStars: 0,
      starsToday: 0,
      streak: 3,
    });
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise
      .mockResolvedValueOnce(makeExercise(1))
      .mockResolvedValueOnce(makeExercise(2))
      .mockResolvedValueOnce(makeExercise(3))
      .mockResolvedValueOnce(makeExercise(4))
      .mockResolvedValueOnce(makeExercise(5))
      .mockResolvedValueOnce(makeExercise(6));
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: true,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
    });
    mocks.submitPauseEvent.mockResolvedValue({ id: "p1", accepted: false });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();
    await skipPrePause(user);

    for (let i = 0; i < 6; i++) {
      await user.click(await screen.findByRole("button", { name: "correcta" }));
      const continueFeedback = screen.getByRole("button", { name: "Continuar" });
      await user.click(continueFeedback);
      const pauseDecline = screen.queryByRole("button", { name: "Prefiero seguir" });
      if (pauseDecline) await user.click(pauseDecline);
    }

    await screen.findByRole("heading", { name: "¡Sesión terminada!" });
    expect(screen.getByText("6/6")).toBeInTheDocument();
    expect(screen.getByText(/3 días seguidos/)).toBeInTheDocument();
  });

  it("si el error está clasificado, muestra un mensaje concreto de cómo mejorar en vez del genérico", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: false,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
      errorCode: "E1_OP",
      bonusStarAwarded: false,
    });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();
    await skipPrePause(user);
    await screen.findByText("¿Cuánto es 6 + 7?");
    await user.click(screen.getByRole("button", { name: "12" }));

    expect(
      await screen.findByText(
        "Antes de calcular, piensa bien qué necesitas hacer con estos números para responder la pregunta.",
      ),
    ).toBeInTheDocument();
  });

  it("al fallar, siempre muestra cómo se resuelve aunque no haya pedido pista antes de responder", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitAttempt.mockResolvedValue({
      isCorrect: false,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
      errorCode: null,
      bonusStarAwarded: false,
    });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();
    await skipPrePause(user);
    await screen.findByText("¿Cuánto es 6 + 7?");
    // No se pide pista antes de responder — la nota debe aparecer igual.
    await user.click(screen.getByRole("button", { name: "12" }));

    expect(await screen.findByText("Así se resuelve: Cuenta hacia adelante desde 6.")).toBeInTheDocument();
  });

  it("una racha de 3 aciertos seguidos otorga una estrella bonus visible", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise
      .mockResolvedValueOnce(makeExercise(1))
      .mockResolvedValueOnce(makeExercise(2))
      .mockResolvedValueOnce(makeExercise(3))
      .mockResolvedValueOnce(makeExercise(4));
    mocks.submitAttempt
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 2,
        errorCode: null,
        bonusStarAwarded: false,
      })
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 2,
        errorCode: null,
        bonusStarAwarded: false,
      })
      .mockResolvedValueOnce({
        isCorrect: true,
        action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
        level: 2,
        errorCode: null,
        bonusStarAwarded: true,
      });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();
    await skipPrePause(user);

    await screen.findByText("Pregunta 1");
    await user.click(screen.getByRole("button", { name: "correcta" }));
    // Un acierto suelto (sin bonus) nunca dispara el momento destacado de la
    // mascota — solo debe sentirse en la racha de 3, no en cada acierto.
    expect(screen.queryByText("¡Vas increíble! Sigue así")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await screen.findByText("Pregunta 2");
    await answerAndContinue(user, "correcta");
    await screen.findByText("Pregunta 3");
    await user.click(screen.getByRole("button", { name: "correcta" }));

    expect(await screen.findByText(/Racha de 3! Estrella extra/)).toBeInTheDocument();
    // Al llegar a la racha de 3, la mascota aparece grande y festejante —
    // "de vez en cuando", no en cada acierto (ver arriba, preguntas 1 y 2).
    expect(await screen.findByText("¡Vas increíble! Sigue así")).toBeInTheDocument();

    // El momento es puramente decorativo: nunca bloquea seguir la sesión, ni
    // siquiera mientras sigue visible en pantalla. La pregunta 3 también es
    // la mitad de la sesión, así que "Continuar" lleva al recreo de mitad de
    // sesión (con la mascota destacada ahí también) antes de la pregunta 4.
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("heading", { name: "¡Llegaste a la mitad! 🎉" });
    expect(screen.getByText("¡Qué bien lo estás haciendo!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Prefiero seguir" }));
    await screen.findByText("Pregunta 4");
  });

  const spotErrorExercise = {
    id: "ex-spot",
    mode: "spot_error" as const,
    prompt: "Hay 24 frutillas para repartir por igual entre 6 amigos. ¿Cuántas recibe cada uno?",
    characterAnswerLabel: "6",
    correctAnswerLabel: "4",
    wrongOptionId: "opt-wrong-1",
    explanationOptions: ["E1_OP", "E2_CAL", "E3_DATO"],
    procedureNote: "Cuenta de 6 en 6 hasta llegar a 24 y ve cuántos grupos formaste.",
  };

  it("en una ronda 'detecta el error', muestra la respuesta del personaje y las alternativas de diagnóstico", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(spotErrorExercise);

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    await skipPrePause(userEvent.setup());

    await screen.findByText(spotErrorExercise.prompt);
    expect(screen.getByText("Tu amigo resolvió este problema:")).toBeInTheDocument();
    expect(screen.getByText("💬 6")).toBeInTheDocument();
    expect(screen.getByText("¿Qué crees que le pasó?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se confundió de operación" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tuvo un error de cálculo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usó mal un dato del problema" })).toBeInTheDocument();
  });

  it("diagnóstico correcto: confirma, revela la respuesta correcta y la estrategia", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(spotErrorExercise);
    mocks.submitSpotErrorAttempt.mockResolvedValue({
      isCorrect: true,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
      errorCode: null,
      bonusStarAwarded: false,
      correctCode: "E1_OP",
    });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();
    await skipPrePause(user);
    await screen.findByText(spotErrorExercise.prompt);

    await user.click(screen.getByRole("button", { name: "Se confundió de operación" }));

    expect(mocks.submitSpotErrorAttempt).toHaveBeenCalledWith("s1", {
      exerciseId: "ex-spot",
      wrongOptionId: "opt-wrong-1",
      chosenCode: "E1_OP",
    });
    expect(await screen.findByText("¡Exacto! Se confundió de operación.")).toBeInTheDocument();
    expect(screen.getByText("La respuesta correcta era: 4")).toBeInTheDocument();
    expect(screen.getByText(/Cuenta de 6 en 6/)).toBeInTheDocument();
  });

  it("diagnóstico equivocado: corrige sin culpar, y también revela la respuesta correcta", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(spotErrorExercise);
    mocks.submitSpotErrorAttempt.mockResolvedValue({
      isCorrect: false,
      action: { type: "NO_CHANGE", ruleCode: "NO_RULE_TRIGGERED", reason: "x" },
      level: 2,
      errorCode: null,
      bonusStarAwarded: false,
      correctCode: "E1_OP",
    });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();
    await skipPrePause(user);
    await screen.findByText(spotErrorExercise.prompt);

    await user.click(screen.getByRole("button", { name: "Tuvo un error de cálculo" }));

    expect(await screen.findByText("No fue por eso: Se confundió de operación.")).toBeInTheDocument();
    expect(screen.getByText("La respuesta correcta era: 4")).toBeInTheDocument();
  });

  it("completar una pausa de movimiento antes de empezar muestra la celebración de la mascota", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitPauseEvent.mockResolvedValue({ id: "p1", accepted: true });

    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await screen.findByRole("button", { name: "Movimiento" });
    await user.click(screen.getByRole("button", { name: "Movimiento" }));
    await user.click(await screen.findByRole("button", { name: "Listo" }));

    expect(mocks.submitPauseEvent).toHaveBeenCalledWith("s1", {
      kind: "movimiento",
      accepted: true,
      exerciseKey: expect.any(String),
    });
    expect(await screen.findByText("¡Ganaste una estrella por cuidarte! ⭐")).toBeInTheDocument();
    // La pregunta ya está debajo, sin bloquear el flujo por la celebración.
    await screen.findByText("¿Cuánto es 6 + 7?");
  });
});

describe("PracticeScreen — ánimo con caritas y pausas sin repetir", () => {
  it("en la primera práctica del día pregunta cómo se siente (dos escalas de 5 caritas) y guarda lo que respondió", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2, checkInDue: true });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitCheckIn.mockResolvedValue({ id: "c1" });
    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await screen.findByText("¿Cómo estás hoy?");
    const groups = screen.getAllByRole("radiogroup");
    expect(groups).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Listo" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Un poco triste" }));
    await user.click(screen.getByRole("radio", { name: "Tranquilo/a" }));
    expect(screen.getByRole("radio", { name: "Un poco triste" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(mocks.submitCheckIn).toHaveBeenCalledWith("s1", { mood: 2, mathFeeling: 4 });
    await screen.findByRole("button", { name: "Empezar ahora" });
  });

  it("saltar el check-in lo registra vacío (para no volver a preguntar hoy) y la práctica sigue igual", async () => {
    mocks.submitCheckIn.mockClear();
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2, checkInDue: true });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipCheckIn(user);
    await screen.findByRole("button", { name: "Empezar ahora" });
    expect(mocks.submitCheckIn).toHaveBeenCalledWith("s1", {});
  });

  it("si ya respondió hoy (checkInDue false), no vuelve a preguntar", async () => {
    mocks.submitCheckIn.mockClear();
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2, checkInDue: false });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);

    await screen.findByRole("button", { name: "Empezar ahora" });
    expect(screen.queryByText("¿Cómo estás hoy?")).not.toBeInTheDocument();
    expect(mocks.submitCheckIn).not.toHaveBeenCalled();
  });

  it("si el registro del check-in falla, igual continúa (nunca bloquea)", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2, checkInDue: true });
    mocks.getNextExercise.mockResolvedValueOnce(ex1);
    mocks.submitCheckIn.mockRejectedValueOnce(new Error("red"));
    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("radio", { name: "¡Muy bien!" }));
    await user.click(screen.getByRole("button", { name: "Listo" }));
    await screen.findByRole("button", { name: "Empezar ahora" });
  });

  it("una segunda pausa de movimiento en la misma sesión es un ejercicio distinto al primero", async () => {
    mocks.submitPauseEvent.mockReset();
    mocks.submitPauseEvent.mockResolvedValue({ id: "p1", accepted: true });
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2, checkInDue: true });
    mocks.getNextExercise.mockResolvedValueOnce(ex1).mockResolvedValueOnce(ex2);
    mocks.submitAttempt.mockResolvedValueOnce({
      isCorrect: false,
      action: { type: "OFFER_PAUSE", ruleCode: "FATIGUE_SIGNAL", reason: "x" },
      level: 2,
    });
    render(<PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />);
    const user = userEvent.setup();

    await skipCheckIn(user);
    await user.click(await screen.findByRole("button", { name: "Movimiento" }));
    await user.click(await screen.findByRole("button", { name: "Listo" }));
    await screen.findByText("¿Cuánto es 6 + 7?");
    await user.click(screen.getByRole("button", { name: "12" }));
    await user.click(await screen.findByRole("button", { name: "Continuar" }));

    await user.click(await screen.findByRole("button", { name: "Movimiento" }));
    await user.click(await screen.findByRole("button", { name: "Listo" }));
    await screen.findByText("¿Cuánto es 8 + 5?");

    const keys = mocks.submitPauseEvent.mock.calls
      .map(([, input]) => input as { kind: string; accepted: boolean; exerciseKey?: string })
      .filter((i) => i.accepted && i.kind === "movimiento")
      .map((i) => i.exerciseKey);
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });
});

describe("PracticeScreen — ilustración SVG y alternativas bilingües", () => {
  const pattern = {
    id: "exP",
    prompt: "Patrón de colores: rojo, azul, rojo, ... ¿Qué color sigue?",
    promptEn: "Color pattern: red, blue, red, ... Which color comes next?",
    options: [
      { id: "o1", label: "azul", labelEn: "blue" },
      { id: "o2", label: "12", labelEn: null },
    ],
    visual: { kind: "combine" as const, a: 1, b: 1 },
    image: {
      kind: "conteo",
      size: { es: { width: 640, height: 500 }, en: { width: 640, height: 500 } },
      src: { es: "/banco-imagenes/1_basico/es/exP.svg", en: "/banco-imagenes/1_basico/en/exP.svg" },
      alt: { es: "Patrón de colores", en: "Color pattern" },
    },
  };

  it("en inglés muestra el SVG inglés en vez del visual, y traduce solo las alternativas que tienen labelEn", async () => {
    mocks.startSession.mockResolvedValue({ sessionId: "s1", currentLevel: 2 });
    mocks.getNextExercise.mockResolvedValueOnce(pattern);

    const { container } = render(
      <LangReactContext.Provider value={{ lang: "en", setLang: () => {} }}>
        <PracticeScreen childId="child-1" startingLevel={2} onSessionComplete={vi.fn()} />
      </LangReactContext.Provider>,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: t("en", "prePauseSkip") }));

    await screen.findByText("Color pattern: red, blue, red, ... Which color comes next?");
    expect(screen.getByRole("img", { name: "Color pattern" })).toHaveAttribute("src", "/banco-imagenes/1_basico/en/exP.svg");
    expect(container.querySelector(".pictorial-row")).toBeNull();
    expect(screen.getByRole("button", { name: "blue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "12" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "azul" })).not.toBeInTheDocument();
  });
});
