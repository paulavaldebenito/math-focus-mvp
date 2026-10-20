import type { SkillToReview, WellbeingCross } from "../api/types.js";
import { localize, type Lang } from "../lib/i18n.js";
import { MATH_FACES, MOOD_FACES } from "../lib/moodFaces.js";

/// Días que necesita CADA grupo antes de comparar (mismo criterio que
/// MIN_DAYS_TO_COMPARE en el servidor): con menos, la diferencia es ruido.
const MIN_DAYS_TO_COMPARE = 2;
/// Días recientes que se listan en el panel.
const DAYS_LISTED = 7;
/// Si el promedio reciente de "cómo se siente con las matemáticas" queda en
/// este valor o menos (1 = muy nervioso/a … 5 = muy tranquilo/a), se sugiere
/// cómo acompañar esa sensación.
const MATH_NERVOUS_THRESHOLD = 2.5;

const pct = (x: number) => `${Math.round(x * 100)} %`;

/**
 * Textos para la FAMILIA (no para el niño), locales a este panel igual que
 * HOME_TIPS en FamilyDashboardScreen. Siempre descriptivos: muestran una
 * coincidencia observada, nunca una causa ni un diagnóstico.
 */
const COPY = {
  es: {
    wellbeingTitle: "Cómo se ha sentido y cómo le ha ido",
    wellbeingEmpty:
      "Todavía no hay registros. En la primera práctica de cada día le preguntamos, con caritas y de forma opcional, cómo se siente y cómo se siente con las matemáticas.",
    fewDays: "Aún hay pocos días para comparar. Con más prácticas verás aquí si su ánimo y sus aciertos van de la mano.",
    mathCompare: (a: string, b: string) =>
      `Los días en que dijo sentirse nervioso/a con las matemáticas acertó un ${a}; los días en que se sintió tranquilo/a, un ${b}.`,
    moodCompare: (a: string, b: string) =>
      `Los días en que se sintió triste acertó un ${a}; los días en que se sintió bien, un ${b}.`,
    caveat:
      "Es una coincidencia observada, no una conclusión: úsala como punto de partida para conversar con tu hijo/a sobre cómo se siente.",
    nervousTitle: "Si se siente nervioso/a con las matemáticas",
    nervousTip:
      "Hablen de que equivocarse es parte de aprender y celebren el esfuerzo más que el resultado. Eviten frases como «yo también era malo/a para las matemáticas», prefieran sesiones cortas y tranquilas, y empiecen por algo que ya le sale bien para ganar confianza.",
    daysTitle: "Últimos días",
    colDay: "Día",
    colMood: "Ánimo",
    colMath: "Matemáticas",
    colAccuracy: "Aciertos",
    noExercises: "sin ejercicios",
    noAnswer: "—",
    reviewTitle: "Qué repasar y cómo hacerlo en casa",
    reviewNone: "Por ahora no hay contenidos con dificultad marcada. ¡Sigan así!",
    reviewStat: (p: string, n: number) => `Acertó un ${p} en ${n} preguntas`,
  },
  en: {
    wellbeingTitle: "How they've been feeling and doing",
    wellbeingEmpty:
      "No entries yet. In the first practice of each day we ask, with faces and always optionally, how they feel and how they feel about math.",
    fewDays: "There aren't enough days to compare yet. With more practice you'll see here whether their mood and their results go hand in hand.",
    mathCompare: (a: string, b: string) =>
      `On days they said they felt nervous about math, they got ${a} right; on days they felt calm, ${b}.`,
    moodCompare: (a: string, b: string) => `On days they felt sad, they got ${a} right; on days they felt good, ${b}.`,
    caveat:
      "This is an observed pattern, not a conclusion: use it as a starting point to talk with your child about how they feel.",
    nervousTitle: "If they feel nervous about math",
    nervousTip:
      "Talk about mistakes being part of learning and praise effort more than results. Avoid phrases like “I was bad at math too”, keep sessions short and calm, and start with something they already do well to build confidence.",
    daysTitle: "Recent days",
    colDay: "Day",
    colMood: "Mood",
    colMath: "Math",
    colAccuracy: "Correct",
    noExercises: "no exercises",
    noAnswer: "—",
    reviewTitle: "What to review and how to do it at home",
    reviewNone: "For now there are no topics flagged as difficult. Keep it up!",
    reviewStat: (p: string, n: number) => `Got ${p} right in ${n} questions`,
  },
} as const;

