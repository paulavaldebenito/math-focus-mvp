import { useState, type FormEvent } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import type { ChildProfile } from "../api/types.js";

interface Props {
  consentId: string;
  onCreated: (child: ChildProfile) => void;
}

export function CreateChildScreen({ consentId, onCreated }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const child = await endpoints.createChild(consentId, displayName.trim());
      onCreated(child);
    } catch (err) {
      if (err instanceof ApiError && (err.body as { error?: string } | null)?.error === "consent_already_used") {
        setError("Ese consentimiento ya se usó para otro perfil.");
      } else {
        setError("No se pudo crear el perfil. Revisa el nombre e intenta de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <h1>Crea el perfil de tu hijo/a</h1>
      <p className="hint-text">MVP: por ahora solo 1° básico. Sin datos de salud ni diagnósticos.</p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="displayName">Nombre</label>
          <input
            id="displayName"
            type="text"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <button className="btn-primary" type="submit" disabled={displayName.trim().length === 0 || submitting}>
          {submitting ? "Un momento…" : "Continuar"}
        </button>
      </form>
    </main>
  );
}
