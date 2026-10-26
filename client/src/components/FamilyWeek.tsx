import { useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { CardStatus, SocialAnswer, SocialPanelData, WeeklySummary } from "../api/types.js";
import type { Lang } from "../lib/i18n.js";
import { EMOTION_CHOICES } from "../lib/emotions.js";
import { shortSkillName } from "../lib/skillShortNames.js";
import { playConfirm } from "../lib/sound.js";

/**
 * Espacio familia (specs/018): «La semana de…» (tres tarjetas con un estado simple) y «Con los
 * demás» (la pregunta social semanal, sus señales para conversar y cómo acompañar). Todo
 * descriptivo: nunca un diagnóstico.
 */

const pct = (x: number) => `${Math.round(x * 100)} %`;

/// Lunes de una semana ISO ("2026-W44") como fecha corta ("27 oct").
function weekStart(weekKey: string, lang: Lang): string {
  const [y, w] = weekKey.split("-W").map(Number) as [number, number];
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * 86400000 + (w - 1) * 7 * 86400000);
  return monday.toLocaleDateString(lang === "en" ? "en-US" : "es-CL", { day: "numeric", month: "short", timeZone: "UTC" });
}

const WEEK = {
  es: {
    title: (name: string) => `📅 La semana de ${name}`,
    note: "De lunes a hoy, comparado con la semana pasada.",
    learning: "📚 Aprendizaje",
    feelings: "💛 Cómo se siente",
    social: "🤝 Con los demás",
    status: {
      bien: "Va bien",
      atento: "Hay un tema para reforzar",
      conversar: "Conviene conversar",
      atencion: "Conviene conversar pronto",
      sin_datos: "Aún sin datos esta semana",
      desactivado: "Pregunta semanal desactivada",
    } as Record<CardStatus, string>,
    socialStatus: {
      bien: "Sin señales en su respuesta",
      atento: "",
      conversar: "Una señal para conversar",
      atencion: "Conviene conversar pronto",
      sin_datos: "Aún no responde las preguntas de esta semana",
      desactivado: "Pregunta semanal desactivada",
    } as Record<CardStatus, string>,
    practices: (n: number, prev: number) => `${n} ${n === 1 ? "práctica" : "prácticas"} (la semana pasada: ${prev})`,
    accuracy: (p: string) => `Respuestas correctas: ${p}`,
    focus: (topic: string) => `Para reforzar: ${topic}`,
    noPractice: "Una práctica corta al día ayuda más que una larga a la semana.",
    topEmotion: (e: string) => `Lo que más sintió al practicar: ${e}`,
    before: (e: string) => `(la semana pasada: ${e})`,
    mood: (x: number) => `Ánimo al empezar: ${x.toFixed(1)} de 5`,
    seeBelow: "Ver más abajo ↓",
  },
  en: {
    title: (name: string) => `📅 ${name}'s week`,
    note: "From Monday to today, compared with last week.",
    learning: "📚 Learning",
    feelings: "💛 How they feel",
    social: "🤝 With others",
    status: {
      bien: "Going well",
      atento: "A topic to reinforce",
      conversar: "Worth a conversation",
      atencion: "Worth talking soon",
      sin_datos: "No data yet this week",
      desactivado: "Weekly question turned off",
    } as Record<CardStatus, string>,
    socialStatus: {
      bien: "No signals in their answer",
      atento: "",
      conversar: "A signal to talk about",
      atencion: "Worth talking soon",
      sin_datos: "Hasn't answered this week's questions yet",
      desactivado: "Weekly question turned off",
    } as Record<CardStatus, string>,
    practices: (n: number, prev: number) => `${n} ${n === 1 ? "practice" : "practices"} (last week: ${prev})`,
    accuracy: (p: string) => `Correct answers: ${p}`,
    focus: (topic: string) => `To reinforce: ${topic}`,
    noPractice: "A short practice every day helps more than a long one each week.",
    topEmotion: (e: string) => `What they felt most while practicing: ${e}`,
    before: (e: string) => `(last week: ${e})`,
    mood: (x: number) => `Mood before practicing: ${x.toFixed(1)} out of 5`,
    seeBelow: "See below ↓",
  },
};

