import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ExercisePublic, InitialAssessmentResult } from "../api/types.js";
import type { InitialAssessmentAttemptInput } from "../api/endpoints.js";

interface Props {
  childId: string;
  onDone: (result: InitialAssessmentResult) => void;
}

export function InitialAssessmentScreen({ childId, onDone }: Props) {
  const [exercises, setExercises] = useState<ExercisePublic[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<InitialAssessmentAttemptInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questionShownAt = useRef<number>(Date.now());

  useEffect(() => {
    endpoints
      .getInitialAssessment(childId)
      .then((res) => setExercises(res.exercises))
      .catch(() => setError("No se pudo cargar la evaluación. Intenta de nuevo en un momento."));
  }, [childId]);

  useEffect(() => {
    questionShownAt.current = Date.now();
  }, [index]);

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
        <p>Cargando…</p>
      </main>
    );
  }

  const current = exercises[index];

  async function handleAnswer(optionId: string) {
    if (!current || !exercises) return;
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
      onDone(result);
    } catch {
      setError("No se pudo guardar la evaluación. Intenta de nuevo en un momento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!current) {
    return (
      <main className="screen" aria-busy="true">
        <p>Un momento…</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <p className="hint-text">
        Pregunta {index + 1} de {exercises.length}
      </p>
      <h1>{current.prompt}</h1>

      <div className="form">
        {current.options.map((opt) => (
          <button
            key={opt.id}
            className="btn-secondary"
            type="button"
            disabled={submitting}
            onClick={() => void handleAnswer(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </main>
  );
}
