import type { MasteryLevel, TeacherDashboardData, TeacherRecommendation } from "../../api/types.js";
import { ERROR_LABELS } from "../../lib/errorLabels.js";
import { EMOTION_CHOICES } from "../../lib/emotions.js";
import type { Lang } from "../../lib/i18n.js";
import { SCHOOL, oaLabel, oaShort, pct } from "./copy.js";

const LEVELS: MasteryLevel[] = ["inicial", "desarrollo", "logrado", "pocos", "sin"];

interface Props {
  data: TeacherDashboardData;
  lang: Lang;
  onOpenStudent: (childId: string) => void;
}

/**
 * Panel de la docente para un curso (specs/014): acciones de la semana,
 * mapa de calor OA × estudiante, dominio y errores por OA, grupos de
 * refuerzo, participación y clima del curso.
 */
export function TeacherDashboard({ data, lang, onOpenStudent }: Props) {
  const c = SCHOOL[lang];
  const skill = (id: string) => data.skills.find((s) => s.id === id);
  const oa = (id: string) => oaLabel(skill(id), lang);
  const name = (id: string) => data.students.find((s) => s.id === id)?.name ?? "";
  const names = (ids: string[]) => ids.map(name).join(", ");
  const err = (code: string | null) => (code ? (ERROR_LABELS[lang][code] ?? code) : null);

  const actionText = (a: TeacherRecommendation) => {
    switch (a.kind) {
      case "reensenar":
        return c.reteach(oa(a.skillId), a.inicial, a.assessed, err(a.errorCode));
      case "grupo":
        return c.group(oa(a.skillId), names(a.childIds), err(a.errorCode));
      case "inactivos":
        return c.inactive(names(a.childIds));
      case "emocion_tema":
        return c.emotionTopic(oa(a.skillId), a.students);
    }
  };

  if (data.students.length === 0) {
    return <p className="school-empty">{c.noStudents(data.classroom.joinCode)}</p>;
  }

  return (
    <div className="school-dash">
      <div className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-label">{c.weekActive}</span>
          <span className="dash-stat-value">
            {data.week.activeStudents}/{data.students.length}
          </span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{c.weekMinutes}</span>
          <span className="dash-stat-value">{data.week.minutes}</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-label">{c.coverage}</span>
          <span className="dash-stat-value">
            {data.coverage.practiced}/{data.coverage.total}
          </span>
        </div>
      </div>

      <section className="dash-section" aria-labelledby="t-actions">
        <h2 id="t-actions" className="dash-section-title">{c.actionsTitle}</h2>
        {data.actions.length === 0 ? (
          <p className="hint-text">{c.noActions}</p>
        ) : (
          <ul className="school-actions">
            {data.actions.map((a, i) => (
              <li key={i} className={`school-action school-action-${a.kind}`}>
                {actionText(a)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dash-section" aria-labelledby="t-heat">
        <h2 id="t-heat" className="dash-section-title">{c.heatmapTitle}</h2>
        <p className="hint-text">{c.heatmapNote}</p>
        <ul className="school-legend">
          {LEVELS.map((l) => (
            <li key={l}>
              <span className={`heat heat-${l}`} aria-hidden="true" /> {c.levels[l]}
            </li>
          ))}
        </ul>
        <div className="school-table-wrap">
          <table className="school-heatmap">
            <thead>
              <tr>
                <th scope="col">{c.student}</th>
                {data.skills.map((s) => (
                  <th key={s.id} scope="col" title={oaLabel(s, lang)}>
                    {oaShort(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students.map((st) => (
                <tr key={st.id}>
                  <th scope="row">
                    <button type="button" className="school-link" onClick={() => onOpenStudent(st.id)}>
                      {st.name}
                    </button>
                  </th>
                  {data.skills.map((s) => {
                    const cell = data.heatmap[st.id]?.[s.id];
                    const level = cell?.level ?? "sin";
                    const label = `${st.name}, ${oaLabel(s, lang)}: ${c.levels[level]}${cell?.recentAccuracy != null ? ` (${pct(cell.recentAccuracy)})` : ""}`;
                    return (
                      <td key={s.id} className={`heat heat-${level}`} aria-label={label} title={label}>
                        {cell?.recentAccuracy != null && level !== "sin" ? Math.round(cell.recentAccuracy * 100) : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-section" aria-labelledby="t-sum">
        <h2 id="t-sum" className="dash-section-title">{c.summaryTitle}</h2>
        <ul className="school-oa-list">
          {data.skillSummary.map((s) => {
            const total = data.students.length;
            return (
              <li key={s.skillId}>
                <p className="dash-topic-name">{oa(s.skillId)}</p>
                <div className="school-stack" role="img" aria-label={LEVELS.map((l) => `${c.levels[l]}: ${s.levels[l]}`).join(", ")}>
                  {LEVELS.filter((l) => s.levels[l] > 0).map((l) => (
                    <span key={l} className={`heat-${l}`} style={{ width: `${(s.levels[l] / total) * 100}%` }}>
                      {s.levels[l]}
                    </span>
                  ))}
                </div>
                {s.topError && (
                  <p className="dash-topic-meta">
                    {c.topError}: {err(s.topError.code)} ({s.topError.count})
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="dash-section" aria-labelledby="t-groups">
        <h2 id="t-groups" className="dash-section-title">{c.groupsTitle}</h2>
        {data.groups.length === 0 ? (
          <p className="hint-text">{c.noGroups}</p>
        ) : (
          <ul className="school-groups">
            {data.groups.map((g, i) => (
              <li key={i} className="dash-tip-card">
                <span className="dash-tip-area">{oa(g.skillId)}</span>
                <span className="dash-review-stat">{err(g.errorCode) ?? c.noErrorCode}</span>
                <span>{names(g.childIds)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dash-section" aria-labelledby="t-part">
        <h2 id="t-part" className="dash-section-title">{c.participationTitle}</h2>
        <div className="school-table-wrap">
          <table className="school-table">
            <thead>
              <tr>
                <th scope="col">{c.student}</th>
                <th scope="col">{c.colLast}</th>
                <th scope="col">{c.colSessions}</th>
                <th scope="col">{c.colMinutes}</th>
                <th scope="col">{c.colHints}</th>
                <th scope="col">{c.colFast}</th>
                <th scope="col">{c.colHomeGames}</th>
              </tr>
            </thead>
            <tbody>
              {data.participation.map((p) => (
                <tr key={p.childId} className={p.inactive ? "school-row-alert" : ""}>
                  <th scope="row">{name(p.childId)}</th>
                  <td>{p.daysSinceLast === null ? c.never : c.daysAgo(p.daysSinceLast)}</td>
                  <td>{p.sessions7d}</td>
                  <td>{p.minutes7d}</td>
                  <td>{p.hintRate === null ? "—" : pct(p.hintRate)}</td>
                  <td>{p.fastRate === null ? "—" : pct(p.fastRate)}</td>
                  <td>{p.homeGames}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="dash-section" aria-labelledby="t-climate">
        <h2 id="t-climate" className="dash-section-title">{c.climateTitle}</h2>
        {data.climate.reporters === 0 ? (
          <p className="hint-text">{c.climateEmpty}</p>
        ) : (
          <>
            <p>{c.reporters(data.climate.reporters)}</p>
            <ul className="school-emotions">
              {EMOTION_CHOICES.map((e) => (
                <li key={e.key} className={data.climate.emotionCounts[e.key] ? "" : "dash-emotion-zero"}>
                  <span aria-hidden="true">{e.emoji}</span> {e.label[lang]} <b>{data.climate.emotionCounts[e.key]}</b>
                </li>
              ))}
            </ul>
            {data.climate.difficultSkills.length > 0 && (
              <>
                <h3 className="dash-subtitle">{c.difficultSkills}</h3>
                <ul className="dash-recent">
                  {data.climate.difficultSkills.slice(0, 3).map((d) => (
                    <li key={d.skillId}>
                      😤😰 {oa(d.skillId)} · {c.difficultCount(d.reports, d.students)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <h3 className="dash-subtitle">{c.alertsTitle}</h3>
        <p className="hint-text">{c.alertsNote}</p>
        {data.climate.alerts.length === 0 ? (
          <p>{c.noAlerts}</p>
        ) : (
          <ul className="school-actions">
            {data.climate.alerts.map((a) => (
              <li key={a.childId} className="school-action school-action-emocion_tema">
                <button type="button" className="school-link" onClick={() => onOpenStudent(a.childId)}>
                  {name(a.childId)}
                </button>
                : {a.reason === "emociones_dificiles" ? c.alertEmotions(a.count, a.skillId ? oa(a.skillId) : null) : c.alertMood}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="hint-text">{c.pendingNote}</p>
    </div>
  );
}
