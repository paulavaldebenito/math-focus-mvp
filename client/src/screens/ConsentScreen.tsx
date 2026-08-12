import { useState, type FormEvent } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { t, useLang } from "../lib/i18n.js";

// Se guarda tal cual como `scope` del consentimiento — por eso se envía la
// versión en el idioma que el adulto realmente leyó, no siempre el español.
const CONSENT_TEXT = {
  es: "Guardaremos el nombre y curso de tu hijo/a, y un registro de sus respuestas, pistas usadas y pausas — solo para adaptar la práctica y mostrarte su progreso. No se guarda ningún diagnóstico médico. Puedes pedir la eliminación de estos datos cuando quieras.",
  en: "We'll store your child's name and grade, along with a record of their answers, hints used, and pauses — only to adapt their practice and show you their progress. No medical diagnosis is ever stored. You can request deletion of this data at any time.",
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
            onChange={(e) => setChecked(e.target.checked)}
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