function emotionText(key: string | null, lang: Lang): string | null {
  const e = EMOTION_CHOICES.find((x) => x.key === key);
  return e ? `${e.emoji} ${e.label[lang].toLowerCase()}` : null;
}

export function WeekPanel({ week, name, lang, feelingsLocked = false }: { week: WeeklySummary; name: string; lang: Lang; feelingsLocked?: boolean }) {
  const c = WEEK[lang];
  const l = week.learning;
  const f = week.feelings;
  const top = emotionText(f.topEmotion, lang);
  const prevTop = emotionText(f.topEmotionPrev, lang);
  return (
    <section className="week-panel" aria-labelledby="week-title">
      <h2 id="week-title" className="dash-section-title">{c.title(name)}</h2>
      <p className="hint-text">{c.note}</p>
      <div className="week-cards">
        <article className={`week-card status-${l.status}`}>
          <h3>{c.learning}</h3>
          <p className="week-status">{c.status[l.status]}</p>
          <p>{c.practices(l.practices, l.practicesPrev)}</p>
          {l.accuracy !== null && <p>{c.accuracy(pct(l.accuracy))}</p>}
          {l.focusTopic && <p>{c.focus(shortSkillName(lang, l.focusTopic.name, l.focusTopic.nameEn))}</p>}
          {l.practices === 0 && <p className="hint-text">{c.noPractice}</p>}
        </article>
        {!feelingsLocked && (
          <article className={`week-card status-${f.status}`}>
            <h3>{c.feelings}</h3>
            <p className="week-status">{c.status[f.status]}</p>
            {top && (
              <p>
                {c.topEmotion(top)} {prevTop && prevTop !== top && <span className="hint-text">{c.before(prevTop)}</span>}
              </p>
            )}
            {f.moodAvg !== null && <p>{c.mood(f.moodAvg)}</p>}
          </article>
        )}
        <article className={`week-card status-${week.social.status}`}>
          <h3>{c.social}</h3>
          <p className="week-status">{c.socialStatus[week.social.status]}</p>
          <a href="#dash-social-title" className="week-link">
            {c.seeBelow}
          </a>
        </article>
      </div>
    </section>
  );
}

// ---------- Con los demás ----------

