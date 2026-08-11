import { useState, type FormEvent } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";

const CONSENT_TEXT =
  "Guardaremos el nombre y curso de tu hijo/a, y un registro de sus respuestas, pistas usadas y pausas — solo para adaptar la práctica y mostrarte su progreso. No se guarda ningún diagnóstico médico. Puedes pedir la eliminación de estos datos cuando quieras.";

interface Props {
  onConsented: (consentId: string) => void;
}

export function ConsentScreen({ onConsented }: Props) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const consent = await endpoints.createConsent(CONSENT_TEXT);
      onConsented(consent.id);
    } catch (err) {
      setError(err instanceof ApiError ? "No se pudo registrar el consentimiento. Intenta de nuevo." : "Algo no funcionó.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <h1>Antes de continuar</h1>
      <p>{CONSENT_TEXT}</p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field" style={{ flexDirection: "row", alignItems: "flex-start", gap: "0.6rem" }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            style={{ marginTop: "0.2rem" }}
          />
          <span>He leído lo anterior y doy mi consentimiento como adulto responsable.</span>
        </label>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <button className="btn-primary" type="submit" disabled={!checked || submitting}>
          {submitting ? "Un momento…" : "Continuar"}
        </button>
      </form>
    </main>
  );
}
