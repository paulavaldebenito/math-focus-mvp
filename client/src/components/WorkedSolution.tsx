import type { WorkedStep, WrongStep } from "../api/types.js";
import { localize, t, type Lang } from "../lib/i18n.js";

interface Props {
  lang: Lang;
  steps: WorkedStep[];
  /** Si el niño se equivocó: el paso donde se desvió, que se marca en ese lugar. */
  wrongStep?: WrongStep | null;
  /** Abierto de entrada (tras un error); cerrado y desplegable tras un acierto. */
  open?: boolean;
  /** De quién es el paso equivocado: del niño o del amigo de la ronda "encuentra el paso". */
  whose?: "you" | "friend";
}

/**
 * Desarrollo paso a paso (specs/015). Tras un error, marca el paso donde la
 * respuesta del niño se desvió (❌ lo que hizo / ✅ cómo era) dentro del
 * desarrollo correcto, para que vea exactamente dónde se equivocó.
 */
export function WorkedSolution({ lang, steps, wrongStep, open = true, whose = "you" }: Props) {
  const list = (
    <ol className="worked-steps">
      {steps.map((s, i) => (
        <li key={i} className={wrongStep && wrongStep.step === i ? "worked-step worked-step-wrong" : "worked-step"}>
          {wrongStep && wrongStep.step === i ? (
            <>
              <p className="worked-yours">
                <span aria-hidden="true">❌</span> <b>{t(lang, whose === "friend" ? "workedFriendStep" : "workedYourStep")}:</b> {localize(lang, wrongStep.es, wrongStep.en)}
              </p>
              <p className="worked-right">
                <span aria-hidden="true">✅</span> <b>{t(lang, "workedShouldBe")}:</b> {localize(lang, s.es, s.en)}
              </p>
            </>
          ) : (
            localize(lang, s.es, s.en)
          )}
        </li>
      ))}
    </ol>
  );
  if (!open) {
    return (
      <details className="worked">
        <summary>{t(lang, "workedSeeAll")}</summary>
        {list}
      </details>
    );
  }
  return (
    <section className="worked" aria-label={t(lang, "workedTitle")}>
      <p className="worked-title">{t(lang, "workedTitle")}</p>
      {list}
    </section>
  );
}
