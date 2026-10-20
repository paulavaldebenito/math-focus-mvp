import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ExercisePublic, InitialAssessmentResult } from "../api/types.js";
import type { InitialAssessmentAttemptInput } from "../api/endpoints.js";
import { ExerciseIllustration } from "../components/ExerciseIllustration.js";
import { BrickCompanionAvatar } from "../components/BrickCompanionAvatar.js";
import { BreathingPause } from "../components/BreathingPause.js";
import { companionByKey, type Companion } from "../lib/companions.js";
import { interestByKey } from "../lib/interests.js";
import { cancelSpeech, speak, speechSupported } from "../lib/speech.js";
import { playClick, playConfirm, playReady, playSelect } from "../lib/sound.js";
import { localize, t, useLang } from "../lib/i18n.js";

interface Props {
  childId: string;
  onDone: (result: InitialAssessmentResult) => void;
}

// "breathing-offer"/"breathing" van primero: un momento de calma antes de
// arrancar el control, siempre saltable (reutiliza los mismos textos y el
// mismo componente de respiración que la pausa previa a la práctica — misma
// idea, distinto momento). No hay sesión creada todavía en este punto, así
// que a diferencia de las pausas de la práctica, esta no se registra como
// PauseEvent ni otorga estrella: es puramente un momento de calma.
type Stage = "breathing-offer" | "breathing" | "intro" | "question" | "outro";

export function InitialAssessmentScreen({ childId, onDone }: Props) {
  const { lang } = useLang();
  const [exercises, setExercises] = useState<ExercisePublic[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<InitialAssessmentAttemptInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>("breathing-offer");
  const [companion, setCompanion] = useState<Companion>(companionByKey(null));
  // Interés ya elegido en ChooseInterestScreen (paso previo al control para
  // un niño nuevo) — solo para temar el dibujo del ejercicio, igual que en
  // PracticeScreen; nunca cambia qué ejercicio llega.
  const [childInterests, setChildInterests] = useState<string[]>([]);
  const [pendingResult, setPendingResult] = useState<InitialAssessmentResult | null>(null);
  const questionShownAt = useRef<number>(Date.now());
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    endpoints
      .getInitialAssessment(childId)
      .then((res) => setExercises(res.exercises))
      .catch(() => setError(t(lang, "assessmentLoadErr")));

    endpoints
      .getHomeSummary(childId)
      .then((summary) => {
        setCompanion(companionByKey(summary.companion));
        setChildInterests(summary.interests ?? []);
      })
      .catch(() => {
        // El compañero y el interés son decorativos acá — si falla, se usa
        // el default (mascota genérica, dibujo sin temar).
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    questionShownAt.current = Date.now();
  }, [index]);

  useEffect(() => {
    // La narración ya no se dispara sola al mostrar la pregunta (voz
    // robótica no pedida). Se mantiene solo la limpieza: si el niño pidió
    // "Escuchar de nuevo" y cambia de ejercicio o sale de la pantalla, se
    // corta esa lectura en vez de dejarla sonando encima de la siguiente.
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, index, stage]);

  if (error) {
    return (
      <main className="screen">
        <p className="error-text" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!exercises) {
    return (
      <main className="screen" aria-busy="true">
        <p>{t(lang, "loading")}</p>
      </main>
    );
  }

  if (stage === "breathing-offer") {
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
            playConfirm();
            setStage("breathing");
          }}
        >
          {t(lang, "pauseAccept")}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playClick();
            setStage("intro");
          }}
        >
          {t(lang, "prePauseSkip")}
        </button>
      </main>
    );
  }

  if (stage === "breathing") {
    return (
      <main className="screen">
        <BreathingPause lang={lang} companion={companion} onDone={() => setStage("intro")} />
      </main>
    );
  }

  if (stage === "intro") {
    return (
      <main className="screen">
        <BrickCompanionAvatar companion={companion} />
        <h1>{t(lang, "assessmentIntroTitle")}</h1>
        <p>{t(lang, "assessmentIntroBody")}</p>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playConfirm();
            setStage("question");
          }}
        >
          {t(lang, "assessmentIntroStart")}
        </button>
      </main>
    );
  }

  if (stage === "outro") {
    return (
      <main className="screen">
        <BrickCompanionAvatar companion={companion} mood="happy" />
        <h1>{t(lang, "assessmentOutroTitle")}</h1>
        <p>{t(lang, "assessmentOutroBody")}</p>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playConfirm();
            if (pendingResult) onDone(pendingResult);
          }}
        >
          {t(lang, "assessmentOutroContinue")}
        </button>
      </main>
    );
  }

  const current = exercises[index];

  async function handleAnswer(optionId: string) {
    if (!current || !exercises) return;
    playSelect();
    const responseTimeMs = Date.now() - questionShownAt.current;
    const nextAnswers = [
      ...answers,
      { exerciseId: current.id, selectedOptionId: optionId, responseTimeMs },
    ];
    setAnswers(nextAnswers);

    if (index + 1 < exercises.length) {
      setIndex(index + 1);
      return;
    }

    setSubmitting(true);
    try {
      const result = await endpoints.submitInitialAssessment(childId, nextAnswers);
      playReady();
      setPendingResult(result);
      setStage("outro");
    } catch {
      setError(t(lang, "assessmentSubmitErr"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!current) {
    return (
      <main className="screen" aria-busy="true">
        <p>{t(lang, "authSubmitting")}</p>
      </main>
    );
  }

  // Mismo patrón que PracticeScreen: el interés solo temiza el dibujo del
  // ejercicio (acento de color, emoji si el contenido es neutro) — nunca
  // cambia qué ejercicio llega, eso lo decide el servidor.
  const interest = interestByKey(childInterests[0]);
  const accentStyle = interest
    ? ({ "--interest-color": interest.color, "--interest-accent": interest.color } as React.CSSProperties)
    : undefined;

  return (
    <main className="screen">
      <BrickCompanionAvatar companion={companion} />

      <div className="progress-dots" aria-hidden="true">
        {exercises.map((ex, i) => (
          <span key={ex.id} className={i < index ? "done" : ""} />
        ))}
      </div>

      <div className="focus-frame" key={current.id} style={accentStyle}>
        <span className="fc-bl" aria-hidden="true" />
        <span className="fc-br" aria-hidden="true" />

        <ExerciseIllustration image={current.image} visual={current.visual} interest={interest} options={current.options} />

        <h1>{localize(lang, current.prompt, current.promptEn)}</h1>

        {speechSupported && (
          <button
            className="btn-listen"
            type="button"
            onClick={() => {
              playClick();
              speak(localize(lang, current.prompt, current.promptEn), lang);
            }}
          >
            {t(lang, "listenAgain")}
          </button>
        )}

        <div className="form">
          {current.options.map((opt) => (
            <button
              key={opt.id}
              className="option-btn"
              type="button"
              disabled={submitting}
              onClick={() => void handleAnswer(opt.id)}
            >
              {localize(lang, opt.label, opt.labelEn)}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
