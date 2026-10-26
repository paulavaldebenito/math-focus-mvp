import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import { speak, speechSupported } from "../lib/speech.js";
import type { Lang } from "../lib/i18n.js";
import { playSelect } from "../lib/sound.js";

/**
 * Pregunta social de la semana (specs/018), al terminar una práctica: una vez por semana, solo si la
 * familia lo autorizó. Con caritas, opcional y con la verdad por delante: el niño sabe que su
 * familia ve sus respuestas para poder ayudarle. Sin "/a" ni palabras difíciles (1° a 6° básico), y
 * cada pregunta se puede escuchar.
 */
type Bi = Record<Lang, string>;
type Opt<V> = { value: V; emoji: string; label: Bi };

const COPY = {
  es: {
    title: "🤝 Tres preguntas de la semana",
    note: "No hay respuestas buenas ni malas. Tu familia las ve para poder ayudarte. Puedes saltarlas.",
    listen: "🔊 Escuchar",
    skip: "Saltar",
    done: "Listo",
    thanks: "¡Gracias por contarlo! 💙",
    trusted: "Si alguien te molesta o te deja fuera, no es tu culpa. Cuéntale a un adulto de confianza: a tu familia o a tu profesor o profesora. Contarlo es lo correcto.",
    trustedBrief: "Si algún día alguien te molesta o te deja fuera, no es tu culpa: cuéntale a un adulto de confianza.",
  },
  en: {
    title: "🤝 This week's three questions",
    note: "There are no right or wrong answers. Your family sees them so they can help you. You can skip them.",
    listen: "🔊 Listen",
    skip: "Skip",
    done: "Done",
    thanks: "Thanks for sharing! 💙",
    trusted: "If someone is mean to you or leaves you out, it's not your fault. Tell an adult you trust: your family or your teacher. Telling is the right thing to do.",
    trustedBrief: "If someone is ever mean to you or leaves you out, it's not your fault: tell an adult you trust.",
  },
};

const RECESS: { q: Bi; options: Opt<number>[] } = {
  q: { es: "Esta semana en el recreo estuve…", en: "This week at recess I was…" },
  options: [
    { value: 1, emoji: "👫", label: { es: "con mis amigos", en: "with my friends" } },
    { value: 2, emoji: "🧒🧒", label: { es: "con algunos compañeros", en: "with some classmates" } },
    { value: 3, emoji: "😌", label: { es: "sin nadie, y estuve bien", en: "by myself, and I was fine" } },
    { value: 4, emoji: "😔", label: { es: "sin nadie, y quería estar con alguien", en: "by myself, and I wanted to be with someone" } },
    { value: 5, emoji: "🏠", label: { es: "esta semana no fui al colegio", en: "I didn't go to school this week" } },
  ],
};
/// "No fui al colegio": las otras dos preguntas no aplican esa semana.
const NO_SCHOOL = 5;
const CONFIDANT: { q: Bi; options: Opt<number>[] } = {
  q: { es: "¿Tienes en tu curso a alguien a quien contarle tus cosas?", en: "Do you have someone in your class you can tell things to?" },
  options: [
    { value: 1, emoji: "😊", label: { es: "Sí", en: "Yes" } },
    { value: 2, emoji: "😐", label: { es: "Más o menos", en: "Sort of" } },
    { value: 3, emoji: "😟", label: { es: "No", en: "No" } },
  ],
};
const EXCLUDED: { q: Bi; options: Opt<string>[] } = {
  q: { es: "Esta semana, ¿alguien te molestó o te dejó fuera?", en: "This week, was anyone mean to you or did anyone leave you out?" },
  options: [
    { value: "no", emoji: "🙂", label: { es: "No", en: "No" } },
    { value: "una_vez", emoji: "😕", label: { es: "Una vez", en: "Once" } },
    { value: "varias", emoji: "😢", label: { es: "Varias veces", en: "Several times" } },
    { value: "prefiero_no", emoji: "🤐", label: { es: "Prefiero no decir", en: "I'd rather not say" } },
  ],
};

