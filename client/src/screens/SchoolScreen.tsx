import { useCallback, useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { DirectorDashboardData, SchoolMembership, StudentFileData, TeacherDashboardData } from "../api/types.js";
import { SCHOOL } from "../components/school/copy.js";
import { TeacherDashboard } from "../components/school/TeacherDashboard.js";
import { StudentFile } from "../components/school/StudentFile.js";
import { DirectorDashboard } from "../components/school/DirectorDashboard.js";
import { useLang } from "../lib/i18n.js";

type View =
  | { kind: "home" }
  | { kind: "class"; classroomId: string; data: TeacherDashboardData | null }
  | { kind: "student"; classroomId: string; data: StudentFileData | null }
  | { kind: "director"; schoolId: string; data: DirectorDashboardData | null };

interface Props {
  onExit: () => void;
  /** Se llama cuando la cuenta pasa a tener un rol escolar (para mostrar la entrada). */
  onBecameStaff?: () => void;
}

/**
 * Panel escolar (specs/014): crear el colegio o unirse con código, crear
 * cursos (código para las familias), y abrir el panel del curso, la ficha
 * de cada estudiante o el panel directivo.
 */
export function SchoolScreen({ onExit, onBecameStaff }: Props) {
  const { lang } = useLang();
  const c = SCHOOL[lang];
  const [schools, setSchools] = useState<SchoolMembership[] | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [error, setError] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [joinErr, setJoinErr] = useState(false);
  const [newClass, setNewClass] = useState<{ name: string; grade: number }>({ name: "", grade: 1 });

  const reload = useCallback(() => {
    endpoints
      .mySchools()
      .then(setSchools)
      .catch(() => setError(true));
  }, []);
  useEffect(reload, [reload]);

  const openClass = (classroomId: string) => {
    setView({ kind: "class", classroomId, data: null });
    endpoints
      .teacherDashboard(classroomId)
      .then((data) => setView({ kind: "class", classroomId, data }))
      .catch(() => setError(true));
  };
  const openStudent = (classroomId: string, childId: string) => {
    setView({ kind: "student", classroomId, data: null });
    endpoints
      .studentFile(classroomId, childId)
      .then((data) => setView({ kind: "student", classroomId, data }))
      .catch(() => setError(true));
  };
  const openDirector = (schoolId: string) => {
    setView({ kind: "director", schoolId, data: null });
    endpoints
      .directorDashboard(schoolId)
      .then((data) => setView({ kind: "director", schoolId, data }))
      .catch(() => setError(true));
  };

  const backBtn = (onClick: () => void) => (
    <button className="btn-secondary school-back" type="button" onClick={onClick}>
      {c.back}
    </button>
  );

  if (error) {
    return (
      <main className="screen school-screen">
        <p className="error-text" role="alert">{c.error}</p>
        {backBtn(() => {
          setError(false);
          setView({ kind: "home" });
          reload();
        })}
      </main>
    );
  }

  if (view.kind === "class") {
    const cls = schools?.flatMap((s) => s.classrooms).find((x) => x.id === view.classroomId);
    return (
      <main className="screen school-screen">
        {backBtn(() => setView({ kind: "home" }))}
        <h1>{cls?.name ?? view.data?.classroom.name}</h1>
        {view.data && <p className="school-code">{c.joinCodeShare(view.data.classroom.joinCode)}</p>}
        {view.data ? <TeacherDashboard data={view.data} lang={lang} onOpenStudent={(id) => openStudent(view.classroomId, id)} /> : <p>{c.loading}</p>}
      </main>
    );
  }

  if (view.kind === "student") {
    return (
      <main className="screen school-screen">
        {backBtn(() => openClass(view.classroomId))}
        {view.data ? <StudentFile classroomId={view.classroomId} data={view.data} lang={lang} /> : <p>{c.loading}</p>}
      </main>
    );
  }

  if (view.kind === "director") {
    return (
      <main className="screen school-screen">
        {backBtn(() => setView({ kind: "home" }))}
        <h1>{view.data ? c.directorTitle(view.data.school.name) : c.title}</h1>
        {view.data ? <DirectorDashboard data={view.data} lang={lang} /> : <p>{c.loading}</p>}
      </main>
    );
  }

  if (schools === null) {
    return (
      <main className="screen school-screen" aria-busy="true">
        <p>{c.loading}</p>
      </main>
    );
  }

  if (schools.length === 0) {
    return (
      <main className="screen school-screen">
        <h1>{c.setupTitle}</h1>
        <p className="hint-text">{c.setupIntro}</p>
        <form
          className="school-form"
          onSubmit={(e) => {
            e.preventDefault();
            endpoints
              .createSchool(schoolName.trim())
              .then(() => {
                onBecameStaff?.();
                reload();
              })
              .catch(() => setError(true));
          }}
        >
          <label>
            {c.schoolName}
            <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} minLength={2} maxLength={120} required />
          </label>
          <button className="btn-primary" type="submit" disabled={schoolName.trim().length < 2}>
            {c.createSchool}
          </button>
        </form>
        <form
          className="school-form"
          onSubmit={(e) => {
            e.preventDefault();
            setJoinErr(false);
            endpoints
              .joinSchool(staffCode.trim())
              .then(() => {
                onBecameStaff?.();
                reload();
              })
              .catch(() => setJoinErr(true));
          }}
        >
          <label>
            {c.staffCodeLabel}
            <input value={staffCode} onChange={(e) => setStaffCode(e.target.value.toUpperCase())} placeholder="COL-XXXXX" required />
          </label>
          {joinErr && <p className="error-text" role="alert">{c.joinErr}</p>}
          <button className="btn-secondary" type="submit" disabled={staffCode.trim().length < 4}>
            {c.joinSchool}
          </button>
        </form>
        <button className="btn-secondary" type="button" onClick={onExit}>
          {c.exit}
        </button>
      </main>
    );
  }

  return (
    <main className="screen school-screen">
      <h1>{c.title}</h1>
      {schools.map((s) => (
        <section key={s.schoolId} className="dash-section">
          <h2 className="dash-section-title">
            🏫 {s.schoolName} <span className="hint-text">· {s.role === "director" ? c.roleDirector : c.roleTeacher}</span>
          </h2>
          {s.staffCode && <p className="school-code">{c.staffCodeShare(s.staffCode)}</p>}
          {s.role === "director" && (
            <button className="btn-primary" type="button" onClick={() => openDirector(s.schoolId)}>
              {c.openDirector}
            </button>
          )}
          <h3 className="dash-subtitle">{c.classrooms}</h3>
          {s.classrooms.length === 0 ? (
            <p className="hint-text">{c.noClassrooms}</p>
          ) : (
            <ul className="review-list">
              {s.classrooms.map((cl) => (
                <li key={cl.id}>
                  <button type="button" className="review-row" onClick={() => openClass(cl.id)}>
                    <span className="review-prompt">
                      {cl.name} · {c.gradeN(cl.grade)}
                    </span>
                    <span className="review-meta">
                      {c.studentsN(cl.students)} · {c.joinCodeShare(cl.joinCode)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="school-form school-form-inline"
            onSubmit={(e) => {
              e.preventDefault();
              endpoints
                .createClassroom(s.schoolId, newClass.name.trim(), newClass.grade)
                .then(() => {
                  setNewClass({ name: "", grade: newClass.grade });
                  reload();
                })
                .catch(() => setError(true));
            }}
          >
            <label>
              {c.classroomName}
              <input value={newClass.name} onChange={(e) => setNewClass({ ...newClass, name: e.target.value })} maxLength={40} required />
            </label>
            <label>
              {c.grade}
              <select value={newClass.grade} onChange={(e) => setNewClass({ ...newClass, grade: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g}>
                    {c.gradeN(g)}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-secondary" type="submit" disabled={!newClass.name.trim()}>
              {c.createClassroom}
            </button>
          </form>
        </section>
      ))}
      <button className="btn-secondary" type="button" onClick={onExit}>
        {c.exit}
      </button>
    </main>
  );
}
