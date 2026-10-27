import type { ReviewNode } from "../api/types.js";
import { localize, type Lang } from "../lib/i18n.js";
import { playClick } from "../lib/sound.js";

/// Aciertos de práctica para superar una base del repaso (SKILL_COMPLETE_THRESHOLD del servidor).
const TO_COMPLETE = 5;

/**
 * Ubicación y repaso en el espacio familia (specs/020-ubicacion-adaptativa). A diferencia del niño,
 * la familia sí ve de qué curso es cada base: así entiende por qué su hijo o hija practica algo de
 * un curso anterior. En todos los planes: es el núcleo de que practique a su nivel.
 */
const COPY = {
  es: {
    title: "🧭 Ubicación y repaso",
    never: "Todavía no hace la evaluación de ubicación. Son unas preguntas cortas (unos 10 minutos) que bajan a cursos anteriores si hace falta, para saber por dónde empezar.",
    start: "Hacer la evaluación ahora",
    repeat: "Repetir la evaluación",
    placedOn: (d: string) => `Última evaluación: ${d}.`,
    none: "No encontramos bases pendientes de cursos anteriores en Números y operaciones: practica directamente los temas de su curso. (Geometría, medición, patrones y datos aún no se evalúan así).",
    intro: "Le ayudará reforzar estas bases de cursos anteriores. La app se las propone primero, en orden y a su ritmo; los temas de su curso siguen abiertos. En su mapa aparecen como «Tu repaso», sin indicar el curso.",
    base: (g: number) => `base de ${g}° básico`,
    done: "✅ superada",
    progress: (n: number) => `${n} de ${TO_COMPLETE} aciertos para superarla`,
    allDone: "¡Completó todo su repaso! Ya practica los temas de su curso.",
    note: "Si practicando muestra que le falta otra base de Números y operaciones, se agrega sola al repaso.",
    who: "La responde tu hijo o hija: al empezar se cierra este espacio. Reemplaza la evaluación anterior.",
  },
  en: {
    title: "🧭 Placement and review",
    never: "They haven't done the placement check yet. It's a few short questions (about 10 minutes) that go down to earlier grades if needed, to know where to start.",
    start: "Do the check now",
    repeat: "Repeat the check",
    placedOn: (d: string) => `Last check: ${d}.`,
    none: "We found no pending basics from earlier grades in Numbers and operations: they practice their own grade's topics directly. (Geometry, measurement, patterns and data aren't checked this way yet.)",
    intro: "It will help to strengthen these basics from earlier grades. The app suggests them first, in order and at their own pace; their grade's topics stay open. On their map they show as «Your review», without the grade.",
    base: (g: number) => `from grade ${g}`,
    done: "✅ done",
    progress: (n: number) => `${n} of ${TO_COMPLETE} correct to complete it`,
    allDone: "They finished their whole review! Now they practice their own grade's topics.",
    note: "If practice shows another Numbers and operations basic is missing, it is added to the review automatically.",
    who: "Your child does it: this area closes when it starts. It replaces the previous check.",
  },
};

interface Props {
  placement: { placedAt: string | null; review: ReviewNode[] };
  lang: Lang;
  onStartPlacement?: () => void;
}

export function PlacementPanel({ placement, lang, onStartPlacement }: Props) {
  const c = COPY[lang];
  const date = placement.placedAt
    ? new Date(placement.placedAt).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", { day: "numeric", month: "long" })
    : null;
  const pending = placement.review.filter((r) => r.status !== "completed");
  const button = onStartPlacement && (
    <button
      className="btn-secondary"
      type="button"
      onClick={() => {
        playClick();
        onStartPlacement();
      }}
    >
      {placement.placedAt ? c.repeat : c.start}
    </button>
  );

  return (
    <section className="week-card placement-card" aria-labelledby="placement-title">
      <h2 id="placement-title">{c.title}</h2>
      {!placement.placedAt && placement.review.length === 0 ? (
        <p>{c.never}</p>
      ) : (
        <>
          {date && <p className="hint-text">{c.placedOn(date)}</p>}
          {placement.review.length === 0 && <p>{c.none}</p>}
          {placement.review.length > 0 && (
            <>
              <p>{pending.length === 0 ? c.allDone : c.intro}</p>
              <ol className="placement-list">
                {placement.review.map((r) => (
                  <li key={r.id}>
                    <b>{localize(lang, r.name, r.nameEn)}</b> · {c.base(r.grade)} ·{" "}
                    {r.status === "completed" ? c.done : c.progress(Math.min(r.correctCount, TO_COMPLETE))}
                  </li>
                ))}
              </ol>
            </>
          )}
          <p className="hint-text">{c.note}</p>
        </>
      )}
      {button}
      {button && <p className="hint-text">{c.who}</p>}
    </section>
  );
}
