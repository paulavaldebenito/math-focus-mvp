import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { AttemptResult, ExercisePublic } from "../api/types.js";
import { ExerciseVisual } from "../components/ExerciseVisual.js";
import { BreathingPause } from "../components/BreathingPause.js";
import { MovementPause } from "../components/MovementPause.js";
import { CompanionAvatar, type CompanionMood } from "../components/CompanionAvatar.js";
import { Confetti } from "../components/Confetti.js";
import { companionByKey, type Companion } from "../lib/companions.js";
import { cancelSpeech, speak, speechSupported } from "../lib/speech.js";
import {
  playComplete,
  playCorrect,
  playHint,
  playLevelUp,
  playMascotChirp,
  playRetry,
  playStar,
} from "../lib/sound.js";
import { localize, t, useLang } from "../lib/i18n.js";

const QUESTIONS_PER_SESSION = 6;

interface Props {
  childId: string;
  startingLevel: number;
  onSessionComplete: () => void;
}

type Phase =
  | "loading"
  | "pre-pause-offer"
  | "pre-pause-breathing"
  | "pre-pause-movement"
  | "question"
  | "feedback"
  | "pause-offer"
  | "pause-breathing"
  | "pause-movement"
  | "done"
  | "error";

function feedbackKey(result: AttemptResult): "feedbackCorrect" | "feedbackReview" | "feedbackRetry" {
  if (result.isCorrect) return "feedbackCorrect";
  if (result.action.ruleCode === "FAST_THEN_WRONG") return "feedbackReview";
  return "feedbackRetry";
}

