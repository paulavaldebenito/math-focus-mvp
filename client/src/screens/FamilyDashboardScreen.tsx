import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ProgressResponse } from "../api/types.js";
import { t, useLang, type Lang } from "../lib/i18n.js";
import { playBack } from "../lib/sound.js";
import { SkillsToReviewPanel, WellbeingPanel } from "../components/FamilyInsights.js";

const ERROR_LABELS: Record<Lang, Record<string, string>> = {
  es: {
    E1_OP: "Confusión de operación",
    E2_RES: "Reagrupación/procedimiento",
    E2_CAL: "Cálculo puntual",
    E3_PREG: "Comprensión del enunciado",
    E3_DATO: "Uso de un dato del enunciado",
    respuesta_rapida: "Respuestas muy rápidas",
    abandono: "Actividades sin terminar",
    solicitud_ayuda_repetida: "Pistas usadas seguido",
  },
  en: {
    E1_OP: "Operation confusion",
    E2_RES: "Regrouping/procedure",
    E2_CAL: "One-off calculation slip",
    E3_PREG: "Understanding the question",
    E3_DATO: "Using a detail from the question",
    respuesta_rapida: "Very fast responses",
    abandono: "Unfinished activities",
    solicitud_ayuda_repetida: "Hints used often",
  },
};

/**
 * Sugerencias concretas para trabajar en casa, sin pantalla — una por cada
 * código de `errorBreakdown` (mismo catálogo cerrado de ErrorType.code del
 * servidor, que va de 1° a 6° básico). Elegidas para ser accionables y sin
 * culpar al niño; misma fuente de verdad que ERROR_LABELS, ambas locales a
 * esta pantalla porque son lenguaje para la familia, no para el niño (ver
 * ERROR_FEEDBACK en lib/i18n.ts, la versión que el niño ve durante la
 * práctica — con el mismo cuidado de no nombrar una operación puntual en
 * E1_OP/E2_RES, ver el comentario ahí).
 */
const HOME_TIPS: Record<Lang, Record<string, string>> = {
  es: {
    E1_OP: "Antes de que calcule, pregúntale qué operación usaría y por qué — practicar esa decisión (sin resolver todavía) ayuda más que corregir el resultado final.",
    E2_RES: "Pídele que explique en voz alta cada paso que sigue para resolver el problema — así es más fácil notar juntos en qué paso se perdió.",
    E2_CAL: "El razonamiento ya le sale bien — unos minutos de cálculo mental simple al día ayudan a que los números salgan con más soltura.",
    E3_PREG: "Antes de resolver, pídele que cuente el problema con sus propias palabras y diga qué le están preguntando, sin usar números todavía.",
    E3_DATO: "Practiquen marcando en voz alta los números importantes de un problema antes de resolverlo, para no perder ni cambiar un dato por error.",
    respuesta_rapida: "Anímalo a decir en voz alta qué va a hacer antes de responder — parar un segundo mejora la precisión sin frenar las ganas de participar.",
    abandono: "Prueben sesiones más cortas o en otro momento del día — puede ser una señal de cansancio, no de que el contenido sea difícil.",
    solicitud_ayuda_repetida: "Está bien que pida ayuda seguido — para ganar confianza, dale un poco más de tiempo para intentarlo solo antes de darle la pista, y celebra el intento aunque se equivoque.",
  },
  en: {
    E1_OP: "Before they calculate, ask what operation they'd use and why — practicing that decision (without solving yet) helps more than correcting the final result.",
    E2_RES: "Ask them to explain out loud each step they follow to solve the problem — that makes it easier to spot together where a step got missed.",
    E2_CAL: "The reasoning is already solid — a few minutes of simple mental math a day helps the numbers come out more smoothly.",
    E3_PREG: "Before solving, ask them to retell the problem in their own words and say what it's asking, without using numbers yet.",
    E3_DATO: "Practice pointing out loud to the important numbers in a problem before solving it, so none gets lost or swapped by mistake.",
    respuesta_rapida: "Encourage saying out loud what they're about to do before answering — pausing a second improves accuracy without slowing down their enthusiasm.",
    abandono: "Try shorter sessions or a different time of day — it can be a sign of tiredness, not that the content is too hard.",
    solicitud_ayuda_repetida: "It's fine that they ask for help often — to build confidence, give them a little more time to try alone before the hint, and celebrate the attempt even if it's wrong.",
  },
};

// Cuántas sugerencias mostrar como máximo — para no abrumar a la familia con
// una lista larga; se priorizan las áreas con más ocurrencias (decisión de
// producto, mismo criterio que MAX_INTERESTS en ChooseInterestScreen).
const MAX_HOME_TIPS = 2;

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
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playBack();
            onBack();
          }}
        >
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

      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-label">{t(lang, "progressSessions")}</span>
          <span className="dash-stat-value">{progress.totalSessions}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{t(lang, "progressLastSession")}</span>
          <span className="dash-stat-value dash-stat-value-sm">{formatDate(progress.lastSessionAt)}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{t(lang, "progressAccuracy")}</span>
          <span className="dash-stat-value">
            {progress.accuracy === null ? t(lang, "progressNoData") : `${Math.round(progress.accuracy * 100)}%`}
          </span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{t(lang, "progressLevel")}</span>
          <span className="dash-stat-value">{progress.currentLevel}</span>
        </div>
      </div>

      {progress.skillsToReview && <SkillsToReviewPanel skills={progress.skillsToReview} lang={lang} />}

      {progress.wellbeing && <WellbeingPanel wellbeing={progress.wellbeing} lang={lang} />}

      {errorEntries.length > 0 && (
        <div className="dash-errors">
          <p className="dash-errors-title">{t(lang, "progressWhereToPractice")}</p>
          <ul className="dash-error-list">
            {errorEntries.map(([code, count]) => (
              <li key={code} className="dash-error-row">
                <span>{ERROR_LABELS[lang][code] ?? code}</span>
                <span className="dash-error-count">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {errorEntries.length > 0 && (
        <div className="dash-tips">
          <p className="dash-errors-title">{t(lang, "progressHomeTipsTitle")}</p>
          <ul className="dash-tip-list">
            {errorEntries.slice(0, MAX_HOME_TIPS).map(([code]) => {
              const tip = HOME_TIPS[lang][code];
              if (!tip) return null;
              return (
                <li key={code} className="dash-tip-card">
                  <span className="dash-tip-area">{ERROR_LABELS[lang][code] ?? code}</span>
                  <span>{tip}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          playBack();
          onBack();
        }}
      >
        {t(lang, "progressBack")}
      </button>
    </main>
  );
}
