import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext.js";
import { ApiError } from "../api/client.js";

function errorMessage(err: unknown, mode: "login" | "register"): string {
  if (err instanceof ApiError) {
    const code = (err.body as { error?: string } | null)?.error;
    if (code === "email_already_registered") return "Ese correo ya tiene una cuenta. Intenta iniciar sesión.";
    if (code === "invalid_credentials") return "Correo o contraseña incorrectos.";
    if (code === "invalid_payload") {
      return mode === "register"
        ? "Revisa el correo y usa una contraseña de al menos 8 caracteres."
        : "Revisa el correo y la contraseña.";
    }
  }
  return "Algo no funcionó. Intenta de nuevo en un momento.";
}

export function AuthScreen() {
  const { login, register } = useAuth();
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
      setError(errorMessage(err, mode));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="screen">
      <h1>Math Focus</h1>
      <h2>{mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}</h2>
      <p className="hint-text">Cuenta del adulto responsable — el perfil de tu hijo/a se crea después.</p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
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
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "register" && <span className="hint-text">Al menos 8 caracteres.</span>}
        </div>

        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Un momento…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
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
        {mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </main>
  );
}
