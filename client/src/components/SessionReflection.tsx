import { useState } from "react";
import type { Emotion, Hardest, ReflectionInput, ReflectionQuestion } from "../api/types.js";
import { speak, speechSupported } from "../lib/speech.js";
import { t, type Lang } from "../lib/i18n.js";
import { playSelect } from "../lib/sound.js";
import { EMOTION_CHOICES } from "../lib/emotions.js";

type Bi = Record<Lang, string>;


const EXTRA: Record<ReflectionQuestion, { field: "weather" | "energy" | "hardest"; question: Parameters<typeof t>[1]; options: Array<{ value: number | Hardest; emoji: string; label: Bi }> }> = {
  weather: {
    field: "weather",
    question: "reflectionWeatherQuestion",
    options: [
      { value: 1, emoji: "⛈️", label: { es: "Tormenta", en: "Storm" } },
      { value: 2, emoji: "🌧️", label: { es: "Lluvia", en: "Rain" } },
      { value: 3, emoji: "⛅", label: { es: "Nubes y sol", en: "Clouds and sun" } },
      { value: 4, emoji: "☀️", label: { es: "Sol", en: "Sunny" } },
    ],
  },
  energy: {
    field: "energy",
    question: "reflectionEnergyQuestion",
    options: [
      { value: 1, emoji: "🪫", label: { es: "Poquita", en: "A little" } },
      { value: 2, emoji: "🔋", label: { es: "Normal", en: "Some" } },
      { value: 3, emoji: "⚡", label: { es: "¡Mucha!", en: "Lots!" } },
    ],
  },
  hardest: {
    field: "hardest",
    question: "reflectionHardestQuestion",
    options: [
      { value: "entender", emoji: "🤔", label: { es: "Entender la pregunta", en: "Understanding the question" } },
      { value: "cuentas", emoji: "🧮", label: { es: "Hacer las cuentas", en: "Doing the math" } },
      { value: "concentrarme", emoji: "🌀", label: { es: "Concentrarme", en: "Focusing" } },
      { value: "nada", emoji: "😎", label: { es: "¡Nada, fue fácil!", en: "Nothing, it was easy!" } },
    ],
  },
};

interface Props {
  lang: Lang;
  question: ReflectionQuestion;
  /** Guarda la reflexión; si falla, igual se agradece (nunca bloquea al niño). */
  onSubmit: (input: ReflectionInput) => Promise<unknown>;
}

/**
 * Cierre de la práctica (specs/013): "¿Qué sentiste hoy?" con 6 emociones y
 * una pregunta lúdica que rota (clima, energía o lo más difícil). Ambas
 * opcionales; "Saltar" también se registra. La respuesta va al panel de la
 * familia ligada al tema de la sesión. Nunca bloquea "Volver al inicio".
 */
export function SessionReflection({ lang, question, onSubmit }: Props) {
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [extra, setExtra] = useState<number | Hardest | null>(null);
  const [sent, setSent] = useState<"answered" | "skipped" | null>(null);
  const q = EXTRA[question];

  async function send(skip: boolean) {
    const input: ReflectionInput = skip ? {} : { ...(emotion ? { emotion } : {}), ...(extra !== null ? { [q.field]: extra } : {}) };
    setSent(skip ? "skipped" : "answered");
    await onSubmit(input).catch(() => {});
  }

  if (sent) {
    if (sent === "skipped") return null;
    const choice = EMOTION_CHOICES.find((e) => e.key === emotion);
    return (
      <p className="reflection-thanks" role="status">
        {choice ? choice.thanks[lang] : t(lang, "reflectionThanks")}
      </p>
    );
  }

  return (
    <section className="reflection" aria-labelledby="reflection-title">
      <h2 id="reflection-title">{t(lang, "reflectionTitle")}</h2>
      <div className="reflection-question">
        <p id="reflection-emotion">{t(lang, "reflectionEmotionQuestion")}</p>
        {speechSupported && (
          <button
            className="reflection-listen"
            type="button"
            onClick={() => speak(`${t(lang, "reflectionEmotionQuestion")} ${EMOTION_CHOICES.map((e) => e.label[lang]).join(", ")}.`, lang)}
          >
            {t(lang, "reflectionListen")}
          </button>
        )}
      </div>
      <div className="reflection-emotions" role="radiogroup" aria-labelledby="reflection-emotion">
        {EMOTION_CHOICES.map((e) => (
          <button
            key={e.key}
            type="button"
            role="radio"
            aria-checked={emotion === e.key}
            className={`reflection-choice${emotion === e.key ? " selected" : ""}`}
            onClick={() => {
              playSelect();
              setEmotion(e.key);
            }}
          >
            <span className="reflection-emoji" aria-hidden="true">{e.emoji}</span>
            <span>{e.label[lang]}</span>
          </button>
        ))}
      </div>
      {/* En 1°–2° muchos aún no leen: la segunda pregunta y sus opciones también se pueden escuchar. */}
      <div className="reflection-question">
        <p id="reflection-extra">{t(lang, q.question)}</p>
        {speechSupported && (
          <button
            className="reflection-listen"
            type="button"
            onClick={() => speak(`${t(lang, q.question)} ${q.options.map((o) => o.label[lang]).join(", ")}.`, lang)}
          >
            {t(lang, "reflectionListen")}
          </button>
        )}
      </div>
      <div className={`reflection-extra reflection-extra-${q.options.length}`} role="radiogroup" aria-labelledby="reflection-extra">
        {q.options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={extra === o.value}
            className={`reflection-choice${extra === o.value ? " selected" : ""}`}
            onClick={() => {
              playSelect();
              setExtra(o.value);
            }}
          >
            <span className="reflection-emoji" aria-hidden="true">{o.emoji}</span>
            <span>{o.label[lang]}</span>
          </button>
        ))}
      </div>
      <div className="reflection-actions">
        <button className="btn-secondary" type="button" onClick={() => void send(true)}>
          {t(lang, "reflectionSkip")}
        </button>
        <button className="btn-primary" type="button" disabled={!emotion && extra === null} onClick={() => void send(false)}>
          {t(lang, "reflectionDone")}
        </button>
      </div>
    </section>
  );
}
