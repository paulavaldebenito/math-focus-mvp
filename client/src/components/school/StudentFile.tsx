import { useState } from "react";
import * as endpoints from "../../api/endpoints.js";
import type { StudentFileData } from "../../api/types.js";
import { ERROR_LABELS } from "../../lib/errorLabels.js";
import { EMOTION_CHOICES } from "../../lib/emotions.js";
import { localize, type Lang } from "../../lib/i18n.js";
import { SCHOOL, oaLabel, pct } from "./copy.js";

interface Props {
  classroomId: string;
  data: StudentFileData;
  lang: Lang;
}

/**
 * Ficha de un estudiante para la docente (specs/014): dominio y tendencia
 * por OA, errores típicos, participación, emociones (solo con el
 * consentimiento aparte de la familia) y notas privadas.
 */
export function StudentFile({ classroomId, data, lang }: Props) {
  const c = SCHOOL[lang];
  const [notes, setNotes] = useState(data.notes);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState(false);
  const skill = (id: string | null) => data.skills.find((s) => s.id === id);
  const errors = Object.entries(data.errorBreakdown).sort((a, b) => b[1] - a[1]);
  const p = data.participation;

  async function save() {
    setErr(false);
    try {
      const n = await endpoints.addTeacherNote(classroomId, data.student.id, draft.trim());
      setNotes([{ ...n, author: "" }, ...notes]);
      setDraft("");
    } catch {
      setErr(true);
    }
  }

  return (
    <div className="school-dash">
      <h2 className="school-subtitle">{c.fileTitle(data.student.name)}</h2>

      <section className="dash-section" aria-labelledby="f-oa">
        <h3 id="f-oa" className="dash-section-title">{c.fileOa}</h3>
        <ul className="school-oa-list">
          {data.skills.map((s) => {
            const cell = data.cells[s.id];
            const level = cell?.level ?? "sin";
            const trend = data.trends[s.id];
            return (
              <li key={s.id} className="school-file-oa">
                <span className={`heat heat-${level} school-chip`}>{c.levels[level]}</span>
                <span>
                  {oaLabel(s, lang)}
                  {cell?.recentAccuracy != null && <span className="hint-text"> · {pct(cell.recentAccuracy)}</span>}
                  {trend && <span className={`dash-trend dash-trend-${trend}`}> · {c.trend[trend]}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {data.placement && (
        <section className="dash-section" aria-labelledby="f-review">
          <h3 id="f-review" className="dash-section-title">{c.fileReview}</h3>
          {data.placement.review.length > 0 ? (
            <>
              <p className="hint-text">{c.fileReviewIntro}</p>
              <ol className="placement-list">
                {data.placement.review.map((r) => (
                  <li key={r.id}>
                    {r.oaCode} · {localize(lang, r.name, r.nameEn)} · {r.grade}° ·{" "}
                    {r.status === "completed" ? c.fileReviewDone : c.fileReviewProgress(Math.min(r.correctCount, 5))}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="hint-text">{data.placement.placedAt ? c.fileReviewNone : c.fileReviewNever}</p>
          )}
        </section>
      )}

      <section className="dash-section" aria-labelledby="f-err">
        <h3 id="f-err" className="dash-section-title">{c.fileErrors}</h3>
        {errors.length === 0 ? (
          <p className="hint-text">{c.noErrors}</p>
        ) : (
          <ul className="dash-error-list">
            {errors.map(([code, n]) => (
              <li key={code} className="dash-error-row">
                <span>{ERROR_LABELS[lang][code] ?? code}</span>
                <span className="dash-error-count">{n}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dash-section" aria-labelledby="f-part">
        <h3 id="f-part" className="dash-section-title">{c.fileParticipation}</h3>
        <p>
          {c.colLast}: {p.daysSinceLast === null ? c.never : c.daysAgo(p.daysSinceLast)} · {c.colSessions}: {p.sessions7d} · {c.colMinutes}: {p.minutes7d}
        </p>
        <p className="hint-text">
          {c.colHints}: {p.hintRate === null ? "—" : pct(p.hintRate)} · {c.colFast}: {p.fastRate === null ? "—" : pct(p.fastRate)} · {c.colHomeGames}: {p.homeGames}
        </p>
      </section>

      <section className="dash-section" aria-labelledby="f-emo">
        <h3 id="f-emo" className="dash-section-title">{c.fileEmotions}</h3>
        {data.emotions === null ? (
          <p className="hint-text">{c.emotionsNotShared}</p>
        ) : data.emotions.length === 0 ? (
          <p className="hint-text">{c.noEmotions}</p>
        ) : (
          <ul className="dash-recent">
            {data.emotions.map((e, i) => {
              const ch = EMOTION_CHOICES.find((x) => x.key === e.emotion);
              return (
                <li key={i}>
                  <span aria-hidden="true">{ch?.emoji}</span> {ch?.label[lang]}
                  {e.skillId && <span className="hint-text"> · {oaLabel(skill(e.skillId), lang)}</span>}
                  <span className="hint-text"> · {new Date(`${e.date}T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", { day: "numeric", month: "short" })}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="dash-section" aria-labelledby="f-notes">
        <h3 id="f-notes" className="dash-section-title">{c.notesTitle}</h3>
        <textarea
          className="review-textarea"
          rows={3}
          maxLength={2000}
          value={draft}
          aria-label={c.notesTitle}
          placeholder={c.notePlaceholder}
          onChange={(e) => setDraft(e.target.value)}
        />
        {err && <p className="error-text" role="alert">{c.error}</p>}
        <button className="btn-primary" type="button" disabled={!draft.trim()} onClick={() => void save()}>
          {c.saveNote}
        </button>
        <ul className="dash-recent">
          {notes.map((n) => (
            <li key={n.id}>
              📝 {n.text} <span className="hint-text">· {new Date(n.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "es-CL")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