function formatDay(date: string, lang: Lang): string {
  // date es YYYY-MM-DD en hora de Chile; se arma a mediodía UTC para que el
  // formateo local nunca lo corra de día.
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function face(scale: typeof MOOD_FACES | typeof MATH_FACES, value: number | null, lang: Lang) {
  const f = value === null ? undefined : scale.find((x) => x.value === value);
  if (!f) return <span className="dash-face-none">{COPY[lang].noAnswer}</span>;
  return (
    <span className="dash-face" role="img" aria-label={f[lang]} title={f[lang]}>
      {f.emoji}
    </span>
  );
}

export function WellbeingPanel({ wellbeing, lang }: { wellbeing: WellbeingCross; lang: Lang }) {
  const c = COPY[lang];
  const { comparison: cmp } = wellbeing;
  const canCompare = (a: { days: number; accuracy: number | null }, b: { days: number; accuracy: number | null }) =>
    a.days >= MIN_DAYS_TO_COMPARE && b.days >= MIN_DAYS_TO_COMPARE && a.accuracy !== null && b.accuracy !== null;
  const mathOk = canCompare(cmp.mathNervous, cmp.mathCalm);
  const moodOk = canCompare(cmp.moodLow, cmp.moodHigh);
  const nervous = wellbeing.recentMathFeeling !== null && wellbeing.recentMathFeeling <= MATH_NERVOUS_THRESHOLD;

  return (
    <section className="dash-wellbeing" aria-labelledby="dash-wellbeing-title">
      <p id="dash-wellbeing-title" className="dash-errors-title">
        {c.wellbeingTitle}
      </p>

      {wellbeing.days.length === 0 ? (
        <p className="hint-text">{c.wellbeingEmpty}</p>
      ) : (
        <>
          {mathOk || moodOk ? (
            <div className="dash-insight">
              {mathOk && <p>{c.mathCompare(pct(cmp.mathNervous.accuracy!), pct(cmp.mathCalm.accuracy!))}</p>}
              {moodOk && <p>{c.moodCompare(pct(cmp.moodLow.accuracy!), pct(cmp.moodHigh.accuracy!))}</p>}
              <p className="hint-text">{c.caveat}</p>
            </div>
          ) : (
            <p className="hint-text">{c.fewDays}</p>
          )}

          {nervous && (
            <div className="dash-tip-card">
              <span className="dash-tip-area">{c.nervousTitle}</span>
              <span>{c.nervousTip}</span>
            </div>
          )}

          <table className="dash-days">
            <caption>{c.daysTitle}</caption>
            <thead>
              <tr>
                <th scope="col">{c.colDay}</th>
                <th scope="col">{c.colMood}</th>
                <th scope="col">{c.colMath}</th>
                <th scope="col">{c.colAccuracy}</th>
              </tr>
            </thead>
            <tbody>
              {wellbeing.days.slice(0, DAYS_LISTED).map((d) => (
                <tr key={d.date}>
                  <th scope="row">{formatDay(d.date, lang)}</th>
                  <td>{face(MOOD_FACES, d.mood, lang)}</td>
                  <td>{face(MATH_FACES, d.mathFeeling, lang)}</td>
                  <td>{d.accuracy === null ? c.noExercises : `${pct(d.accuracy)} (${d.correct}/${d.attempts})`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

export function SkillsToReviewPanel({ skills, lang }: { skills: SkillToReview[]; lang: Lang }) {
  const c = COPY[lang];
  return (
    <section className="dash-tips" aria-labelledby="dash-review-title">
      <p id="dash-review-title" className="dash-errors-title">
        {c.reviewTitle}
      </p>
      {skills.length === 0 ? (
        <p className="hint-text">{c.reviewNone}</p>
      ) : (
        <ul className="dash-tip-list">
          {skills.map((s) => (
            <li key={s.skillId} className="dash-tip-card">
              <span className="dash-tip-area">{localize(lang, s.name, s.nameEn)}</span>
              <span className="dash-review-stat">{c.reviewStat(pct(s.accuracy), s.attempts)}</span>
              {s.tip && <span>{s.tip[lang]}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
