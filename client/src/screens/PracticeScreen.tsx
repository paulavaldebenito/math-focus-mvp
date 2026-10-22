import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { CheckInInput } from "../api/endpoints.js";
import type { AttemptResult, NextExercisePublic } from "../api/types.js";
import { ExerciseIllustration } from "../components/ExerciseIllustration.js";
import { BreathingPause } from "../components/BreathingPause.js";
import { MovementPause } from "../components/MovementPause.js";
import { MoodCheckIn } from "../components/MoodCheckIn.js";
import { BrickCompanionAvatar, type CompanionMood } from "../components/BrickCompanionAvatar.js";
import { Confetti } from "../components/Confetti.js";
import { MascotMoment } from "../components/MascotMoment.js";
import { SessionReflection } from "../components/SessionReflection.js";
import { WorkedSolution } from "../components/WorkedSolution.js";
import type { ReflectionQuestion } from "../api/types.js";
import { wrongFeedbackText } from "../lib/feedback.js";
import { companionByKey, companionName, type Companion } from "../lib/companions.js";
import { interestByKey } from "../lib/interests.js";
import { cancelSpeech, speak, speechSupported } from "../lib/speech.js";
import {
  playClick,
  playComplete,
  playCombo,
  playCorrect,
  playHint,
  playLevelUp,
  playMascotChirp,
  playRetry,
  playStar,
} from "../lib/sound.js";
import {
  DIAGNOSIS_CHIPS,
  FEEDBACK_CORRECT_VARIANTS,
  localize,
  t,
  useLang,
  type Lang,
} from "../lib/i18n.js";

const QUESTIONS_PER_SESSION = 6;
// A mitad de sesión se ofrece un recreo con movimiento/respiración aunque no
// haya señal de cansancio — antes la única pausa "segura" era la del inicio.
const MIDPOINT_CHECKPOINT = Math.ceil(QUESTIONS_PER_SESSION / 2);

interface Props {
  childId: string;
  startingLevel: number;
  /** Nodo del mapa de habilidades que se practica (mapa de habilidades).
   * Sin él, la sesión es "de todo el curso" (compatibilidad hacia atrás). */
  mathSkillId?: string;
  /** Solo para mostrar como subtítulo — la habilidad real la decide el servidor. */
  skillName?: string;
  /** Traducción al inglés del nombre de la habilidad — null cae al español. */
  skillNameEn?: string | null;
  /** Curso del niño (1-6): las pausas de movimiento repasan contenidos de su nivel. */
  grade?: number;
  onSessionComplete: () => void;
}

type Phase =
  | "loading"
  | "check-in"
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


/**
 * Feedback de una ronda "detecta el error": a diferencia de wrongFeedbackText
 * (que le habla al niño sobre SU error), acá se confirma o corrige su
 * diagnóstico sobre una respuesta ajena — siempre en base a `correctCode`,
 * revelado recién en la respuesta del servidor (nunca antes de diagnosticar).
 */
function spotErrorFeedbackText(lang: Lang, isCorrect: boolean, correctCode: string): string {
  const chip = DIAGNOSIS_CHIPS[lang][correctCode] ?? correctCode;
  const prefix = t(lang, isCorrect ? "spotErrorCorrectPrefix" : "spotErrorWrongPrefix");
  return `${prefix} ${chip}.`;
}

