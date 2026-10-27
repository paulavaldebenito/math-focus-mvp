import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ReviewNode, SkillNode } from "../api/types.js";
import { localize, t, useLang } from "../lib/i18n.js";
import { playBack, playClick, playSelect } from "../lib/sound.js";
import { shortSkillName } from "../lib/skillShortNames.js";

interface Props {
  childId: string;
  /** Ambos nombres (no el ya localizado): la práctica sigue el idioma aunque se cambie después. */
  onSelect: (skill: { id: string; name: string; nameEn: string | null }) => void;
  onBack: () => void;
}

// Un ícono por eje, solo decorativo — las MathSkill no traen uno propio.
const AXIS_ICONS: Record<string, string> = {
  "Números y operaciones": "🔢",
  "Patrones y álgebra": "🔁",
  "Geometría": "📐",
  "Medición": "📏",
  "Datos y probabilidades": "📊",
};

export function SkillPathScreen({ childId, onSelect, onBack }: Props) {
  const { lang } = useLang();
  const [skills, setSkills] = useState<SkillNode[] | null>(null);
  // Repaso de cursos anteriores (specs/020): va primero. El niño ve solo el nombre, nunca el curso.
  const [review, setReview] = useState<ReviewNode[]>([]);
  const [error, setError] = useState(false);
  const started = useRef(false);

  function load() {
    setError(false);
    endpoints
      .getSkillPath(childId)
      .then((res) => {
        setSkills(res.skills);
        setReview(res.review ?? []);
      })
      .catch(() => setError(true));
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  if (error) {
    return (
      <main className="screen">
        <p className="error-text" role="alert">
          {t(lang, "mapLoadErr")}
        </p>
        <button
          className="btn-primary"
          type="button"
          onClick={() => {
            playClick();
            load();
          }}
        >
          {t(lang, "retryButton")}
        </button>
      </main>
    );
  }

  if (!skills) {
    return (
      <main className="screen" aria-busy="true">
        <p>{t(lang, "loading")}</p>
      </main>
    );
  }

  // El primer nodo "available" (todavía no completado) es "el que sigue" —
  // el único con la insignia pulsante de "¡Empezar!". Los ya completados se
  // pueden volver a jugar, pero no llevan esa insignia (ya no son "lo nuevo").
  // Mientras quede repaso por hacer, «el que sigue» es el primer nodo abierto del repaso.
  const reviewPending = review.some((r) => r.status !== "completed");
  const currentId = reviewPending
    ? review.find((r) => r.status === "available")?.id
    : skills.find((s) => s.status === "available" && !s.afterReview)?.id ?? skills.find((s) => s.status === "available")?.id;

  const node = (skill: { id: string; name: string; nameEn: string | null; status: SkillNode["status"] }, icon: string, side: "left" | "right", note?: string) => {
    const clickable = skill.status !== "locked";
    const displayName = shortSkillName(lang, skill.name, skill.nameEn);
    return (
      <div className={`skill-node-row skill-node-${side}`}>
        <button
          type="button"
          className={`skill-node skill-node-${skill.status}`}
          disabled={!clickable}
          aria-label={`${displayName} — ${t(lang, skill.status === "locked" ? "mapLockedNode" : skill.status === "completed" ? "mapCompletedNode" : "mapStartNode")}`}
          onClick={() => {
            if (!clickable) return;
            playSelect();
            onSelect({ id: skill.id, name: skill.name, nameEn: skill.nameEn });
          }}
        >
          <span className="skill-node-icon" aria-hidden="true">
            {skill.status === "locked" ? "🔒" : icon}
          </span>
          {skill.status === "completed" && (
            <span className="skill-node-crown" aria-hidden="true">
              ⭐
            </span>
          )}
        </button>
        <div className="skill-node-label">
          <p>{displayName}</p>
          {skill.id === currentId && <span className="skill-node-cta">{t(lang, "mapStartNode")}</span>}
          {note && skill.id !== currentId && <span className="skill-node-after-review">{note}</span>}
        </div>
      </div>
    );
  };

  let lastAxis: string | null = null;

  return (
    <main className="screen screen-wide">
      <button
        className="btn-secondary map-back"
        type="button"
        onClick={() => {
          playBack();
          onBack();
        }}
      >
        ← {t(lang, "mapBack")}
      </button>
      <h1>{t(lang, "mapTitle")}</h1>

      {reviewPending && (
        <section className="skill-review" aria-labelledby="skill-review-title">
          <h2 id="skill-review-title" className="skill-axis-header">
            {t(lang, "mapReviewTitle")}
          </h2>
          <p className="skill-review-hint">{t(lang, "mapReviewHint")}</p>
          <div className="skill-path">
            {review.map((r, i) => (
              <div key={r.id} className="skill-path-item">
                {node(r, "🔁", i % 2 === 0 ? "left" : "right")}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="skill-path">
        {skills.map((skill, i) => {
          const showAxisHeader = skill.axis !== lastAxis;
          lastAxis = skill.axis;
          // AXIS_ICONS y el agrupamiento de encabezados usan siempre el eje en
          // español (clave canónica, estable) — solo el TEXTO mostrado se
          // localiza, para no depender de tener el ícono repetido por idioma.
          const displayAxis = localize(lang, skill.axis, skill.axisEn);
          return (
            <div key={skill.id} className="skill-path-item">
              {showAxisHeader && (
                <h2 className="skill-axis-header">
                  {AXIS_ICONS[skill.axis] ?? "✨"} {displayAxis}
                </h2>
              )}
              {node(
                skill,
                AXIS_ICONS[skill.axis] ?? "✨",
                i % 2 === 0 ? "left" : "right",
                skill.afterReview && skill.status === "available" ? t(lang, "mapAfterReview") : undefined,
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
