import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type {
  ReviewAnswerResult,
  ReviewExercise,
  ReviewExerciseSummary,
  ReviewPendingComment,
  ReviewSkill,
} from "../api/types.js";
import { ExerciseIllustration } from "../components/ExerciseIllustration.js";
import { WorkedSolution } from "../components/WorkedSolution.js";
import { interestByKey } from "../lib/interests.js";
import { speak, speechSupported } from "../lib/speech.js";
import { FEEDBACK_CORRECT_VARIANTS, localize, t, useLang } from "../lib/i18n.js";
import { wrongFeedbackText } from "../lib/feedback.js";

const GRADES = [1, 2, 3, 4, 5, 6];

interface Props {
  onExit: () => void;
}

type SkillRef = Pick<ReviewSkill, "id" | "name" | "nameEn" | "oaCode">;

type View = { kind: "skills" } | { kind: "pending" } | { kind: "exercise"; skill: SkillRef; index: number };

/**
 * Modo revisión (specs/011-modo-revision): solo para cuentas revisoras.
 * Recorre el banco por curso → habilidad → ejercicio, y cada pregunta se
 * responde con las mismas piezas que ve el niño en PracticeScreen
 * (ilustración, alternativas, pista, tarjeta de feedback, estrategia al
 * fallar). Responder no guarda nada; los comentarios sí.
 */
