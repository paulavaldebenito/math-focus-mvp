import { useState, type FormEvent } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { t, useLang } from "../lib/i18n.js";
import { playClick, playConfirm, playSelect } from "../lib/sound.js";

// Se guarda tal cual como `scope` del consentimiento — por eso se envía la
// versión en el idioma que el adulto realmente leyó, no siempre el español.
const CONSENT_TEXT = {
  es: "Guardaremos el nombre y curso de tu hijo/a, y un registro de sus respuestas, pistas usadas y pausas — solo para adaptar la práctica y mostrarte su progreso. Una vez al día, al empezar, le preguntaremos con caritas cómo está y cómo se siente con las matemáticas; al terminar cada práctica, qué sintió. Siempre puede saltarse estas preguntas. Lo usamos para sugerirte cómo acompañarlo/a en casa. No guardamos diagnósticos médicos. Puedes pedir que borremos estos datos cuando quieras.",
  en: "We'll store your child's name and grade, along with a record of their answers, hints used, and pauses — only to adapt their practice and show you their progress. Once a day, at the start, we'll ask them with faces how they are and how they feel about math; at the end of each practice, how they felt. They can always skip these questions. We use this to suggest how to support them at home. We don't store medical diagnoses. You can ask us to delete this data at any time.",
};

interface Props {
  onConsented: (consentId: string) => void;
}

export function ConsentScreen({ onConsented }: Props) {
  const { lang } = useLang();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    playConfirm();
    setError(null);
    setSubmitting(true);
    try {
      const consent = await endpoints.createConsent(CONSENT_TEXT[lang]);
      onConsented(consent.id);
    } catch (err) {
      setError(err instanceof ApiError ? t(lang, "consentErr") : t(lang, "consentErrGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <h1>{t(lang, "consentTitle")}</h1>
      <p>{CONSENT_TEXT[lang]}</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field" style={{ flexDirection: "row", alignItems: "flex-start", gap: "0.6rem" }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              if (e.target.checked) playSelect();
              else playClick();
              setChecked(e.target.checked);
            }}
            style={{ marginTop: "0.2rem" }}
          />
          <span>{t(lang, "consentCheckboxLabel")}</span>
        </label>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <button className="btn-primary" type="submit" disabled={!checked || submitting}>
          {submitting ? t(lang, "authSubmitting") : t(lang, "continueBtn")}
        </button>
      </form>
    </main>
  );
}
