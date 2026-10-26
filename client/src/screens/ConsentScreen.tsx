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

/// Consentimiento aparte y opcional para la pregunta social semanal (specs/018).
const SOCIAL_CONSENT = {
  es: "Opcional: autorizo que una vez por semana, al terminar una práctica, le preguntemos con caritas cómo le fue con sus compañeros (con quién estuvo en el recreo, si tiene a quién contarle sus cosas y si alguien lo molestó o lo dejó fuera). Le diremos que su familia ve sus respuestas y que puede saltarlas. Solo quien tenga el PIN del espacio familia las ve, como señales para conversar y nunca como diagnóstico; el colegio no las ve. Guardamos sus últimas 12 semanas. Puedes desactivarlo y borrar sus respuestas cuando quieras desde el espacio familia.",
  en: "Optional: I allow the app to ask them once a week, at the end of a practice and with faces, how things went with their classmates (who they were with at recess, whether they have someone to tell things to, and whether anyone was mean to them or left them out). We'll tell them their family sees their answers and that they can skip them. Only whoever has the family area PIN sees them, as signals for a conversation and never as a diagnosis; the school doesn't see them. We keep their last 12 weeks. You can turn this off and delete their answers at any time from the family area.",
};

interface Props {
  onConsented: (consentId: string, socialCheckInConsent: boolean) => void;
}

export function ConsentScreen({ onConsented }: Props) {
  const { lang } = useLang();
  const [checked, setChecked] = useState(false);
  const [social, setSocial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    playConfirm();
    setError(null);
    setSubmitting(true);
    try {
      const consent = await endpoints.createConsent(CONSENT_TEXT[lang]);
      onConsented(consent.id, social);
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

        <label className="field" style={{ flexDirection: "row", alignItems: "flex-start", gap: "0.6rem" }}>
          <input
            type="checkbox"
            checked={social}
            onChange={(e) => {
              if (e.target.checked) playSelect();
              else playClick();
              setSocial(e.target.checked);
            }}
            style={{ marginTop: "0.2rem" }}
          />
          <span>{SOCIAL_CONSENT[lang]}</span>
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