export function ReviewScreen({ onExit }: Props) {
  const { lang } = useLang();
  const [grade, setGrade] = useState(1);
  const [skills, setSkills] = useState<ReviewSkill[] | null>(null);
  const [view, setView] = useState<View>({ kind: "skills" });
  const [list, setList] = useState<ReviewExerciseSummary[]>([]);
  const [pending, setPending] = useState<ReviewPendingComment[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (view.kind !== "skills") return;
    // Si se cambia de curso antes de que llegue la respuesta anterior, esa
    // respuesta ya no sirve: sin esto, una lista vieja pisaba a la nueva.
    let current = true;
    setSkills(null);
    endpoints
      .reviewSkills(grade)
      .then((r) => current && setSkills(r.skills))
      .catch(() => current && setError(true));
    return () => {
      current = false;
    };
  }, [grade, view.kind]);

  async function openSkill(skill: SkillRef, exerciseId?: string) {
    try {
      const r = await endpoints.reviewSkillExercises(skill.id);
      setList(r.exercises);
      const index = Math.max(0, exerciseId ? r.exercises.findIndex((e) => e.id === exerciseId) : 0);
      setView({ kind: "exercise", skill, index });
    } catch {
      setError(true);
    }
  }

  async function openPending() {
    setView({ kind: "pending" });
    setPending(null);
    try {
      setPending(await endpoints.reviewPendingComments());
    } catch {
      setError(true);
    }
  }

  if (error) {
    return (
      <main className="screen">
        <p className="error">{t(lang, "authErrGeneric")}</p>
        <button className="btn-primary" type="button" onClick={() => { setError(false); setView({ kind: "skills" }); }}>
          {t(lang, "reviewBackToGrades")}
        </button>
      </main>
    );
  }

  if (view.kind === "exercise") {
    return (
      <ReviewExerciseView
        key={list[view.index]?.id}
        skillName={localize(lang, view.skill.name, view.skill.nameEn)}
        oaCode={view.skill.oaCode}
        list={list}
        index={view.index}
        onIndex={(index) => setView({ ...view, index })}
        onBack={() => setView({ kind: "skills" })}
        onCommentsChanged={(id, n) => setList((l) => l.map((e) => (e.id === id ? { ...e, openComments: n } : e)))}
      />
    );
  }

  if (view.kind === "pending") {
    return (
      <main className="screen review-screen">
        <button className="btn-secondary" type="button" onClick={() => setView({ kind: "skills" })}>
          {t(lang, "reviewBackToGrades")}
        </button>
        <h1>{t(lang, "reviewPendingList")}</h1>
        {pending === null && <p>{t(lang, "loading")}</p>}
        {pending?.length === 0 && <p className="hint-text">{t(lang, "reviewNoPending")}</p>}
        <ul className="review-list">
          {pending?.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="review-row"
                onClick={() => {
                  setGrade(c.exercise.skill.grade);
                  void openSkill({ id: c.exercise.skill.id, name: c.exercise.skill.name, nameEn: null, oaCode: null }, c.exercise.id);
                }}
              >
                <span className="review-meta">
                  {c.exercise.skill.grade}° · {c.exercise.skill.name} · {c.exercise.theme ?? t(lang, "reviewNeutral")}
                </span>
                <span className="review-prompt">{c.exercise.prompt}</span>
                <span className="review-comment-text">💬 {c.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <main className="screen review-screen">
      <h1>{t(lang, "reviewTitle")}</h1>
      <p className="hint-text">{t(lang, "reviewIntro")}</p>
      <div className="review-grades" role="tablist">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={g === grade}
            className={`review-grade${g === grade ? " selected" : ""}`}
            onClick={() => setGrade(g)}
          >
            {g}° {t(lang, "reviewGrade")}
          </button>
        ))}
      </div>
      {skills === null && <p>{t(lang, "loading")}</p>}
      <ul className="review-list">
        {skills?.map((s) => (
          <li key={s.id}>
            <button type="button" className="review-row" onClick={() => void openSkill(s)}>
              <span className="review-prompt">{localize(lang, s.name, s.nameEn)}</span>
              <span className="review-meta">
                {s.oaCode ?? ""} · {s.exerciseCount} {t(lang, "reviewExercises")}
                {s.openComments > 0 && ` · 💬 ${s.openComments} ${t(lang, "reviewOpenComments")}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn-secondary" type="button" onClick={() => void openPending()}>
        {t(lang, "reviewPendingList")}
      </button>
      <button className="btn-secondary" type="button" onClick={onExit}>
        {t(lang, "reviewExit")}
      </button>
    </main>
  );
}

function ReviewExerciseView({
  skillName,
  oaCode,
  list,
  index,
  onIndex,
  onBack,
  onCommentsChanged,
}: {
  skillName: string;
  oaCode: string | null;
  list: ReviewExerciseSummary[];
  index: number;
  onIndex: (i: number) => void;
  onBack: () => void;
  onCommentsChanged: (exerciseId: string, openComments: number) => void;
}) {
  const { lang } = useLang();
  const summary = list[index];
  const [exercise, setExercise] = useState<ReviewExercise | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<ReviewAnswerResult | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentErr, setCommentErr] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  // Solo al cambiar de pregunta: actualizar el contador de comentarios de la
  // lista crea un objeto nuevo y no debe volver a cargar el ejercicio.
  const summaryId = summary?.id;
  useEffect(() => {
    if (!summaryId) return;
    endpoints
      .reviewExercise(summaryId)
      .then(setExercise)
      .catch(() => setLoadErr(true));
  }, [summaryId]);

  function reset() {
    setSelected(null);
    setResult(null);
    setShowHint(false);
  }

  async function answer(optionId: string) {
    if (!exercise) return;
    setSelected(optionId);
    try {
      const res = await endpoints.reviewAnswer(exercise.id, optionId);
      setResult(res);
      if (res.isCorrect) {
        const variants = FEEDBACK_CORRECT_VARIANTS[lang];
        setFeedbackText(res.feedback ? localize(lang, res.feedback, res.feedbackEn) : variants[Math.floor(Math.random() * variants.length)]!);
      } else {
        setFeedbackText(wrongFeedbackText(lang, res));
      }
    } catch {
      setSelected(null);
      setLoadErr(true);
    }
  }

  async function saveComment() {
    if (!exercise || !draft.trim()) return;
    setCommentErr(false);
    try {
      const c = await endpoints.reviewAddComment(exercise.id, draft.trim());
      const comments = [...exercise.comments, c];
      setExercise({ ...exercise, comments });
      setDraft("");
      onCommentsChanged(exercise.id, comments.filter((x) => !x.resolvedAt).length);
    } catch {
      setCommentErr(true);
    }
  }

  async function deleteComment(id: string) {
    if (!exercise) return;
    try {
      await endpoints.reviewDeleteComment(id);
      const comments = exercise.comments.filter((c) => c.id !== id);
      setExercise({ ...exercise, comments });
      onCommentsChanged(exercise.id, comments.filter((x) => !x.resolvedAt).length);
    } catch {
      setCommentErr(true);
    }
  }

  const nav = (
    <div className="review-nav">
      <button className="btn-secondary review-back" type="button" onClick={onBack}>
        {t(lang, "reviewBackToSkills")}
      </button>
      <button className="btn-secondary" type="button" disabled={index === 0} onClick={() => onIndex(index - 1)}>
        {t(lang, "reviewPrev")}
      </button>
      <span className="review-meta">
        {index + 1} / {list.length}
      </span>
      <button className="btn-secondary" type="button" disabled={index >= list.length - 1} onClick={() => onIndex(index + 1)}>
        {t(lang, "reviewNext")}
      </button>
    </div>
  );

  if (loadErr) {
    return (
      <main className="screen review-screen">
        {nav}
        <p className="error">{t(lang, "authErrGeneric")}</p>
      </main>
    );
  }
  if (!exercise || !summary) {
    return (
      <main className="screen review-screen" aria-busy="true">
        {nav}
        <p>{t(lang, "loading")}</p>
      </main>
    );
  }

  const options = exercise.options;
  const answered = result !== null;
  const correctOption = options.find((o) => o.id === result?.correctOptionId);

  return (
    <main className="screen review-screen">
      {nav}
      <label className="review-jump">
        {t(lang, "reviewJumpTo")}
        <select value={index} onChange={(e) => onIndex(Number(e.target.value))}>
          {list.map((e, i) => (
            <option key={e.id} value={i}>
              {i + 1}. {e.theme ?? t(lang, "reviewNeutral")} · {e.prompt.slice(0, 60)}
              {e.openComments > 0 ? ` 💬${e.openComments}` : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="skill-name-chip">{skillName}</p>
      <p className="review-meta">
        {exercise.skill.grade}° · {oaCode ?? exercise.skill.oaCode ?? ""} · {t(lang, "reviewLevel")} {exercise.difficultyLevel} ·{" "}
        {exercise.theme ?? t(lang, "reviewNeutral")}
      </p>

      {/* Desde acá, lo mismo que ve el niño en PracticeScreen. */}
      <div className="focus-frame">
        <span className="fc-bl" aria-hidden="true" />
        <span className="fc-br" aria-hidden="true" />
        <ExerciseIllustration image={exercise.image} visual={exercise.visual} interest={interestByKey(exercise.theme ?? undefined)} options={options} />
        <h1>{localize(lang, exercise.prompt, exercise.promptEn)}</h1>
        {!answered && speechSupported && (
          <button className="btn-listen" type="button" onClick={() => speak(localize(lang, exercise.prompt, exercise.promptEn), lang)}>
            {t(lang, "listenAgain")}
          </button>
        )}
        <div className="form">
          {options.map((opt) => {
            let cls = "option-btn";
            if (result && opt.id === selected) cls += result.isCorrect ? " correct" : " incorrect";
            return (
              <button key={opt.id} className={cls} type="button" disabled={answered} onClick={() => void answer(opt.id)}>
                {localize(lang, opt.label, opt.labelEn)}
              </button>
            );
          })}
        </div>
        {!answered && !showHint && (
          <button className="btn-secondary" type="button" onClick={() => setShowHint(true)}>
            {t(lang, "needHint")}
          </button>
        )}
        {!answered && showHint && exercise.procedureNote && (
          <p className="hint-text">
            {t(lang, "hintLabel")}: {localize(lang, exercise.procedureNote, exercise.procedureNoteEn)}
          </p>
        )}
        {result && (
          <div className={`feedback-card ${result.isCorrect ? "correct" : "retry"}`} aria-live="polite">
            <span className="icon" aria-hidden="true">{result.isCorrect ? "✓" : "↻"}</span>
            <span>{feedbackText}</span>
          </div>
        )}
        {result && !result.isCorrect && exercise.procedureNote && !result.solution && (
          <p className="hint-text strategy-note">
            {t(lang, "strategyLabel")}: {localize(lang, exercise.procedureNote, exercise.procedureNoteEn)}
          </p>
        )}
        {result?.solution && <WorkedSolution lang={lang} steps={result.solution} wrongStep={result.wrongStep} open={!result.isCorrect} />}
      </div>

      {/* Solo para la revisora: lo que el niño no ve. */}
      {result && (
        <div className="review-panel">
          {!result.isCorrect && correctOption && (
            <p>
              <b>{t(lang, "reviewCorrectWas")}:</b> {localize(lang, correctOption.label, correctOption.labelEn)}
            </p>
          )}
          {result.allWrongSteps && result.allWrongSteps.length > 0 && (
            <div>
              <p>
                <b>{t(lang, "reviewWrongSteps")}</b>
              </p>
              <ul className="review-comments">
                {result.allWrongSteps.map((w) => (
                  <li key={w.label}>
                    <span>
                      <b>{localize(lang, w.label, w.labelEn)}</b> · {t(lang, "findStepStep")} {w.wrongStep.step + 1}: {localize(lang, w.wrongStep.es, w.wrongStep.en)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="review-nav">
            <button className="btn-secondary" type="button" onClick={reset}>
              {t(lang, "reviewRetry")}
            </button>
            <button className="btn-primary" type="button" disabled={index >= list.length - 1} onClick={() => onIndex(index + 1)}>
              {t(lang, "reviewNext")}
            </button>
          </div>
        </div>
      )}

      <section className="review-panel">
        <h2>{t(lang, "reviewCommentsTitle")}</h2>
        <ul className="review-comments">
          {exercise.comments.map((c) => (
            <li key={c.id}>
              <span>💬 {c.text}</span>
              <span className="review-meta">
                {new Date(c.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "es-CL")}
                {c.resolvedAt ? " · ✓" : ""}
              </span>
              <button className="review-link" type="button" onClick={() => void deleteComment(c.id)}>
                {t(lang, "reviewCommentDelete")}
              </button>
            </li>
          ))}
        </ul>
        <textarea
          className="review-textarea"
          rows={3}
          value={draft}
          maxLength={2000}
          placeholder={t(lang, "reviewCommentPlaceholder")}
          aria-label={t(lang, "reviewCommentsTitle")}
          onChange={(e) => setDraft(e.target.value)}
        />
        {commentErr && <p className="error">{t(lang, "reviewCommentErr")}</p>}
        <button className="btn-primary" type="button" disabled={!draft.trim()} onClick={() => void saveComment()}>
          {t(lang, "reviewCommentSave")}
        </button>
      </section>
    </main>
  );
}
