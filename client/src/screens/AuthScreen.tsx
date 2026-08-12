import { useState, type FormEvent } from "react";
import { useAuth } from "../context/useAuth.js";
import { ApiError } from "../api/client.js";
import { t, useLang } from "../lib/i18n.js";
import type { Lang } from "../lib/i18n.js";

function errorMessage(err: unknown, mode: "login" | "register", lang: Lang): string {
  if (err instanceof ApiError) {
    const code = (err.body as { error?: string } | null)?.error;
    if (code === "email_already_registered") return t(lang, "authErrEmailTaken");
    if (code === "invalid_credentials") return t(lang, "authErrInvalidCredentials");
    if (code === "invalid_payload") {
      return mode === "register" ? t(lang, "authErrInvalidPayloadRegister") : t(lang, "authErrInvalidPayloadLogin");
    }
  }
  return t(lang, "authErrGeneric");
}

export function AuthScreen() {
  const { login, register } = useAuth();
  const { lang, setLang } = useLang();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(errorMessage(err, mode, lang));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <div className="choice-grid" role="group" aria-label={t(lang, "chooseLanguageLabel")}>
        <button
          type="button"
          className={`choice-card ${lang === "es" ? "selected" : ""}`}
          onClick={() => setLang("es")}
        >
          <span className="emoji">🇪🇸</span>Español
        </button>
        <button
          type="button"
          className={`choice-card ${lang === "en" ? "selected" : ""}`}
          onClick={() => setLang("en")}
        >
          <span className="emoji">🇬🇧</span>English
        </button>
      </div>

      <h1>{t(lang, "authTitle")}</h1>
      <h2>{mode === "login" ? t(lang, "authLoginTitle") : t(lang, "authRegisterTitle")}</h2>
      <p className="hint-text">{t(lang, "authSubtitle")}</p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">{t(lang, "authEmail")}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">{t(lang, "authPassword")}</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "register" && <span className="hint-text">{t(lang, "authPasswordHint")}</span>}
        </div>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? t(lang, "authSubmitting") : mode === "login" ? t(lang, "authLogin") : t(lang, "authRegister")}
        </button>
      </form>

      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
      >
        {mode === "login" ? t(lang, "authSwitchToRegister") : t(lang, "authSwitchToLogin")}
      </button>
    </main>
  );
}