const SOCIAL = {
  es: {
    title: "🤝 Con los demás",
    privacy: "Solo quien tiene el PIN del espacio familia ve estas respuestas; el colegio no las ve. Tu hijo o hija sabe que las ves. Es lo que contó, no un diagnóstico.",
    offIntro:
      "Una vez por semana, al terminar una práctica, la app puede hacerle con caritas tres preguntas sobre cómo le fue con sus compañeros: con quién estuvo en el recreo, si tiene a quién contarle sus cosas y si alguien lo molestó o lo dejó fuera. Así puedes notar a tiempo si se está quedando sin compañía y conversarlo.",
    offConsent:
      "Al activarla autorizas estas preguntas. Le diremos que su familia ve sus respuestas y que puede saltarlas. Guardamos sus últimas 12 semanas, y puedes desactivarla y borrar sus respuestas cuando quieras.",
    enable: "Activar las preguntas semanales",
    disable: "Desactivar las preguntas semanales",
    disableDelete: "Desactivar y borrar sus respuestas",
    noAnswers: "Esta semana se las haremos al terminar una práctica.",
    signal: { conversar: "💬 Una señal para conversar", atencion: "🧡 Conviene conversar en los próximos días" },
    urgent: "🚨 Si es urgente",
    resources: "Otros apoyos",
    aloneNote: "Estar sin nadie a ratos y pasarlo bien es normal: muchos niños lo necesitan. Lo que importa es cuando quería estar con alguien y no pudo.",
    open: "Cómo abrir la conversación",
    avoid: "Qué evitar",
    school: "Cuándo hablar con el colegio",
    professional: "Cuándo buscar apoyo profesional",
    history: "Sus últimas respuestas",
    week: (d: string) => `Semana del ${d}`,
    recess: "Recreo",
    confidant: "Alguien a quien contarle",
    excluded: "Molestias o quedar fuera",
    recessText: { 1: "👫 con sus amigos", 2: "🧒🧒 con algunos compañeros", 3: "😌 sin nadie, y estuvo bien", 4: "😔 sin nadie, y quería estar con alguien", 5: "🏠 no fue al colegio" } as Record<number, string>,
    confidantText: { 1: "😊 sí", 2: "😐 más o menos", 3: "😟 no" } as Record<number, string>,
    excludedText: { no: "🙂 no", una_vez: "😕 una vez", varias: "😢 varias veces", prefiero_no: "🤐 prefirió no decir" } as Record<string, string>,
    skipped: "—",
  },
  en: {
    title: "🤝 With others",
    privacy: "Only whoever has the family area PIN sees these answers; the school doesn't. Your child knows you see them. It's what they shared, not a diagnosis.",
    offIntro:
      "Once a week, at the end of a practice, the app can ask them three questions with faces about how things went with their classmates: who they were with at recess, whether they have someone to tell things to, and whether anyone was mean to them or left them out. That way you can notice early if they're feeling left out and talk about it.",
    offConsent:
      "By turning it on you allow these questions. We'll tell them their family sees their answers and that they can skip them. We keep their last 12 weeks, and you can turn this off and delete their answers at any time.",
    enable: "Turn on the weekly questions",
    disable: "Turn off the weekly questions",
    disableDelete: "Turn off and delete their answers",
    noAnswers: "We'll ask them this week at the end of a practice.",
    signal: { conversar: "💬 A signal to talk about", atencion: "🧡 Worth talking in the next few days" },
    urgent: "🚨 If it's urgent",
    resources: "Other support",
    aloneNote: "Spending some time alone and enjoying it is normal: many children need it. What matters is when they wanted company and didn't have it.",
    open: "How to start the conversation",
    avoid: "What to avoid",
    school: "When to talk with the school",
    professional: "When to seek professional support",
    history: "Their latest answers",
    week: (d: string) => `Week of ${d}`,
    recess: "Recess",
    confidant: "Someone to talk to",
    excluded: "Someone was mean or left them out",
    recessText: { 1: "👫 with friends", 2: "🧒🧒 with some classmates", 3: "😌 alone, and was fine", 4: "😔 alone, wanted company", 5: "🏠 didn't go to school" } as Record<number, string>,
    confidantText: { 1: "😊 yes", 2: "😐 sort of", 3: "😟 no" } as Record<number, string>,
    excludedText: { no: "🙂 no", una_vez: "😕 once", varias: "😢 several times", prefiero_no: "🤐 preferred not to say" } as Record<string, string>,
    skipped: "—",
  },
};

