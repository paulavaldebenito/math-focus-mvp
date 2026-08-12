import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ProgressResponse } from "../api/types.js";
import { t, useLang, type Lang } from "../lib/i18n.js";

const ERROR_LABELS: Record<Lang, Record<string, string>> = {
  es: {
    conceptual: "Comprensión de la idea matemática",
    procedimiento: "Procedimiento para resolver",
    calculo: "Cálculo puntual",
    comprension_enunciado: "Comprensión del enunciado",
    omision: "Uso de un dato del enunciado",
    respuesta_rapida: "Respuestas muy rápidas",
    abandono: "Actividades sin terminar",
    solicitud_ayuda_repetida: "Pistas usadas seguido",
  },
  en: {
    conceptual: "Understanding of the math idea",
    procedimiento: "Procedure to solve it",
    calculo: "One-off calculation slip",
    comprension_enunciado: "Understanding the question",
    omision: "Using a detail from the question",
    respuesta_rapida: "Very fast responses",
    abandono: "Unfinished activities",
    solicitud_ayuda_repetida: "Hints used often",
  },
};

interface Props {
  childId: string;
  onBack: () => void;
}

export function FamilyDashboardScreen({ childId, onBack }: Props) {
  const { lang } = useLang();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    endpoints
      .getProgress(childId)
      .then(setProgress)
      .catch(() => setError(t(lang, "progressErr")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  function formatDate(iso: string | null): string {
    if (!iso) return t(lang, "progressNotYetPracticed");
    return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (error) {
    return (
      <main className="screen">
        <p className="error-text" role="alert">
          {error}
        </p>
        <button className="btn-secondary" type="button" onClick={onBack}>
          {t(lang, "progressBack")}
        </button>
      </main>
    );
  }

  if (!progress) {
    return (
      <main className="screen" aria-busy="true">
        <p>{t(lang, "loading")}</p>
      </main>
    );
  }

  const errorEntries = Object.entries(progress.errorBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <main className="screen">
      <h1>
        {t(lang, "progressTitle")} {progress.child.displayName}
      </h1>
      <p className="hint-text">{t(lang, "progressNote")}</p>

      <div className="form" style={{ textAlign: "left" }}>
        <p>
          <strong>{t(lang, "progressSessions")}</strong> {progress.totalSessions}
        </p>
        <p>
          <strong>{t(lang, "progressLastSession")}</strong> {formatDate(progress.lastSessionAt)}
        </p>
        <p>
          <strong>{t(lang, "progressAccuracy")}</strong>{" "}
          {progress.accuracy === null ? t(lang, "progressNoData") : `${Math.round(progress.accuracy * 100)}%`}
        </p>
        <p>
          <strong>{t(lang, "progressLevel")}</strong> {progress.currentLevel}
        </p>

        {errorEntries.length > 0 && (
          <div>
            <p>
              <strong>{t(lang, "progressWhereToPractice")}</strong>
            </p>
            <ul>
              {errorEntries.map(([code, count]) => (
                <li key={code}>
                  {ERROR_LABELS[lang][code] ?? code}: {count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button className="btn-secondary" type="button" onClick={onBack}>
        {t(lang, "progressBack")}
      </button>
    </main>
  );
}
