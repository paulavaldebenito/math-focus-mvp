import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { PlanTeaser, SocialPanel, WeekPanel } from "../components/FamilyWeek.js";
import { PlacementPanel } from "../components/PlacementPanel.js";
import type { ProgressResponse } from "../api/types.js";
import { t, useLang, type Lang } from "../lib/i18n.js";
import { playBack } from "../lib/sound.js";
import { ERROR_LABELS } from "../lib/errorLabels.js";
import { FeelingsPanel, HomeGamesPanel, TopicsPanel, WellbeingPanel } from "../components/FamilyInsights.js";
import { ClassroomLink } from "../components/ClassroomLink.js";


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
    E2_CAL: "Suele elegir bien el camino; unos minutos de cálculo mental al día, jugando, ayudan a que los números salgan con más soltura.",
    E3_PREG: "Antes de resolver, pídele que cuente el problema con sus propias palabras y diga qué le están preguntando, sin usar números todavía.",
    E3_DATO: "Antes de resolver, que subraye o diga en voz alta los números importantes del problema, para no perder ni cambiar un dato.",
    respuesta_rapida: "Anima a tu hijo/a a decir en voz alta qué va a hacer antes de responder: parar un segundo mejora la precisión sin quitarle las ganas.",
    abandono: "Prueben practicar en otro momento del día. Dejar actividades sin terminar puede deberse a cansancio, a que el tema le cuesta o a otras cosas: conversa con tu hijo/a para saber qué le pasa.",
    solicitud_ayuda_repetida: "Está bien que pida ayuda seguido — para ganar confianza, dale un poco más de tiempo para intentarlo por su cuenta antes de usar la pista, y celebra el intento aunque se equivoque.",
  },
  en: {
    E1_OP: "Before they calculate, ask what operation they'd use and why — practicing that decision (without solving yet) helps more than correcting the final result.",
    E2_RES: "Ask them to explain out loud each step they follow to solve the problem — that makes it easier to spot together where a step got missed.",
    E2_CAL: "They usually pick the right approach; a few minutes of playful mental math a day helps the numbers come more easily.",
    E3_PREG: "Before solving, ask them to retell the problem in their own words and say what it's asking, without using numbers yet.",
    E3_DATO: "Before solving, have them underline or say out loud the important numbers in the problem, so no detail gets lost or swapped.",
    respuesta_rapida: "Encourage saying out loud what they're about to do before answering — pausing a second improves accuracy without slowing down their enthusiasm.",
    abandono: "Try a different time of day. Leaving activities unfinished can come from tiredness, a hard topic or other reasons: talk with your child to find out.",
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
  /** El espacio familia se bloqueó (pasaron los 30 minutos): hay que volver a pedir el PIN. */
  onLocked?: () => void;
  /** Lleva al niño a la evaluación de ubicación (specs/020). */
  onStartPlacement?: () => void;
}

export function FamilyDashboardScreen({ childId, onBack, onLocked, onStartPlacement }: Props) {
  const { lang } = useLang();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    endpoints
      .getProgress(childId)
      .then(setProgress)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403 && onLocked) onLocked();
        else setError(t(lang, "progressErr"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, reload]);

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
  // Plan gratis: resumen básico de aprendizaje y una invitación al Plan Familia (specs/018).
  const paid = progress.plan !== "gratis";

  return (
    <main className="screen">
      <h1>
        {t(lang, "progressTitle")} {progress.child.displayName}
      </h1>
      <p className="hint-text">{t(lang, "progressNote")}</p>

      {progress.week && <WeekPanel week={progress.week} name={progress.child.displayName} lang={lang} feelingsLocked={!paid} />}

      {progress.placement && <PlacementPanel placement={progress.placement} lang={lang} onStartPlacement={onStartPlacement} />}

      {/* «Con los demás» está en todos los planes: una señal de posible acoso no puede quedar detrás de un pago. */}
      {progress.social && (
        <SocialPanel childId={childId} social={progress.social} lang={lang} onChanged={() => setReload((n) => n + 1)} />
      )}

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

      {paid && progress.feelings && <FeelingsPanel feelings={progress.feelings} lang={lang} />}

      {paid && progress.topics && <HomeGamesPanel childId={childId} topics={progress.topics} lang={lang} />}

      {paid && progress.topics && <TopicsPanel childId={childId} topics={progress.topics} lang={lang} />}

      {paid && progress.wellbeing && <WellbeingPanel wellbeing={progress.wellbeing} lang={lang} />}

      <ClassroomLink childId={childId} lang={lang} />

      {!paid && <PlanTeaser lang={lang} />}

      {paid && errorEntries.length > 0 && (
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

      {paid && errorEntries.length > 0 && (
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