interface Props {
  childId: string;
  lang: Lang;
}

export function SocialCheckIn({ childId, lang }: Props) {
  const c = COPY[lang];
  const [due, setDue] = useState(false);
  const [recess, setRecess] = useState<number | null>(null);
  const [confidant, setConfidant] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<string | null>(null);
  const [sent, setSent] = useState<"skipped" | "answered" | null>(null);

  useEffect(() => {
    let cancelled = false;
    endpoints
      .getSocialCheckIn(childId)
      .then((r) => !cancelled && setDue(r.due))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [childId]);

  if (!due) return null;

  async function send(skip: boolean) {
    setSent(skip ? "skipped" : "answered");
    const answer = skip
      ? {}
      : recess === NO_SCHOOL
        ? { recess }
        : { ...(recess !== null ? { recess } : {}), ...(confidant !== null ? { confidant } : {}), ...(excluded !== null ? { excluded } : {}) };
    await endpoints.submitSocialCheckIn(childId, answer).catch(() => {});
  }

  if (sent === "skipped") return null;
  if (sent === "answered") {
    // A todos un mensaje breve (así el niño no aprende que su respuesta cambia lo que ve); el completo
    // si contó que lo molestaron o prefirió no decirlo.
    const full = recess !== NO_SCHOOL && (excluded === "una_vez" || excluded === "varias" || excluded === "prefiero_no");
    const message = `${c.thanks} ${full ? c.trusted : c.trustedBrief}`;
    return (
      <div className="reflection-thanks" role="status">
        <p>{c.thanks}</p>
        <p>{full ? c.trusted : c.trustedBrief}</p>
        {speechSupported && (
          <button className="reflection-listen" type="button" onClick={() => speak(message, lang)}>
            {c.listen}
          </button>
        )}
      </div>
    );
  }

  function group<V extends string | number>(id: string, item: { q: Bi; options: Opt<V>[] }, value: V | null, set: (v: V) => void) {
    return (
      <>
        <div className="reflection-question">
          <p id={id}>{item.q[lang]}</p>
          {speechSupported && (
            <button
              className="reflection-listen"
              type="button"
              onClick={() => speak(`${item.q[lang]} ${item.options.map((o) => o.label[lang]).join(", ")}.`, lang)}
            >
              {c.listen}
            </button>
          )}
        </div>
        <div className={`reflection-extra reflection-extra-${item.options.length}`} role="radiogroup" aria-labelledby={id}>
          {item.options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={value === o.value}
              className={`reflection-choice${value === o.value ? " selected" : ""}`}
              onClick={() => {
                playSelect();
                set(o.value);
              }}
            >
              <span className="reflection-emoji" aria-hidden="true">{o.emoji}</span>
              <span>{o.label[lang]}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  return (
    <section className="reflection social-checkin" aria-labelledby="social-title">
      <h2 id="social-title">{c.title}</h2>
      {/* Que la familia ve las respuestas se dice en voz alta también: en 1°–2° muchos aún no leen. */}
      <div className="reflection-question">
        <p>{c.note}</p>
        {speechSupported && (
          <button className="reflection-listen" type="button" onClick={() => speak(c.note, lang)}>
            {c.listen}
          </button>
        )}
      </div>
      {group("social-recess", RECESS, recess, setRecess)}
      {recess !== NO_SCHOOL && group("social-confidant", CONFIDANT, confidant, setConfidant)}
      {recess !== NO_SCHOOL && group("social-excluded", EXCLUDED, excluded, setExcluded)}
      <div className="reflection-actions">
        <button className="btn-secondary" type="button" onClick={() => void send(true)}>
          {c.skip}
        </button>
        <button className="btn-primary" type="button" disabled={recess === null && confidant === null && excluded === null} onClick={() => void send(false)}>
          {c.done}
        </button>
      </div>
    </section>
  );
}
