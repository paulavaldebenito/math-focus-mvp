import { useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { Emotion, FeelingsSummary, HomeGame, TopicProgress, WellbeingCross } from "../api/types.js";
import { EMOTION_CHOICES } from "../lib/emotions.js";
import { localize, type Lang } from "../lib/i18n.js";
import { MATH_FACES, MOOD_FACES } from "../lib/moodFaces.js";

/// Días que necesita CADA grupo antes de comparar (mismo criterio que
/// MIN_DAYS_TO_COMPARE en el servidor): con menos, la diferencia es ruido.
const MIN_DAYS_TO_COMPARE = 2;
/// Días recientes que se listan en el panel.
const DAYS_LISTED = 7;
/// Si el promedio reciente de "cómo se siente con las matemáticas" queda en
/// este valor o menos (1 = muy nervioso/a … 5 = muy tranquilo/a), se sugiere
/// cómo acompañar esa sensación.
const MATH_NERVOUS_THRESHOLD = 2.5;

const pct = (x: number) => `${Math.round(x * 100)} %`;

/**
 * Textos para la FAMILIA (no para el niño), locales a este panel igual que
 * HOME_TIPS en FamilyDashboardScreen. Siempre descriptivos: muestran una
 * coincidencia observada, nunca una causa ni un diagnóstico.
 */
const COPY = {
  es: {
    wellbeingTitle: "🙂 Ánimo al empezar a practicar y aciertos",
    wellbeingEmpty:
      "Todavía no hay registros. En la primera práctica de cada día le preguntamos, con caritas y de forma opcional, cómo se siente y cómo se siente con las matemáticas.",
    fewDays: "Aún hay pocos días para comparar. Con más prácticas verás aquí si su ánimo y sus aciertos van de la mano.",
    mathCompare: (a: string, b: string) =>
      `Los días en que dijo sentir nervios con las matemáticas acertó un ${a}; los días en que se sintió con calma, un ${b}.`,
    moodCompare: (a: string, b: string) =>
      `Los días en que se sintió triste acertó un ${a}; los días en que se sintió bien, un ${b}.`,
    caveat:
      "Es una coincidencia observada, no una conclusión: úsala como punto de partida para conversar con tu hijo/a sobre cómo se siente.",
    nervousTitle: "Si siente nervios con las matemáticas",
    nervousTip:
      "Hablen de que equivocarse es parte de aprender y celebren el esfuerzo más que el resultado. Eviten frases como «yo también era malo/a para las matemáticas», prefieran sesiones cortas y tranquilas, y empiecen por algo que ya le sale bien para ganar confianza.",
    daysTitle: "Últimos días",
    colDay: "Día",
    colMood: "Ánimo",
    colMath: "Matemáticas",
    colAccuracy: "Aciertos",
    noExercises: "sin ejercicios",
    noAnswer: "—",
  },
  en: {
    wellbeingTitle: "🙂 Mood at the start of the day and results",
    wellbeingEmpty:
      "No entries yet. In the first practice of each day we ask, with faces and always optionally, how they feel and how they feel about math.",
    fewDays: "There aren't enough days to compare yet. With more practice you'll see here whether their mood and their results go hand in hand.",
    mathCompare: (a: string, b: string) =>
      `On days they said they felt nervous about math, they got ${a} right; on days they felt calm, ${b}.`,
    moodCompare: (a: string, b: string) => `On days they felt sad, they got ${a} right; on days they felt good, ${b}.`,
    caveat:
      "This is an observed pattern, not a conclusion: use it as a starting point to talk with your child about how they feel.",
    nervousTitle: "If they feel nervous about math",
    nervousTip:
      "Talk about mistakes being part of learning and praise effort more than results. Avoid phrases like “I was bad at math too”, keep sessions short and calm, and start with something they already do well to build confidence.",
    daysTitle: "Recent days",
    colDay: "Day",
    colMood: "Mood",
    colMath: "Math",
    colAccuracy: "Correct",
    noExercises: "no exercises",
    noAnswer: "—",
  },
} as const;

function formatDay(date: string, lang: Lang): string {
  // date es YYYY-MM-DD en hora de Chile; se arma a mediodía UTC para que el
  // formateo local nunca lo corra de día.
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function face(scale: typeof MOOD_FACES | typeof MATH_FACES, value: number | null, lang: Lang) {
  const f = value === null ? undefined : scale.find((x) => x.value === value);
  if (!f) return <span className="dash-face-none">{COPY[lang].noAnswer}</span>;
  return (
    <span className="dash-face" role="img" aria-label={f[lang]} title={f[lang]}>
      {f.emoji}
    </span>
  );
}

export function WellbeingPanel({ wellbeing, lang }: { wellbeing: WellbeingCross; lang: Lang }) {
  const c = COPY[lang];
  const { comparison: cmp } = wellbeing;
  const canCompare = (a: { days: number; accuracy: number | null }, b: { days: number; accuracy: number | null }) =>
    a.days >= MIN_DAYS_TO_COMPARE && b.days >= MIN_DAYS_TO_COMPARE && a.accuracy !== null && b.accuracy !== null;
  const mathOk = canCompare(cmp.mathNervous, cmp.mathCalm);
  const moodOk = canCompare(cmp.moodLow, cmp.moodHigh);
  const nervous = wellbeing.recentMathFeeling !== null && wellbeing.recentMathFeeling <= MATH_NERVOUS_THRESHOLD;

  return (
    <section className="dash-wellbeing" aria-labelledby="dash-wellbeing-title">
      <p id="dash-wellbeing-title" className="dash-errors-title">
        {c.wellbeingTitle}
      </p>

      {wellbeing.days.length === 0 ? (
        <p className="hint-text">{c.wellbeingEmpty}</p>
      ) : (
        <>
          {mathOk || moodOk ? (
            <div className="dash-insight">
              {mathOk && <p>{c.mathCompare(pct(cmp.mathNervous.accuracy!), pct(cmp.mathCalm.accuracy!))}</p>}
              {moodOk && <p>{c.moodCompare(pct(cmp.moodLow.accuracy!), pct(cmp.moodHigh.accuracy!))}</p>}
              <p className="hint-text">{c.caveat}</p>
            </div>
          ) : (
            <p className="hint-text">{c.fewDays}</p>
          )}

          {nervous && (
            <div className="dash-tip-card">
              <span className="dash-tip-area">{c.nervousTitle}</span>
              <span>{c.nervousTip}</span>
            </div>
          )}

          <table className="dash-days">
            <caption>{c.daysTitle}</caption>
            <thead>
              <tr>
                <th scope="col">{c.colDay}</th>
                <th scope="col">{c.colMood}</th>
                <th scope="col">{c.colMath}</th>
                <th scope="col">{c.colAccuracy}</th>
              </tr>
            </thead>
            <tbody>
              {wellbeing.days.slice(0, DAYS_LISTED).map((d) => (
                <tr key={d.date}>
                  <th scope="row">{formatDay(d.date, lang)}</th>
                  <td>{face(MOOD_FACES, d.mood, lang)}</td>
                  <td>{face(MATH_FACES, d.mathFeeling, lang)}</td>
                  <td>{d.accuracy === null ? c.noExercises : `${pct(d.accuracy)} (${d.correct}/${d.attempts})`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

// ---------- Emociones al cerrar la práctica (specs/013) ----------

const FEEL = {
  es: {
    title: "💛 Cómo se ha sentido al practicar",
    empty: "Aún no hay respuestas. Al terminar cada práctica le preguntamos, con caritas y de forma opcional, qué sintió.",
    count: (n: number) => `En las últimas 2 semanas contó cómo se sintió en ${n} ${n === 1 ? "práctica" : "prácticas"}.`,
    weather: "Clima de sus prácticas",
    energy: "Energía que le puso",
    hardest: "Lo que más le ha costado",
    guidanceTitle: "Cómo acompañar",
    say: "💬 Qué decir",
    doIt: "🤝 Qué hacer",
    recent: "Últimas prácticas",
    caveat: "Es lo que contó tu hijo/a, no un diagnóstico: úsalo como punto de partida para conversar.",
  },
  en: {
    title: "💛 How they’ve felt while practicing",
    empty: "No answers yet. At the end of each practice we ask, with faces and always optionally, how they felt.",
    count: (n: number) => `In the last 2 weeks they shared how they felt in ${n} ${n === 1 ? "practice" : "practices"}.`,
    weather: "Weather of their practices",
    energy: "Energy they put in",
    hardest: "What has been hardest",
    guidanceTitle: "How to support them",
    say: "💬 What to say",
    doIt: "🤝 What to do",
    recent: "Recent practices",
    caveat: "This is what your child shared, not a diagnosis: use it as a starting point to talk.",
  },
} as const;

const WEATHER = ["⛈️", "🌧️", "⛅", "☀️"];
const ENERGY = ["🪫", "🔋", "⚡"];
const emotionChoice = (e: Emotion) => EMOTION_CHOICES.find((c) => c.key === e)!;

export function FeelingsPanel({ feelings, lang }: { feelings: FeelingsSummary; lang: Lang }) {
  const c = FEEL[lang];
  const max = Math.max(1, ...Object.values(feelings.counts));
  return (
    <section className="dash-section" aria-labelledby="dash-feelings-title">
      <h2 id="dash-feelings-title" className="dash-section-title">{c.title}</h2>
      {feelings.answered === 0 && feelings.weatherAvg === null && feelings.energyAvg === null ? (
        <p className="hint-text">{c.empty}</p>
      ) : (
        <>
          <p>{c.count(feelings.answered)}</p>
          <ul className="dash-emotions">
            {EMOTION_CHOICES.map((e) => (
              <li key={e.key} className={feelings.counts[e.key] ? "" : "dash-emotion-zero"}>
                <span className="dash-emotion-emoji" aria-hidden="true">{e.emoji}</span>
                <span className="dash-emotion-label">{e.label[lang]}</span>
                <span className="dash-emotion-bar" aria-hidden="true">
                  <span style={{ width: `${(feelings.counts[e.key] / max) * 100}%` }} />
                </span>
                <span className="dash-emotion-count">{feelings.counts[e.key]}</span>
              </li>
            ))}
          </ul>
          {(feelings.weatherAvg !== null || feelings.energyAvg !== null) && (
            <div className="dash-chips">
              {feelings.weatherAvg !== null && (
                <span className="dash-chip">
                  {c.weather}: <b aria-hidden="true">{WEATHER[Math.round(feelings.weatherAvg) - 1]}</b>
                </span>
              )}
              {feelings.energyAvg !== null && (
                <span className="dash-chip">
                  {c.energy}: <b aria-hidden="true">{ENERGY[Math.round(feelings.energyAvg) - 1]}</b>
                </span>
              )}
            </div>
          )}
          {feelings.guidance.length > 0 && (
            <>
              <h3 className="dash-subtitle">{c.guidanceTitle}</h3>
              {feelings.guidance.map((g) => (
                <article key={g.emotion} className={`dash-guide dash-guide-${g.emotion}`}>
                  <p className="dash-guide-head">
                    <span aria-hidden="true">{g.emoji}</span> <b>{g.label[lang]}</b> — {g.meaning[lang]}
                  </p>
                  <p className="dash-guide-label">{c.say}</p>
                  <ul>{g.say[lang].map((x) => <li key={x}>{x}</li>)}</ul>
                  <p className="dash-guide-label">{c.doIt}</p>
                  <ul>{g.do[lang].map((x) => <li key={x}>{x}</li>)}</ul>
                </article>
              ))}
            </>
          )}
          {feelings.hardestGuidance && (
            <div className="dash-tip-card">
              <span className="dash-tip-area">
                {c.hardest}: {feelings.hardestGuidance.emoji} {feelings.hardestGuidance.label[lang]}
              </span>
              <span>{feelings.hardestGuidance.tip[lang]}</span>
            </div>
          )}
          {feelings.recent.length > 0 && (
            <>
              <h3 className="dash-subtitle">{c.recent}</h3>
              <ul className="dash-recent">
                {feelings.recent.map((r, i) => (
                  <li key={i}>
                    <span aria-hidden="true">{emotionChoice(r.emotion).emoji}</span> {emotionChoice(r.emotion).label[lang]}
                    {r.skill && <span className="hint-text"> · {localize(lang, r.skill.name, r.skill.nameEn)}</span>}
                    <span className="hint-text"> · {formatDay(r.date, lang)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="hint-text">{c.caveat}</p>
        </>
      )}
    </section>
  );
}

// ---------- Juegos para la casa y evolución por tema ----------

const TOPIC = {
  es: {
    gamesTitle: "🎲 Juegos para la casa",
    gamesIntro: "Para los temas que más le cuestan o en los que hace poco sintió rabia o nervios. Sin pantalla, de 5 a 15 minutos.",
    gamesNone: "Por ahora ningún tema necesita refuerzo. ¡Sigan así! Más abajo, cada tema tiene su juego por si quieren jugar igual.",
    reasonAccuracy: (c: number, n: number) => `Le está costando: en sus últimas ${n} preguntas acertó ${c}.`,
    reasonEmotion: (label: string) => `La última vez que lo practicó sintió ${label.toLowerCase()}.`,
    minutes: (n: number) => `⏱ ${n} min`,
    materials: "Necesitan",
    play: "¡Lo jugamos! ✅",
    played: (n: number) => `Jugado ${n} ${n === 1 ? "vez" : "veces"} 🎉`,
    playErr: "No se pudo registrar. Intenta de nuevo.",
    topicsTitle: "📈 Cómo va en cada tema",
    topicsEmpty: "Cuando practique, aquí verás cómo le va en cada tema.",
    trend: { up: "↗ Mejorando", down: "↘ Le está costando más", steady: "→ Estable" },
    fewYet: "Aún pocas preguntas",
    felt: "Se sintió",
    seeGame: "Ver juego para la casa",
    stat: (p: string, n: number) => `${p} de aciertos en ${n} ${n === 1 ? "pregunta" : "preguntas"}`,
  },
  en: {
    gamesTitle: "🎲 Games for home",
    gamesIntro: "For the topics they find hardest or where they recently felt frustrated or nervous. No screens, 5 to 15 minutes.",
    gamesNone: "For now no topic needs extra support. Keep it up! Below, each topic has its game in case you want to play anyway.",
    reasonAccuracy: (c: number, n: number) => `It’s been tricky lately: in their last ${n} questions they got ${c} right.`,
    reasonEmotion: (label: string) => `The last time they practiced it they felt ${label.toLowerCase()}.`,
    minutes: (n: number) => `⏱ ${n} min`,
    materials: "You need",
    play: "We played it! ✅",
    played: (n: number) => `Played ${n} ${n === 1 ? "time" : "times"} 🎉`,
    playErr: "Couldn’t save it. Please try again.",
    topicsTitle: "📈 How each topic is going",
    topicsEmpty: "Once they practice, you’ll see here how each topic is going.",
    trend: { up: "↗ Improving", down: "↘ Finding it harder lately", steady: "→ Steady" },
    fewYet: "Not many questions yet",
    felt: "Felt",
    seeGame: "See the home game",
    stat: (p: string, n: number) => `${p} correct in ${n} ${n === 1 ? "question" : "questions"}`,
  },
} as const;

/// Temas con juego destacado arriba (los que más necesitan apoyo).
const MAX_FEATURED_GAMES = 3;

function GameCard({ childId, topic, game, lang }: { childId: string; topic: TopicProgress; game: HomeGame; lang: Lang }) {
  const c = TOPIC[lang];
  const [times, setTimes] = useState(topic.timesPlayed);
  const [err, setErr] = useState(false);
  return (
    <article className="dash-game">
      <p className="dash-game-head">
        <span className="dash-game-emoji" aria-hidden="true">{game.emoji}</span>
        <span>
          <b>{game.name[lang]}</b>
          <span className="hint-text"> {c.minutes(game.minutes)}</span>
        </span>
      </p>
      <p className="dash-game-materials">
        <b>{c.materials}:</b> {game.materials[lang]}
      </p>
      <ol className="dash-game-steps">{game.steps[lang].map((s) => <li key={s}>{s}</li>)}</ol>
      <div className="dash-game-foot">
        <button
          className="btn-secondary dash-game-play"
          type="button"
          onClick={() => {
            setErr(false);
            endpoints
              .playHomeGame(childId, topic.skillId)
              .then((r) => setTimes(r.timesPlayed))
              .catch(() => setErr(true));
          }}
        >
          {c.play}
        </button>
        {times > 0 && <span className="dash-game-played">{c.played(times)}</span>}
      </div>
      {err && <p className="error-text" role="alert">{c.playErr}</p>}
    </article>
  );
}

export function HomeGamesPanel({ childId, topics, lang }: { childId: string; topics: TopicProgress[]; lang: Lang }) {
  const c = TOPIC[lang];
  const featured = topics.filter((t) => t.needsHelp.length > 0 && t.game).slice(0, MAX_FEATURED_GAMES);
  return (
    <section className="dash-section" aria-labelledby="dash-games-title">
      <h2 id="dash-games-title" className="dash-section-title">{c.gamesTitle}</h2>
      {featured.length === 0 ? (
        <p className="hint-text">{c.gamesNone}</p>
      ) : (
        <>
          <p className="hint-text">{c.gamesIntro}</p>
          {featured.map((t) => (
            <div key={t.skillId} className="dash-game-topic">
              <p className="dash-tip-area">{localize(lang, t.name, t.nameEn)}</p>
              {t.needsHelp.includes("aciertos") && <p className="dash-review-stat">{c.reasonAccuracy(t.recentCorrect, t.recentAttempts)}</p>}
              {t.needsHelp.includes("emocion") && t.lastEmotion && (
                <p className="dash-review-stat">
                  {emotionChoice(t.lastEmotion).emoji} {c.reasonEmotion(emotionChoice(t.lastEmotion).label[lang])}
                </p>
              )}
              <GameCard childId={childId} topic={t} game={t.game!} lang={lang} />
            </div>
          ))}
        </>
      )}
    </section>
  );
}

export function TopicsPanel({ childId, topics, lang }: { childId: string; topics: TopicProgress[]; lang: Lang }) {
  const c = TOPIC[lang];
  return (
    <section className="dash-section" aria-labelledby="dash-topics-title">
      <h2 id="dash-topics-title" className="dash-section-title">{c.topicsTitle}</h2>
      {topics.length === 0 ? (
        <p className="hint-text">{c.topicsEmpty}</p>
      ) : (
        <ul className="dash-topics">
          {topics.map((t) => (
            <li key={t.skillId} className="dash-topic">
              <p className="dash-topic-name">{localize(lang, t.name, t.nameEn)}</p>
              <div className="dash-topic-bar" role="img" aria-label={c.stat(pct(t.accuracy), t.attempts)}>
                <span style={{ width: `${Math.round(t.accuracy * 100)}%` }} />
              </div>
              <p className="dash-topic-meta">
                <span>{c.stat(pct(t.accuracy), t.attempts)}</span>
                <span className={`dash-trend dash-trend-${t.trend ?? "none"}`}>{t.trend ? c.trend[t.trend] : c.fewYet}</span>
                {t.lastEmotion && (
                  <span>
                    {c.felt}: <span title={emotionChoice(t.lastEmotion).label[lang]}>{emotionChoice(t.lastEmotion).emoji}</span>
                  </span>
                )}
              </p>
              {t.game && (
                <details className="dash-topic-game">
                  <summary>
                    {t.game.emoji} {c.seeGame}
                  </summary>
                  <GameCard childId={childId} topic={t} game={t.game} lang={lang} />
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
