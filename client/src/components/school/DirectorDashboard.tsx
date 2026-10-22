import type { DirectorDashboardData, Emotion } from "../../api/types.js";
import { EMOTION_CHOICES } from "../../lib/emotions.js";
import { localize, type Lang } from "../../lib/i18n.js";
import { SCHOOL, guarded, oaLabel, pct } from "./copy.js";

interface Props {
  data: DirectorDashboardData;
  lang: Lang;
}

/**
 * Panel directivo (specs/014): siempre agregado y con mínimo de 5
 * estudiantes por grupo (el servidor ya devuelve "pocos datos" si no).
 * Dominio por eje y nivel, evolución mensual, cursos, paralelos,
 * bienestar por nivel y alertas. Sin nombres de estudiantes.
 */
export function DirectorDashboard({ data, lang }: Props) {
  const c = SCHOOL[lang];
  const grades = [...new Set(data.classes.map((x) => x.grade))].sort();
  const axes = [...new Map(data.masteryByGradeAxis.map((m) => [m.axis, m])).values()];
  const months = [...new Set(data.monthly.map((m) => m.month))];
  const className = (id: string) => data.classes.find((x) => x.id === id)?.name ?? "";
  const monthLabel = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", { month: "short" });
  const lastUse = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "es-CL", { day: "numeric", month: "short" }) : c.never);

  return (
    <div className="school-dash">
      <p className="hint-text">{c.directorNote}</p>
      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-label">{c.totClasses}</span>
          <span className="dash-stat-value">{data.totals.classes}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{c.totStudents}</span>
          <span className="dash-stat-value">{data.totals.students}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{c.totActive}</span>
          <span className="dash-stat-value">{data.totals.activeStudents7d}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{c.totTeachers}</span>
          <span className="dash-stat-value">
            {data.totals.teachersUsingPanel7d}/{data.totals.teachers}
          </span>
        </div>
      </div>

      <section className="dash-section" aria-labelledby="d-alerts">
        <h2 id="d-alerts" className="dash-section-title">{c.alertsDirTitle}</h2>
        {data.alerts.length === 0 ? (
          <p className="hint-text">{c.noDirAlerts}</p>
        ) : (
          <ul className="school-actions">
            {data.alerts.map((a, i) => (
              <li key={i} className="school-action school-action-emocion_tema">
                {a.kind === "baja_aciertos"
                  ? c.alertDrop(a.grade, pct(a.before), pct(a.after))
                  : a.kind === "emociones_dificiles"
                    ? c.alertDifficult(className(a.classId), pct(a.share))
                    : c.alertLowUse(className(a.classId), pct(a.share))}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dash-section" aria-labelledby="d-mastery">
        <h2 id="d-mastery" className="dash-section-title">{c.masteryTitle}</h2>
        <div className="school-table-wrap">
          <table className="school-table">
            <thead>
              <tr>
                <th scope="col">{c.axis}</th>
                {grades.map((g) => (
                  <th key={g} scope="col">
                    {c.gradeN(g)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {axes.map((ax) => (
                <tr key={ax.axis}>
                  <th scope="row">{localize(lang, ax.axis, ax.axisEn)}</th>
                  {grades.map((g) => {
                    const m = data.masteryByGradeAxis.find((x) => x.grade === g && x.axis === ax.axis);
                    return (
                      <td key={g} className={m?.logrado.ok ? `school-pct school-pct-${Math.min(4, Math.floor(m.logrado.value * 5))}` : "school-few"}>
                        {m ? guarded(m.logrado, c) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-section" aria-labelledby="d-monthly">
        <h2 id="d-monthly" className="dash-section-title">{c.monthlyTitle}</h2>
        <div className="school-table-wrap">
          <table className="school-table">
            <thead>
              <tr>
                <th scope="col">{c.grade}</th>
                {months.map((m) => (
                  <th key={m} scope="col">
                    {monthLabel(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g}>
                  <th scope="row">{c.gradeN(g)}</th>
                  {months.map((m) => {
                    const v = data.monthly.find((x) => x.grade === g && x.month === m)!.accuracy;
                    return (
                      <td key={m} className={v.ok ? "" : "school-few"}>
                        {guarded(v, c)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-section" aria-labelledby="d-classes">
        <h2 id="d-classes" className="dash-section-title">{c.classesTitle}</h2>
        <div className="school-table-wrap">
          <table className="school-table">
            <thead>
              <tr>
                <th scope="col">{c.colClass}</th>
                <th scope="col">{c.colTeacher}</th>
                <th scope="col">{c.colEnrolled}</th>
                <th scope="col">{c.colActive}</th>
                <th scope="col">{c.colMinutes}</th>
                <th scope="col">{c.colLogrado}</th>
                <th scope="col">{c.colDifficult}</th>
                <th scope="col">{c.colHomeGames}</th>
                <th scope="col">{c.colLastPanel}</th>
              </tr>
            </thead>
            <tbody>
              {data.classes.map((x) => (
                <tr key={x.id}>
                  <th scope="row">{x.name}</th>
                  <td>{x.teacherEmail}</td>
                  <td>{x.enrolled}</td>
                  <td>{x.active7d}</td>
                  <td>{x.minutes7d}</td>
                  <td>{guarded(x.logrado, c)}</td>
                  <td>{guarded(x.difficultEmotionShare, c)}</td>
                  <td>{x.homeGames}</td>
                  <td>{lastUse(x.teacherLastPanelAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-section" aria-labelledby="d-parallel">
        <h2 id="d-parallel" className="dash-section-title">{c.parallelTitle}</h2>
        <p className="hint-text">{c.parallelNote}</p>
        {data.parallel.length === 0 ? (
          <p>{c.noParallel}</p>
        ) : (
          <div className="school-table-wrap">
            <table className="school-table">
              <tbody>
                {data.parallel.map((p) => (
                  <tr key={`${p.grade}-${p.skillId}`}>
                    <th scope="row">{oaLabel(data.skills.find((s) => s.id === p.skillId), lang)}</th>
                    {p.byClass.map((b) => (
                      <td key={b.classId}>
                        <span className="hint-text">{className(b.classId)}:</span> {guarded(b.logrado, c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dash-section" aria-labelledby="d-wellbeing">
        <h2 id="d-wellbeing" className="dash-section-title">{c.wellbeingTitle}</h2>
        {data.wellbeingByGrade.map((w) => (
          <div key={w.grade}>
            <p className="dash-topic-name">{c.gradeN(w.grade)}</p>
            {w.counts.ok ? (
              <ul className="school-emotions">
                {EMOTION_CHOICES.map((e) => (
                  <li key={e.key}>
                    <span aria-hidden="true">{e.emoji}</span> {e.label[lang]} <b>{(w.counts as { value: Record<Emotion, number> }).value[e.key]}</b>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="school-few">{c.fewData}</p>
            )}
          </div>
        ))}
      </section>

      <p className="hint-text">{c.pendingNote}</p>
    </div>
  );
}