export function PracticeScreen({ childId, startingLevel, onSessionComplete }: Props) {
  const { lang } = useLang();
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ExercisePublic | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [level, setLevel] = useState(startingLevel);
  const [starsThisSession, setStarsThisSession] = useState(0);
  const [companion, setCompanion] = useState<Companion>(companionByKey(null));
  const [mood, setMood] = useState<CompanionMood>("idle");
  const questionShownAt = useRef<number>(Date.now());
  const sessionStarted = useRef(false);
  const sessionCompleted = useRef(false);
  // Guarda cómo reintentar la última acción que falló, para que la pantalla
  // de error pueda ofrecer "Intentar de nuevo" en vez de dejar al niño
  // varado a mitad de sesión.
  const retryActionRef = useRef<() => void>(() => {});

  function bootstrapSession() {
    endpoints
      .getHomeSummary(childId)
      .then((summary) => setCompanion(companionByKey(summary.companion)))
      .catch(() => {
        // El compañero es decorativo en esta pantalla — si falla, se usa el default.
      });

    endpoints
      .startSession(childId)
      .then(({ sessionId: id, currentLevel }) => {
        setSessionId(id);
        setLevel(currentLevel);
        return endpoints.getNextExercise(childId, id);
      })
      .then((ex) => {
        setExercise(ex);
        setPhase("pre-pause-offer");
        questionShownAt.current = Date.now();
      })
      .catch(() => {
        retryActionRef.current = bootstrapSession;
        setPhase("error");
      });
  }

  useEffect(() => {
    // Guardia contra doble invocación (React StrictMode en desarrollo, o un
    // remount rápido): sin esto, se crea una Session duplicada en el
    // servidor por cada montaje adicional del componente.
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    bootstrapSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    // Narración del enunciado — para niños que aún no leen con soltura.
    // Se cancela al desmontar o al cambiar de ejercicio, para que dos
    // enunciados no se lean encimados.
    if (phase === "question" && exercise) {
      speak(localize(lang, exercise.prompt, exercise.promptEn), lang);
    }
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exercise]);

  useEffect(() => {
    if (phase !== "done" || sessionCompleted.current || !sessionId) return;
    sessionCompleted.current = true;
    setStarsThisSession((s) => s + 1);
    playComplete();
    void endpoints.completeSession(sessionId).catch(() => {
      // El cierre de sesión nunca bloquea la vuelta al inicio, aunque falle.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sessionId]);

  async function loadNextExercise(currentSessionId: string) {
    try {
      const ex = await endpoints.getNextExercise(childId, currentSessionId);
      setExercise(ex);
      setSelectedOptionId(null);
      setHintsUsed(0);
      setShowHint(false);
      setMood("idle");
      setPhase("question");
      questionShownAt.current = Date.now();
    } catch {
      retryActionRef.current = () => void loadNextExercise(currentSessionId);
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
      if (res.action.type === "RAISE_LEVEL") playLevelUp();
      setLevel(res.level);
      setPhase("feedback");
      if (res.isCorrect) {
        playCorrect();
        setTimeout(playMascotChirp, 180);
        setMood("happy");
        setStarsThisSession((s) => s + 1);
      } else {
        playRetry();
        setMood("encourage");
      }
    } catch {
      retryActionRef.current = () => void handleAnswer(optionId);
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

  async function recordPauseEvent(kind: "respiracion" | "movimiento", accepted: boolean) {
    if (!sessionId) return;
    try {
      await endpoints.submitPauseEvent(sessionId, { kind, accepted });
      if (accepted) {
        setStarsThisSession((s) => s + 1);
        playStar();
      }
    } catch {
      // La pausa nunca bloquea el progreso, incluso si el registro falla.
    }
  }

  async function handleDeclinePause() {
    await recordPauseEvent("respiracion", false);
    await proceedToNextOrDone(answeredCount);
  }

  async function handlePauseDone(kind: "respiracion" | "movimiento") {
    await recordPauseEvent(kind, true);
    await proceedToNextOrDone(answeredCount);
  }

  async function handleSkipPrePause() {
    await recordPauseEvent("respiracion", false);
    setPhase("question");
    questionShownAt.current = Date.now();
  }

  async function handlePrePauseDone(kind: "respiracion" | "movimiento") {
    await recordPauseEvent(kind, true);
    setPhase("question");
    questionShownAt.current = Date.now();
  }

  if (phase === "loading") {
    return (
      <main className="screen" aria-busy="true">
        <p>{t(lang, "preparingPractice")}</p>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="screen">
        <p className="error-text" role="alert">
          {t(lang, "genericError")}
        </p>
        <button className="btn-primary" type="button" onClick={() => retryActionRef.current()}>
          {t(lang, "retryButton")}
        </button>
      </main>
    );
  }

  if (phase === "pre-pause-offer") {
    return (
      <main className="screen">
        <CompanionAvatar companion={companion} />
        <div className="pause-card">
          <h1>{t(lang, "prePauseTitle")}</h1>
          <p>{t(lang, "prePauseQuestion")}</p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setPhase("pre-pause-breathing")}>
          {t(lang, "pauseAccept")}
        </button>
        <button className="btn-secondary" type="button" onClick={() => setPhase("pre-pause-movement")}>
          {t(lang, "pauseMovementOption")}
        </button>
        <button className="btn-secondary" type="button" onClick={() => void handleSkipPrePause()}>
          {t(lang, "prePauseSkip")}
        </button>
      </main>
    );
  }

  if (phase === "pre-pause-breathing") {
    return (
      <main className="screen">
        <BreathingPause lang={lang} onDone={() => void handlePrePauseDone("respiracion")} />
      </main>
    );
  }

  if (phase === "pre-pause-movement") {
    return (
      <main className="screen">
        <MovementPause lang={lang} onDone={() => void handlePrePauseDone("movimiento")} />
      </main>
    );
  }

  if (phase === "pause-offer") {
    return (
      <main className="screen">
        <CompanionAvatar companion={companion} />
        <div className="pause-card">
          <h1>{t(lang, "pauseTitle")}</h1>
          <p>{t(lang, "pauseQuestion")}</p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setPhase("pause-breathing")}>
          {t(lang, "pauseAccept")}
        </button>
        <button className="btn-secondary" type="button" onClick={() => setPhase("pause-movement")}>
          {t(lang, "pauseMovementOption")}
        </button>
        <button className="btn-secondary" type="button" onClick={() => void handleDeclinePause()}>
          {t(lang, "pauseDecline")}
        </button>
      </main>
    );
  }

  if (phase === "pause-breathing") {
    return (
      <main className="screen">
        <BreathingPause lang={lang} onDone={() => void handlePauseDone("respiracion")} />
      </main>
    );
  }

  if (phase === "pause-movement") {
    return (
      <main className="screen">
        <MovementPause lang={lang} onDone={() => void handlePauseDone("movimiento")} />
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="screen">
        <Confetti />
        <CompanionAvatar companion={companion} mood="happy" />
        <h1>{t(lang, "sessionDoneTitle")}</h1>
        <p>{t(lang, "sessionDoneBody")}</p>
        <span className="star-chip">
          ★ {starsThisSession} {t(lang, "starsEarnedThisSession")}
        </span>
        <button className="btn-primary" type="button" onClick={onSessionComplete}>
          {t(lang, "backHome")}
        </button>
      </main>
    );
  }

  if (!exercise) return null;

  return (
    <main className="screen">
      <CompanionAvatar companion={companion} mood={phase === "feedback" ? mood : "idle"} />

      <p className="hint-text">
        {t(lang, "level")} {level}
      </p>

      <div className="progress-dots" aria-hidden="true">
        {Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => (
          <span key={i} className={i < answeredCount ? "done" : ""} />
        ))}
      </div>

      {(phase === "question" || phase === "feedback") && (
        <div className="focus-frame" key={exercise.id}>
          <span className="fc-bl" aria-hidden="true" />
          <span className="fc-br" aria-hidden="true" />

          {exercise.visual && <ExerciseVisual visual={exercise.visual} />}

          <h1>{localize(lang, exercise.prompt, exercise.promptEn)}</h1>

          {phase === "question" && speechSupported && (
            <button
              className="btn-listen"
              type="button"
              onClick={() => speak(localize(lang, exercise.prompt, exercise.promptEn), lang)}
            >
              {t(lang, "listenAgain")}
            </button>
          )}

          <div className="form">
            {exercise.options.map((opt) => {
              let cls = "option-btn";
              if (phase === "feedback" && opt.id === selectedOptionId) {
                cls += result?.isCorrect ? " correct" : " incorrect";
              }
              return (
                <button
                  key={opt.id}
                  className={cls}
                  type="button"
                  disabled={phase === "feedback"}
                  onClick={() => void handleAnswer(opt.id)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {phase === "question" && !showHint && (
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setShowHint(true);
                setHintsUsed((h) => h + 1);
                playHint();
              }}
            >
              {t(lang, "needHint")}
            </button>
          )}
          {phase === "question" && showHint && exercise.procedureNote && (
            <p className="hint-text">
              {t(lang, "hintLabel")}: {localize(lang, exercise.procedureNote, exercise.procedureNoteEn)}
            </p>
          )}

          {phase === "feedback" && result && (
            <div className={`feedback-card ${result.isCorrect ? "correct" : "retry"}`} aria-live="polite">
              <span className="icon" aria-hidden="true">{result.isCorrect ? "✓" : "↻"}</span>
              <span>{t(lang, feedbackKey(result))}</span>
            </div>
          )}
        </div>
      )}

      {phase === "feedback" && (
        <button className="btn-primary" type="button" onClick={() => void handleContinueAfterFeedback()}>
          {t(lang, "continueBtn")}
        </button>
      )}
    </main>
  );
}
