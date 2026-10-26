import { useEffect, useState, type FormEvent } from "react";
import * as endpoints from "../api/endpoints.js";
import { ApiError } from "../api/client.js";
import { useLang } from "../lib/i18n.js";
import { playBack, playConfirm } from "../lib/sound.js";

/**
 * Entrada al espacio familia (specs/018). El niño y el adulto comparten la app: el progreso, las
 * emociones, las señales sociales y los consentimientos quedan detrás de un PIN de 4 dígitos que
 * el adulto crea (o recupera) con la contraseña de su cuenta.
 */
const COPY = {
  es: {
    title: "👪 Espacio familia",
    createIntro:
      "Crea un PIN de 4 dígitos. Así tu hijo o hija practica con tranquilidad, y su progreso, cómo se siente y las señales para conversar quedan en un espacio solo para la familia. Elige un PIN que no sea fácil de adivinar (no uses 1234 ni tu año de nacimiento).",
    pin: "PIN (4 dígitos)",
    pinRepeat: "Repite el PIN",
    password: "Contraseña de tu cuenta",
    create: "Crear PIN y entrar",
    enterIntro: "Ingresa el PIN del espacio familia.",
    enter: "Entrar",
    forgot: "Olvidé mi PIN",
    resetIntro: "Crea un PIN nuevo con la contraseña de tu cuenta.",
    back: "Volver",
    errMismatch: "Los dos PIN no coinciden.",
    errFormat: "El PIN debe tener 4 dígitos.",
    errPassword: "La contraseña no es correcta.",
    errWrong: (left: number) => `PIN incorrecto. Te ${left === 1 ? "queda 1 intento" : `quedan ${left} intentos`}.`,
    errLocked: (min: number) => `Demasiados intentos. Prueba de nuevo en ${min} ${min === 1 ? "minuto" : "minutos"}.`,
    errGeneric: "No se pudo completar. Intenta de nuevo.",
  },
  en: {
    title: "👪 Family area",
    createIntro:
      "Create a 4-digit PIN. That way your child can practice calmly, and their progress, how they feel and the signals to talk about stay in a family-only area. Pick a PIN that isn't easy to guess (don't use 1234 or your birth year).",
    pin: "PIN (4 digits)",
    pinRepeat: "Repeat the PIN",
    password: "Your account password",
    create: "Create PIN and enter",
    enterIntro: "Enter the family area PIN.",
    enter: "Enter",
    forgot: "I forgot my PIN",
    resetIntro: "Create a new PIN with your account password.",
    back: "Back",
    errMismatch: "The two PINs don't match.",
    errFormat: "The PIN must have 4 digits.",
    errPassword: "That password isn't right.",
    errWrong: (left: number) => `Wrong PIN. You have ${left} ${left === 1 ? "try" : "tries"} left.`,
    errLocked: (min: number) => `Too many tries. Try again in ${min} ${min === 1 ? "minute" : "minutes"}.`,
    errGeneric: "Something went wrong. Please try again.",
  },
};

interface Props {
  onUnlocked: () => void;
  onBack: () => void;
}

type Mode = "loading" | "create" | "enter" | "reset";

export function FamilyGateScreen({ onUnlocked, onBack }: Props) {
  const { lang } = useLang();
  const c = COPY[lang];
  const [mode, setMode] = useState<Mode>("loading");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    endpoints
      .getFamilyStatus()
      .then((s) => {
        if (cancelled) return;
        if (s.unlocked) onUnlocked();
        else setMode(s.hasPin ? "enter" : "create");
      })
      .catch(() => !cancelled && setMode("enter"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(pin)) return setError(c.errFormat);
    if (pin !== pin2) return setError(c.errMismatch);
    setBusy(true);
    try {
      await endpoints.setFamilyPin(pin, password);
      playConfirm();
      onUnlocked();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? c.errPassword : c.errGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function submitEnter(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(pin)) return setError(c.errFormat);
    setBusy(true);
    try {
      await endpoints.unlockFamily(pin);
      playConfirm();
      onUnlocked();
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { attemptsLeft?: number; retryAfterMs?: number } | null) : null;
      if (err instanceof ApiError && err.status === 401) setError(c.errWrong(body?.attemptsLeft ?? 1));
      else if (err instanceof ApiError && err.status === 429) setError(c.errLocked(Math.max(1, Math.ceil((body?.retryAfterMs ?? 60000) / 60000))));
      else setError(c.errGeneric);
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  const backButton = (
    <button
      className="btn-secondary"
      type="button"
      onClick={() => {
        playBack();
        onBack();
      }}
    >
      {c.back}
    </button>
  );

  if (mode === "loading") {
    return (
      <main className="screen" aria-busy="true">
        <h1>{c.title}</h1>
      </main>
    );
  }

  const pinInput = (label: string, value: string, set: (v: string) => void, id: string) => (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={value}
        onChange={(e) => set(onlyDigits(e.target.value))}
      />
    </label>
  );

  if (mode === "enter") {
    return (
      <main className="screen">
        <h1>{c.title}</h1>
        <p>{c.enterIntro}</p>
        <form className="form" onSubmit={submitEnter}>
          {pinInput(c.pin, pin, setPin, "family-pin")}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button className="btn-primary" type="submit" disabled={busy || pin.length !== 4}>
            {c.enter}
          </button>
        </form>
        <button
          className="btn-link"
          type="button"
          onClick={() => {
            setError(null);
            setPin("");
            setMode("reset");
          }}
        >
          {c.forgot}
        </button>
        {backButton}
      </main>
    );
  }

  return (
    <main className="screen">
      <h1>{c.title}</h1>
      <p>{mode === "create" ? c.createIntro : c.resetIntro}</p>
      <form className="form" onSubmit={submitCreate}>
        {pinInput(c.pin, pin, setPin, "family-pin-new")}
        {pinInput(c.pinRepeat, pin2, setPin2, "family-pin-repeat")}
        <label className="field" htmlFor="family-password">
          <span>{c.password}</span>
          <input id="family-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button className="btn-primary" type="submit" disabled={busy || pin.length !== 4 || pin2.length !== 4 || !password}>
          {c.create}
        </button>
      </form>
      {backButton}
    </main>
  );
}