export function SocialPanel({ childId, social, lang, onChanged }: { childId: string; social: SocialPanelData; lang: Lang; onChanged: () => void }) {
  const c = SOCIAL[lang];
  const [busy, setBusy] = useState(false);
  const toggle = async (enabled: boolean, deleteAnswers = false) => {
    setBusy(true);
    try {
      await endpoints.setSocialConsent(childId, enabled, deleteAnswers);
      playConfirm();
      onChanged();
    } finally {
      setBusy(false);
    }
  };
  const cell = (map: Record<string | number, string>, v: string | number | null) => (v === null ? c.skipped : (map[v] ?? c.skipped));
  const row = (a: SocialAnswer) => (
    <tr key={a.weekKey}>
      <th scope="row">{c.week(weekStart(a.weekKey, lang))}</th>
      <td>{cell(c.recessText, a.recess)}</td>
      <td>{cell(c.confidantText, a.confidant)}</td>
      <td>{cell(c.excludedText, a.excluded)}</td>
    </tr>
  );

  return (
    <section className="dash-section social-panel" aria-labelledby="dash-social-title">
      <h2 id="dash-social-title" className="dash-section-title">{c.title}</h2>
      {!social.enabled ? (
        <>
          <p>{c.offIntro}</p>
          <p className="hint-text">{c.offConsent}</p>
          <button className="btn-primary" type="button" disabled={busy} onClick={() => void toggle(true)}>
            {c.enable}
          </button>
        </>
      ) : (
        <>
          <p className="hint-text">{c.privacy}</p>
          {social.answeredWeeks === 0 && <p>{c.noAnswers}</p>}
          {social.signal && social.guidance && (
            <div className={`social-signal signal-${social.signal.level}`} role="status">
              <h3>{c.signal[social.signal.level]}</h3>
              <ul>
                {social.guidance.reasons.map((r) => (
                  <li key={r.key}>{r[lang]}</li>
                ))}
              </ul>
              <h4>{c.open}</h4>
              <ul>
                {social.guidance.open.map((g) => (
                  <li key={g.es}>{g[lang]}</li>
                ))}
              </ul>
              <h4>{c.avoid}</h4>
              <ul>
                {social.guidance.avoid.map((g) => (
                  <li key={g.es}>{g[lang]}</li>
                ))}
              </ul>
              <h4>{c.school}</h4>
              <p>{social.guidance.school[lang]}</p>
              <h4>{c.professional}</h4>
              <p>{social.guidance.professional[lang]}</p>
              <div className="social-urgent">
                <h4>{c.urgent}</h4>
                <p>{social.guidance.urgent[lang]}</p>
              </div>
              <h4>{c.resources}</h4>
              <p>{social.guidance.resources[lang]}</p>
            </div>
          )}
          {social.notes.map((n) => (
            <p key={n.key} className="social-note">
              {n[lang]}
            </p>
          ))}
          {social.history.length > 0 && (
            <div className="table-scroll">
              <table className="social-history">
                <caption>{c.history}</caption>
                <thead>
                  <tr>
                    <th scope="col" />
                    <th scope="col">{c.recess}</th>
                    <th scope="col">{c.confidant}</th>
                    <th scope="col">{c.excluded}</th>
                  </tr>
                </thead>
                <tbody>{social.history.map(row)}</tbody>
              </table>
              <p className="hint-text">{c.aloneNote}</p>
            </div>
          )}
          <div className="social-actions">
            <button className="btn-link" type="button" disabled={busy} onClick={() => void toggle(false)}>
              {c.disable}
            </button>
            <button className="btn-link" type="button" disabled={busy} onClick={() => void toggle(false, true)}>
              {c.disableDelete}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

// ---------- Plan gratis ----------

const PLAN = {
  es: {
    title: "⭐ Plan Familia",
    intro: "Con el Plan Familia ves todo lo que necesitas para acompañar a tu hijo o hija:",
    items: [
      "Aprendizaje por tema y los errores más frecuentes, con consejos para la casa",
      "Cómo se siente al practicar y cómo acompañar esas emociones",
      "Juegos para la casa para los temas que más le cuestan",
    ],
  },
  en: {
    title: "⭐ Family Plan",
    intro: "With the Family Plan you see everything you need to support your child:",
    items: [
      "Learning by topic and the most common mistakes, with tips for home",
      "How they feel while practicing and how to support those feelings",
      "Games for home for the topics they find hardest",
    ],
  },
};

export function PlanTeaser({ lang }: { lang: Lang }) {
  const c = PLAN[lang];
  return (
    <section className="dash-section plan-teaser" aria-labelledby="plan-title">
      <h2 id="plan-title" className="dash-section-title">{c.title}</h2>
      <p>{c.intro}</p>
      <ul>
        {c.items.map((i) => (
          <li key={i}>🔒 {i}</li>
        ))}
      </ul>
    </section>
  );
}
