import { useState, type FormEvent } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import type { ChildProfile } from "../api/types.js";
import { t, useLang } from "../lib/i18n.js";

interface Props {
  consentId: string;
  onCreated: (child: ChildProfile) => void;
}

const SUPPORTED_GRADES = [1, 2] as const;

export function CreateChildScreen({ consentId, onCreated }: Props) {
  const { lang } = useLang();
  const [displayName, setDisplayName] = useState("");
  const [grade, setGrade] = useState<(typeof SUPPORTED_GRADES)[number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!grade) return;
    setError(null);
    setSubmitting(true);
    try {
      const child = await endpoints.createChild(consentId, displayName.trim(), grade);
      onCreated(child);
    } catch (err) {
      if (err instanceof ApiError && (err.body as { error?: string } | null)?.error === "consent_already_used") {
        setError(t(lang, "createChildErrConsentUsed"));
      } else {
        setError(t(lang, "createChildErrGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <h1>{t(lang, "createChildTitle")}</h1>
      <p className="hint-text">{t(lang, "createChildSubtitle")}</p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="displayName">{t(lang, "createChildNameLabel")}</label>
          <input
            id="displayName"
            type="text"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="field">
          <label id="grade-label">{t(lang, "createChildGradeLabel")}</label>
          <div className="choice-grid" role="group" aria-labelledby="grade-label">
            {SUPPORTED_GRADES.map((g) => (
              <button
                key={g}
                type="button"
                className={`choice-card ${grade === g ? "selected" : ""}`}
                onClick={() => setGrade(g)}
              >
                {t(lang, g === 1 ? "grade1Label" : "grade2Label")}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <button
          className="btn-primary"
          type="submit"
          disabled={displayName.trim().length === 0 || !grade || submitting}
        >
          {submitting ? t(lang, "authSubmitting") : t(lang, "continueBtn")}
        </button>
      </form>
    </main>
  );
}