export function PracticeScreen({
  childId,
  startingLevel,
  mathSkillId,
  skillName,
  skillNameEn,
  grade,
  onSessionComplete,
}: Props) {
  const { lang } = useLang();
  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Ejercicios de pausa (respiración o movimiento) ya hechos en esta sesión:
  // la siguiente pausa elige otro, nunca repite el mismo.
  const [usedPauseKeys, setUsedPauseKeys] = useState<string[]>([]);
  const checkInDueRef = useRef(false);
  // Pregunta lúdica del cierre que tocó en esta sesión (rota entre sesiones).
  const [reflectionQuestion, setReflectionQuestion] = useState<ReflectionQuestion>("weather");
  const [exercise, setExercise] = useState<NextExercisePublic | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [level, setLevel] = useState(startingLevel);
  const [starsThisSession, setStarsThisSession] = useState(0);
  // Para el reporte de fin de sesión (pulido "estilo Duolingo"): cuántas de
  // las QUESTIONS_PER_SESSION fueron correctas, y la racha de días que ya
  // traía el niño al empezar (se lee una sola vez, no cambia durante la
  // sesión — la sesión actual recién se cuenta al volver a Inicio).
  const [correctThisSession, setCorrectThisSession] = useState(0);
  const [dayStreak, setDayStreak] = useState(0);
  const [companion, setCompanion] = useState<Companion>(companionByKey(null));
  // Nombre propio que el niño le puso a su mascota — null usa el nombre por
  // defecto del personaje (ver companionName en lib/companions.ts).
  const [mascotName, setMascotName] = useState<string | null>(null);
  const [mood, setMood] = useState<CompanionMood>("idle");
  // Intereses del niño (elegidos en ChooseInterestScreen) — solo para temar
  // esta pantalla (camino de misión, acento de color); nunca cambia qué
  // ejercicio llega, eso ya lo decide el servidor.
  const [childInterests, setChildInterests] = useState<string[]>([]);
  // Por qué se está ofreciendo la pausa actual: decide el texto mostrado en
  // la fase "pause-offer" (nunca crea fases nuevas, solo cambia el copy).
  const [pauseFlavor, setPauseFlavor] = useState<"fatigue" | "checkpoint">("fatigue");
  // Aciertos seguidos EN ESTA SESIÓN — puramente presentacional (combo/racha
  // visible al niño). Nunca se persiste ni influye en el motor adaptativo:
  // esa sigue siendo la única fuente de verdad para nivel y pausas.
  const [streak, setStreak] = useState(0);
  // Momento destacado de la mascota: grande, festejante, "de vez en cuando"
  // — cuando se otorga la estrella bonus de racha (cada 3 aciertos seguidos,
  // ver bonusStarAwarded/applyCorrectEffects) o al completar una pausa de
  // respiración/movimiento (siempre gana una estrella, ver recordPauseEvent).
  // null = no se muestra; el texto cambia según cuál de los dos motivos fue.
  // Puramente visual: se cierra sola (ver MascotMoment) y nunca cambia nivel
  // ni estrellas por sí mismo — la estrella ya se otorgó antes de mostrarlo.
  const [mascotMoment, setMascotMoment] = useState<"streak" | "pause" | null>(null);
  const [feedbackVariant, setFeedbackVariant] = useState("");
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
      .then((summary) => {
        setCompanion(companionByKey(summary.companion));
        setMascotName(summary.mascotName);
        setChildInterests(summary.interests ?? []);
        setDayStreak(summary.streak);
      })
      .catch(() => {
        // El compañero y el interés son decorativos en esta pantalla — si
        // falla, se usa el default (mascota genérica, camino sin temar).
      });

    endpoints
      .startSession(childId, mathSkillId)
      .then(({ sessionId: id, currentLevel, checkInDue, reflectionQuestion: rq }) => {
        setSessionId(id);
        if (rq) setReflectionQuestion(rq);
        // Las preguntas de ánimo van solo en la primera práctica del día.
        checkInDueRef.current = checkInDue === true;
        setLevel(currentLevel);
        return endpoints.getNextExercise(childId, id);
      })
      .then((ex) => {
        setExercise(ex);
        setPhase(checkInDueRef.current ? "check-in" : "pre-pause-offer");
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
    // La narración ya no se dispara sola al mostrar la pregunta (voz
    // robótica no pedida). Se mantiene solo la limpieza: si el niño pidió
    // "Escuchar de nuevo" y cambia de ejercicio o sale de la pantalla, se
    // corta esa lectura en vez de dejarla sonando encima de la siguiente.
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
      setMascotMoment(null);
      setPhase("question");
      questionShownAt.current = Date.now();
    } catch {
      retryActionRef.current = () => void loadNextExercise(currentSessionId);
      setPhase("error");
    }
  }

  // Efectos comunes a cualquier respuesta correcta, sea de resolver un
  // ejercicio o de acertar el diagnóstico en una ronda "detecta el error" —
  // streak/combo/mascota/estrellas se sienten igual sin importar la mecánica.
  function applyCorrectEffects(res: AttemptResult) {
    const newStreak = streak + 1;
    setStreak(newStreak);
    playCorrect(newStreak % 2);
    // A partir de 2 seguidos suena además un pequeño arpegio de combo —
    // nunca al revés: romper la racha nunca suena distinto ni se anuncia.
    if (newStreak >= 2) playCombo();
    setTimeout(playMascotChirp, 180);
    setMood("happy");
    // La estrella bonus (racha de 3) es ADEMÁS de la estrella normal del
    // acierto — nunca la reemplaza, nunca se quita si se corta la racha.
    setStarsThisSession((s) => s + (res.bonusStarAwarded ? 2 : 1));
    if (res.bonusStarAwarded) {
      playStar();
      // La mascota festeja en grande solo acá — "de vez en cuando" (cada 3
      // aciertos seguidos), nunca en cada acierto, para que se sienta como
      // una sorpresa especial y no como una repetición cansadora.
      setMascotMoment("streak");
    }
    setCorrectThisSession((c) => c + 1);
  }

  async function handleAnswer(optionId: string) {
    if (!exercise || exercise.mode === "spot_error" || !sessionId) return;
    setSelectedOptionId(optionId);
    setMascotMoment(null);
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
        const variants = FEEDBACK_CORRECT_VARIANTS[lang];
        setFeedbackVariant(
          res.feedback
            ? localize(lang, res.feedback, res.feedbackEn)
            : variants[Math.floor(Math.random() * variants.length)]!,
        );
        applyCorrectEffects(res);
      } else {
        setFeedbackVariant(wrongFeedbackText(lang, res));
        setStreak(0);
        playRetry();
        setMood("encourage");
      }
    } catch {
      retryActionRef.current = () => void handleAnswer(optionId);
      setPhase("error");
    }
  }

  async function handleSpotErrorAnswer(chosenCode: string) {
    if (!exercise || exercise.mode !== "spot_error" || !sessionId) return;
    setSelectedOptionId(chosenCode);
    setMascotMoment(null);

    try {
      const res = await endpoints.submitSpotErrorAttempt(sessionId, {
        exerciseId: exercise.id,
        wrongOptionId: exercise.wrongOptionId,
        chosenCode,
      });
      setResult(res);
      setLevel(res.level);
      setPhase("feedback");
      setFeedbackVariant(spotErrorFeedbackText(lang, res.isCorrect, res.correctCode!));
      if (res.isCorrect) {
        applyCorrectEffects(res);
      } else {
        setStreak(0);
        playRetry();
        setMood("encourage");
      }
    } catch {
      retryActionRef.current = () => void handleSpotErrorAnswer(chosenCode);
      setPhase("error");
    }
  }

  async function handleFindStepAnswer(line: number) {
    if (!exercise || exercise.mode !== "find_step" || !sessionId) return;
    setSelectedOptionId(String(line));
    setMascotMoment(null);
    try {
      const res = await endpoints.submitFindStepAttempt(sessionId, { exerciseId: exercise.id, wrongOptionId: exercise.wrongOptionId, chosenLine: line });
      setResult(res);
      setLevel(res.level);
      setPhase("feedback");
      // Sin el feedback de la alternativa: está escrito para quien la eligió
      // ("revisa qué operación hiciste") y aquí el error es del amigo.
      setFeedbackVariant(t(lang, res.isCorrect ? "findStepCorrect" : "findStepWrong"));
      if (res.isCorrect) {
        applyCorrectEffects(res);
      } else {
        setStreak(0);
        playRetry();
        setMood("encourage");
      }
    } catch {
      retryActionRef.current = () => void handleFindStepAnswer(line);
      setPhase("error");
    }
  }

  async function handleContinueAfterFeedback() {
    const nextCount = answeredCount + 1;
    setAnsweredCount(nextCount);

    if (result?.action.type === "OFFER_PAUSE") {
      // Señal real de cansancio del motor adaptativo — tiene prioridad sobre
      // el recreo de mitad de sesión: nunca se ofrecen dos pausas seguidas.
      setPauseFlavor("fatigue");
      setPhase("pause-offer");
      return;
    }

    if (nextCount === MIDPOINT_CHECKPOINT) {
      setPauseFlavor("checkpoint");
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

  async function recordPauseEvent(kind: "respiracion" | "movimiento", accepted: boolean, exerciseKey?: string) {
    if (exerciseKey) setUsedPauseKeys((keys) => (keys.includes(exerciseKey) ? keys : [...keys, exerciseKey]));
    if (!sessionId) return;
    try {
      await endpoints.submitPauseEvent(sessionId, { kind, accepted, ...(exerciseKey && { exerciseKey }) });
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

  async function handlePauseDone(kind: "respiracion" | "movimiento", exerciseKey: string) {
    await recordPauseEvent(kind, true, exerciseKey);
    await proceedToNextOrDone(answeredCount);
    // Se marca DESPUÉS de avanzar (nunca antes): loadNextExercise limpia
    // mascotMoment al empezar a cargar la siguiente pregunta — si se
    // marcara antes, esa limpieza lo taparía de inmediato.
    setMascotMoment("pause");
  }

  async function handleSkipPrePause() {
    await recordPauseEvent("respiracion", false);
    setPhase("question");
    questionShownAt.current = Date.now();
  }

  async function handleCheckInDone(answer: CheckInInput | null) {
    // Nunca bloquea: si el registro falla, sigue igual. Saltar también se
    // registra (cuerpo vacío) para no volver a preguntarle hoy.
    if (sessionId) {
      try {
        await endpoints.submitCheckIn(sessionId, answer ?? {});
      } catch {
        // El autorreporte es opcional — un error no interrumpe la práctica.
      }
    }
    setPhase("pre-pause-offer");
  }

  async function handlePrePauseDone(kind: "respiracion" | "movimiento", exerciseKey: string) {
    await recordPauseEvent(kind, true, exerciseKey);
    setPhase("question");
    questionShownAt.current = Date.now();
    setMascotMoment("pause");
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
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playClick();
            retryActionRef.current();
          }}
        >
          {t(lang, "retryButton")}
        </button>
      </main>
    );
  }

  if (phase === "check-in") {
    return (
      <main className="screen">
        <BrickCompanionAvatar companion={companion} />
        <MoodCheckIn lang={lang} onDone={(answer) => void handleCheckInDone(answer)} />
      </main>
    );
  }

  if (phase === "pre-pause-offer") {
    return (
      <main className="screen">
        <BrickCompanionAvatar companion={companion} />
        <div className="pause-card">
          <h1>{t(lang, "prePauseTitle")}</h1>
          <p>{t(lang, "prePauseQuestion")}</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playClick();
            setPhase("pre-pause-breathing");
          }}
        >
          {t(lang, "pauseAccept")}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playClick();
            setPhase("pre-pause-movement");
          }}
        >
          {t(lang, "pauseMovementOption")}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playClick();
            void handleSkipPrePause();
          }}
        >
          {t(lang, "prePauseSkip")}
        </button>
      </main>
    );
  }

  if (phase === "pre-pause-breathing") {
    return (
      <main className="screen">
        <BreathingPause lang={lang} companion={companion} exclude={usedPauseKeys} onDone={(key) => void handlePrePauseDone("respiracion", key)} />
      </main>
    );
  }

  if (phase === "pre-pause-movement") {
    return (
      <main className="screen">
        <MovementPause lang={lang} companion={companion} grade={grade} exclude={usedPauseKeys} onDone={(key) => void handlePrePauseDone("movimiento", key)} />
      </main>
    );
  }

  if (phase === "pause-offer") {
    // A mitad de sesión, la mascota aparece grande y festejante como parte
    // de la oferta de recreo — no es una pantalla nueva, solo un momento más
    // destacado de la que ya existía (nunca en la pausa por cansancio: ahí
    // el foco es ofrecer calma, no una celebración).
    const isCheckpoint = pauseFlavor === "checkpoint";
    return (
      <main className="screen">
        <BrickCompanionAvatar companion={companion} mood={isCheckpoint ? "happy" : "idle"} size={isCheckpoint ? "lg" : "sm"} />
        <div className="pause-card">
          <h1>{t(lang, isCheckpoint ? "checkpointTitle" : "pauseTitle")}</h1>
          <p>{t(lang, isCheckpoint ? "checkpointQuestion" : "pauseQuestion")}</p>
          {isCheckpoint && <p className="mascot-cheer">{t(lang, "checkpointMascotCheer")}</p>}
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playClick();
            setPhase("pause-breathing");
          }}
        >
          {t(lang, "pauseAccept")}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playClick();
            setPhase("pause-movement");
          }}
        >
          {t(lang, "pauseMovementOption")}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playClick();
            void handleDeclinePause();
          }}
        >
          {t(lang, "pauseDecline")}
        </button>
      </main>
    );
  }

  if (phase === "pause-breathing") {
    return (
      <main className="screen">
        <BreathingPause lang={lang} companion={companion} exclude={usedPauseKeys} onDone={(key) => void handlePauseDone("respiracion", key)} />
      </main>
    );
  }

  if (phase === "pause-movement") {
    return (
      <main className="screen">
        <MovementPause lang={lang} companion={companion} grade={grade} exclude={usedPauseKeys} onDone={(key) => void handlePauseDone("movimiento", key)} />
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="screen">
        <Confetti />
        <BrickCompanionAvatar companion={companion} mood="happy" />
        <h1>{t(lang, "sessionDoneTitle")}</h1>
        <p>{t(lang, "sessionDoneBody")}</p>
        <div className="stat-row">
          <div className="stat">
            <span className="value">★ {starsThisSession}</span>
            <span className="label">{t(lang, "starsEarnedThisSession")}</span>
          </div>
          <div className="stat">
            <span className="value">
              {correctThisSession}/{QUESTIONS_PER_SESSION}
            </span>
            <span className="label">{t(lang, "sessionCorrectCount")}</span>
          </div>
        </div>
        {dayStreak > 0 && (
          <span className="streak-pill">
            🔥 {dayStreak} {t(lang, dayStreak === 1 ? "streakDay" : "streakDays")}
          </span>
        )}
        <p className="hint-text">
          {t(lang, "sessionDoneHabitatPrefix")} {companionName(companion, lang, mascotName)}.
        </p>
        {sessionId && (
          <SessionReflection lang={lang} question={reflectionQuestion} onSubmit={(input) => endpoints.submitReflection(sessionId, input)} />
        )}
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playClick();
            onSessionComplete();
          }}
        >
          {t(lang, "backHome")}
        </button>
      </main>
    );
  }

  if (!exercise) return null;

  // Interés elegido por el niño (el primero de hasta 3) para temar esta
  // sesión: emoji del camino de misión y acento de color de la tarjeta.
  // Sin interés elegido (perfil viejo, o aún no eligió), queda undefined y
  // todo cae a su apariencia neutra de siempre.
  const interest = interestByKey(childInterests[0]);
  const accentStyle = interest
    ? ({ "--interest-color": interest.color, "--interest-accent": interest.color } as React.CSSProperties)
    : undefined;

  return (
    <main className="screen">
      {mascotMoment && (
        <MascotMoment
          companion={companion}
          message={t(lang, mascotMoment === "pause" ? "pauseCelebrationMessage" : "mascotStreakMessage")}
          onDone={() => setMascotMoment(null)}
        />
      )}
      <BrickCompanionAvatar companion={companion} mood={phase === "feedback" ? mood : "idle"} />

      {skillName && <p className="skill-name-chip">{localize(lang, skillName, skillNameEn)}</p>}
      <p className="hint-text">
        {t(lang, "level")} {level}
      </p>

      <div className="quest-path" aria-hidden="true" style={accentStyle}>
        {Array.from({ length: QUESTIONS_PER_SESSION }, (_, i) => (
          <span
            key={i}
            className={`quest-step${i < answeredCount ? " done" : ""}${i === answeredCount ? " current" : ""}`}
          >
            {interest ? interest.emoji : "⭐"}
          </span>
        ))}
      </div>

      {(phase === "question" || phase === "feedback") && (
        <div className="focus-frame" key={exercise.id} style={accentStyle}>
          <span className="fc-bl" aria-hidden="true" />
          <span className="fc-br" aria-hidden="true" />

          <ExerciseIllustration image={exercise.image} visual={exercise.visual} interest={interest} options={"options" in exercise ? exercise.options : undefined} />

          {exercise.mode === "spot_error" && <p className="spot-error-lead">{t(lang, "spotErrorLead")}</p>}
          {exercise.mode === "find_step" && <p className="spot-error-lead">{t(lang, "findStepLead")}</p>}

          <h1>{localize(lang, exercise.prompt, exercise.promptEn)}</h1>

          {exercise.mode === "spot_error" && (
            <>
              <p className="spot-error-answer">
                💬 {localize(lang, exercise.characterAnswerLabel, exercise.characterAnswerLabelEn)}
              </p>
              <p className="hint-text">{t(lang, "spotErrorAsk")}</p>
            </>
          )}
          {exercise.mode === "find_step" && <p className="hint-text">{t(lang, "findStepAsk")}</p>}

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
            {exercise.mode === "find_step"
              ? exercise.lines.map((line, i) => {
                  let cls = "option-btn find-step-line";
                  if (phase === "feedback" && result?.correctLine === i) cls += " correct";
                  else if (phase === "feedback" && String(i) === selectedOptionId) cls += " incorrect";
                  return (
                    <button
                      key={i}
                      className={cls}
                      type="button"
                      disabled={phase === "feedback"}
                      onClick={() => {
                        playClick();
                        void handleFindStepAnswer(i);
                      }}
                    >
                      <span className="find-step-n">
                        {t(lang, "findStepStep")} {i + 1}
                      </span>{" "}
                      {localize(lang, line.es, line.en)}
                    </button>
                  );
                })
              : exercise.mode === "spot_error"
              ? exercise.explanationOptions.map((code) => {
                  let cls = "option-btn";
                  if (phase === "feedback" && code === selectedOptionId) {
                    cls += result?.isCorrect ? " correct" : " incorrect";
                  }
                  return (
                    <button
                      key={code}
                      className={cls}
                      type="button"
                      disabled={phase === "feedback"}
                      onClick={() => {
                        playClick();
                        void handleSpotErrorAnswer(code);
                      }}
                    >
                      {DIAGNOSIS_CHIPS[lang][code] ?? code}
                    </button>
                  );
                })
              : exercise.options.map((opt) => {
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
                      onClick={() => {
                        playClick();
                        void handleAnswer(opt.id);
                      }}
                    >
                      {localize(lang, opt.label, opt.labelEn)}
                    </button>
                  );
                })}
          </div>

          {phase === "feedback" && exercise.mode === "spot_error" && (
            <p className="hint-text">
              {t(lang, "spotErrorRevealPrefix")}: {localize(lang, exercise.correctAnswerLabel, exercise.correctAnswerLabelEn)}
            </p>
          )}

          {phase === "question" && !showHint && exercise.mode !== "find_step" && (
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
          {phase === "question" && showHint && "procedureNote" in exercise && exercise.procedureNote && (
            <p className="hint-text">
              {t(lang, "hintLabel")}: {localize(lang, exercise.procedureNote, exercise.procedureNoteEn)}
            </p>
          )}

          {phase === "feedback" && result && (
            <div className={`feedback-card ${result.isCorrect ? "correct" : "retry"}`} aria-live="polite">
              <span className="icon" aria-hidden="true">{result.isCorrect ? "✓" : "💡"}</span>
              <span>{feedbackVariant}</span>
            </div>
          )}
          {/* Al fallar, siempre se muestra el "cómo se hace" — antes solo
              aparecía si el niño pedía pista ANTES de responder, dejando sin
              ninguna guía a quien no la pidió. Ayuda a mejorar en el momento,
              no reemplaza la pista proactiva (que sigue disponible arriba).
              En una ronda "detecta el error" se muestra siempre, haya
              acertado el diagnóstico o no — ver cómo se resuelve el
              problema real siempre suma, incluso si ya identificó el error. */}
          {phase === "feedback" &&
            result &&
            (!result.isCorrect || exercise.mode === "spot_error") &&
            "procedureNote" in exercise &&
            exercise.procedureNote &&
            !result.solution && (
              <p className="hint-text strategy-note">
                {t(lang, "strategyLabel")}: {localize(lang, exercise.procedureNote, exercise.procedureNoteEn)}
              </p>
            )}
          {/* Desarrollo paso a paso (specs/015): tras un error, abierto y con el
              paso donde se desvió marcado; tras un acierto, desplegable. En
              "encuentra el paso equivocado" se marca el paso del amigo. */}
          {phase === "feedback" && result?.solution && (
            <WorkedSolution
              lang={lang}
              steps={result.solution}
              wrongStep={
                exercise.mode === "find_step" && result.correctLine !== undefined
                  ? { step: result.correctLine, ...exercise.lines[result.correctLine]! }
                  : result.wrongStep
              }
              open={!result.isCorrect || exercise.mode === "find_step"}
              whose={exercise.mode === "find_step" ? "friend" : "you"}
            />
          )}
          {phase === "feedback" && result?.isCorrect && streak >= 2 && (
            <span className="streak-badge">
              🔥 {streak} {t(lang, "comboStreakLabel")}
            </span>
          )}
          {phase === "feedback" && result?.bonusStarAwarded && (
            <span className="bonus-star-badge">🌟 {t(lang, "bonusStarLabel")}</span>
          )}
        </div>
      )}

      {phase === "feedback" && (
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playClick();
            void handleContinueAfterFeedback();
          }}
        >
          {t(lang, "continueBtn")}
        </button>
      )}
    </main>
  );
}
