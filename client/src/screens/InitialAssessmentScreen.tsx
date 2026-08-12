import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ExercisePublic, InitialAssessmentResult } from "../api/types.js";
import type { InitialAssessmentAttemptInput } from "../api/endpoints.js";
import { ExerciseVisual } from "../components/ExerciseVisual.js";
import { CompanionAvatar } from "../components/CompanionAvatar.js";
import { companionByKey, type Companion } from "../lib/companions.js";
import { cancelSpeech, speak, speechSupported } from "../lib/speech.js";
import { playReady, playSelect } from "../lib/sound.js";
import { localize, t, useLang } from "../lib/i18n.js";

interface Props {
  childId: string;
  onDone: (result: InitialAssessmentResult) => void;
}

type Stage = "intro" | "question" | "outro";

export function InitialAssessmentScreen({ childId, onDone }: Props) {
  const { lang } = useLang();
  const [exercises, setExercises] = useState<ExercisePublic[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<InitialAssessmentAttemptInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>("intro");
  const [companion, setCompanion] = useState<Companion>(companionByKey(null));
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
      .then((summary) => setCompanion(companionByKey(summary.companion)))
      .catch(() => {
        // El compañero es decorativo acá — si falla, se usa el default.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  useEffect(() => {
    questionShownAt.current = Date.now();
  }, [index]);

  useEffect(() => {
    // Narración del enunciado — para niños que aún no leen con soltura.
    const current = exercises?.[index];
    if (stage === "question" && current) speak(localize(lang, current.prompt, current.promptEn), lang);
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

  if (stage === "intro") {
    return (
      <main className="screen">
        <CompanionAvatar companion={companion} />
        <h1>{t(lang, "assessmentIntroTitle")}</h1>
        <p>{t(lang, "assessmentIntroBody")}</p>
        <button className="btn-primary" type="button" onClick={() => setStage("question")}>
          {t(lang, "assessmentIntroStart")}
        </button>
      </main>
    );
  }

  if (stage === "outro") {
    return (
      <main className="screen">
        <CompanionAvatar companion={companion} mood="happy" />
        <h1>{t(lang, "assessmentOutroTitle")}</h1>
        <p>{t(lang, "assessmentOutroBody")}</p>
        <button
          className="btn-primary"
          type="button"
          onClick={() => pendingResult && onDone(pendingResult)}
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

  return (
    <main className="screen">
      <CompanionAvatar companion={companion} />

      <div className="progress-dots" aria-hidden="true">
        {exercises.map((ex, i) => (
          <span key={ex.id} className={i < index ? "done" : ""} />
        ))}
      </div>

      <div className="focus-frame" key={current.id}>
        <span className="fc-bl" aria-hidden="true" />
        <span className="fc-br" aria-hidden="true" />

        {current.visual && <ExerciseVisual visual={current.visual} />}

        <h1>{localize(lang, current.prompt, current.promptEn)}</h1>

        {speechSupported && (
          <button
            className="btn-listen"
            type="button"
            onClick={() => speak(localize(lang, current.prompt, current.promptEn), lang)}
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
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
