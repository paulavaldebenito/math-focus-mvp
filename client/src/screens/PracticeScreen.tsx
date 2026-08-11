import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { AttemptResult, ExercisePublic } from "../api/types.js";

const QUESTIONS_PER_SESSION = 6;
const QUESTION_TIME_WINDOW_MS = 45000; // solo visual, nunca bloquea ni penaliza

interface Props {
  childId: string;
  startingLevel: number;
  onSessionComplete: () => void;
}

type Phase = "loading" | "question" | "feedback" | "pause-offer" | "done" | "error";

function feedbackMessage(result: AttemptResult): string {
  if (result.isCorrect) return "Avanzaste un paso más.";
  if (result.action.ruleCode === "FAST_THEN_WRONG") return "Mira nuevamente este dato.";
  return "Probemos otra estrategia.";
}

export function PracticeScreen({ childId, startingLevel, onSessionComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ExercisePublic | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [level, setLevel] = useState(startingLevel);
  const questionShownAt = useRef<number>(Date.now());
  const sessionStarted = useRef(false);

  useEffect(() => {
    // Guardia contra doble invocación (React StrictMode en desarrollo, o un
    // remount rápido): sin esto, se crea una Session duplicada en el
    // servidor por cada montaje adicional del componente.
    if (sessionStarted.current) return;
    sessionStarted.current = true;

    endpoints
      .startSession(childId)
      .then(({ sessionId: id, currentLevel }) => {
        setSessionId(id);
        setLevel(currentLevel);
        return endpoints.getNextExercise(childId, id);
      })
      .then((ex) => {
        setExercise(ex);
        setPhase("question");
        questionShownAt.current = Date.now();
      })
      .catch(() => setPhase("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function loadNextExercise(currentSessionId: string) {
    try {
      const ex = await endpoints.getNextExercise(childId, currentSessionId);
      setExercise(ex);
      setSelectedOptionId(null);
      setHintsUsed(0);
      setShowHint(false);
      setPhase("question");
      questionShownAt.current = Date.now();
    } catch {
      setPhase("error");
    }
  }

  async function handleAnswer(optionId: string) {
    if (!exercise || !sessionId) return;
    setSelectedOptionId(optionId);
    const responseTimeMs = Date.now() - questionShownAt.current;

    try {
      const res = await endpoints.submitAttempt(sessionId, {
        exerciseId: exercise.id,
        selectedOptionId: optionId,
        responseTimeMs,
        hintsUsed,
      });
      setResult(res);
      setLevel(res.level);
      setPhase("feedback");
    } catch {
      setPhase("error");
    }
  }

  async function handleContinueAfterFeedback() {
    const nextCount = answeredCount + 1;
    setAnsweredCount(nextCount);

    if (result?.action.type === "OFFER_PAUSE") {
      setPhase("pause-offer");
      return;
    }

    await proceedToNextOrDone(nextCount);
  }

  async function proceedToNextOrDone(count: number) {
    if (!sessionId) return;
    if (count >= QUESTIONS_PER_SESSION) {
      setPhase("done");
      return;
    }
    await loadNextExercise(sessionId);
  }

  async function handlePauseChoice(accepted: boolean) {
    if (!sessionId) return;
    try {
      await endpoints.submitPauseEvent(sessionId, { kind: "respiracion", accepted });
    } catch {
      // La pausa nunca bloquea el progreso, incluso si el registro falla.
    }
    await proceedToNextOrDone(answeredCount);
  }

  if (phase === "loading") {
    return (
      <main className="screen" aria-busy="true">
        <p>Preparando tu práctica…</p>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="screen">
        <p className="error-text" role="alert">
          No se pudo continuar. Intenta de nuevo en un momento.
        </p>
      </main>
    );
  }

  if (phase === "pause-offer") {
    return (
      <main className="screen">
        <h1>Pausa para respirar</h1>
        <p>¿Quieres tomarte un momento antes de seguir?</p>
        <button className="btn-primary" type="button" onClick={() => void handlePauseChoice(true)}>
          Sí, hagamos una pausa
        </button>
        <button className="btn-secondary" type="button" onClick={() => void handlePauseChoice(false)}>
          Prefiero seguir
        </button>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="screen">
        <h1>¡Sesión terminada!</h1>
        <p>Buen trabajo hoy.</p>
        <button className="btn-primary" type="button" onClick={onSessionComplete}>
          Volver al inicio
        </button>
      </main>
    );
  }

  if (!exercise) return null;

  return (
    <main className="screen">
      <p className="hint-text">
        Pregunta {answeredCount + 1} de {QUESTIONS_PER_SESSION} · nivel {level}
      </p>

      {phase === "question" && (
        <div
          key={exercise.id}
          aria-hidden="true"
          style={{
            width: "100%",
            height: "4px",
            background: "var(--border)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "var(--brand-bg)",
              animation: `fill-timer ${QUESTION_TIME_WINDOW_MS}ms linear forwards`,
            }}
          />
        </div>
      )}

      <h1>{exercise.prompt}</h1>

      {phase === "question" && (
        <>
          <div className="form">
            {exercise.options.map((opt) => (
              <button
                key={opt.id}
                className="btn-secondary"
                type="button"
                onClick={() => void handleAnswer(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {!showHint && (
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setShowHint(true);
                setHintsUsed((h) => h + 1);
              }}
            >
              Necesito una pista
            </button>
          )}
          {showHint && exercise.procedureNote && <p className="hint-text">Pista: {exercise.procedureNote}</p>}
        </>
      )}

      {phase === "feedback" && result && (
        <div className="form">
          <p aria-live="polite">{feedbackMessage(result)}</p>
          {selectedOptionId && (
            <p className="hint-text">
              {result.isCorrect ? "✓" : "Elegiste: "}
              {!result.isCorrect && exercise.options.find((o) => o.id === selectedOptionId)?.label}
            </p>
          )}
          <button className="btn-primary" type="button" onClick={() => void handleContinueAfterFeedback()}>
            Continuar
          </button>
        </div>
      )}

      <style>{`@keyframes fill-timer { from { width: 0% } to { width: 100% } }`}</style>
    </main>
  );
}
