import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints.js";
import type { ChildEnrollment } from "../api/types.js";
import type { Lang } from "../lib/i18n.js";

const COPY = {
  es: {
    title: "🏫 Su curso en el colegio",
    intro: "Si la profesora te dio un código de curso, ingrésalo para que pueda ver su progreso y apoyarlo en clases.",
    code: "Código del curso",
    shareProgress: "Autorizo compartir con el colegio su progreso en la app (respuestas, temas y tiempo de práctica).",
    shareEmotions: "Además, autorizo que la profesora vea cómo se siente al practicar (sus emociones). Si no lo marcas, solo cuenta en el clima general del curso, sin su nombre.",
    join: "Vincular",
    linked: (cls: string, school: string) => `Vinculado a ${cls} · ${school}.`,
    emotionsOn: "La profesora puede ver sus emociones.",
    emotionsOff: "La profesora no ve sus emociones individuales.",
    toggleOn: "Permitir ver emociones",
    toggleOff: "Dejar de compartir emociones",
    leave: "Desvincular del curso",
    errNotFound: "No encontramos ese código. Revísalo con la profesora.",
    errGrade: (g: number) => `Ese código es de un curso de ${g}° básico y el perfil es de otro curso.`,
    errGeneric: "No se pudo completar. Intenta de nuevo.",
  },
  en: {
    title: "🏫 Their class at school",
    intro: "If the teacher gave you a class code, enter it so they can see your child’s progress and support them in class.",
    code: "Class code",
    shareProgress: "I agree to share their progress in the app with the school (answers, topics and practice time).",
    shareEmotions: "I also agree to let the teacher see how they feel while practicing (their feelings). If unchecked, they only count toward the overall class climate, without their name.",
    join: "Link",
    linked: (cls: string, school: string) => `Linked to ${cls} · ${school}.`,
    emotionsOn: "The teacher can see their feelings.",
    emotionsOff: "The teacher doesn’t see their individual feelings.",
    toggleOn: "Allow seeing feelings",
    toggleOff: "Stop sharing feelings",
    leave: "Unlink from class",
    errNotFound: "We couldn’t find that code. Check it with the teacher.",
    errGrade: (g: number) => `That code is for a grade ${g} class and this profile is in a different grade.`,
    errGeneric: "Couldn’t complete it. Please try again.",
  },
};

/**
 * Vincular al niño con su curso (specs/014). Unirse con el código ES el
 * consentimiento para compartir el progreso con el colegio (casilla
 * obligatoria); ver las emociones individuales es un consentimiento aparte,
 * opcional y revocable.
 */
export function ClassroomLink({ childId, lang }: { childId: string; lang: Lang }) {
  const c = COPY[lang];
  const [enrollment, setEnrollment] = useState<ChildEnrollment | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [progressOk, setProgressOk] = useState(false);
  const [emotionsOk, setEmotionsOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    endpoints
      .childEnrollment(childId)
      .then(setEnrollment)
      .catch(() => setEnrollment(null));
  }, [childId]);

  if (enrollment === undefined) return null;

  return (
    <section className="dash-section" aria-labelledby="classroom-link-title">
      <h2 id="classroom-link-title" className="dash-section-title">{c.title}</h2>
      {enrollment ? (
        <>
          <p>{c.linked(enrollment.classroomName, enrollment.schoolName)}</p>
          <p className="hint-text">{enrollment.shareEmotions ? c.emotionsOn : c.emotionsOff}</p>
          <div className="reflection-actions">
            <button
              className="btn-secondary"
              type="button"
              onClick={() =>
                endpoints
                  .setShareEmotions(childId, !enrollment.shareEmotions)
                  .then((r) => setEnrollment({ ...enrollment, shareEmotions: r.shareEmotions }))
                  .catch(() => setError(c.errGeneric))
              }
            >
              {enrollment.shareEmotions ? c.toggleOff : c.toggleOn}
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() =>
                endpoints
                  .leaveClassroom(childId)
                  .then(() => setEnrollment(null))
                  .catch(() => setError(c.errGeneric))
              }
            >
              {c.leave}
            </button>
          </div>
        </>
      ) : (
        <form
          className="school-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            endpoints
              .joinClassroom(childId, code.trim(), emotionsOk)
              .then(setEnrollment)
              .catch((err: { status?: number; body?: { classroomGrade?: number } }) =>
                setError(err.status === 404 ? c.errNotFound : err.status === 409 ? c.errGrade(err.body?.classroomGrade ?? 0) : c.errGeneric),
              );
          }}
        >
          <p className="hint-text">{c.intro}</p>
          <label>
            {c.code}
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="3B-XXXXX" required />
          </label>
          <label className="school-check">
            <input type="checkbox" checked={progressOk} onChange={(e) => setProgressOk(e.target.checked)} />
            <span>{c.shareProgress}</span>
          </label>
          <label className="school-check">
            <input type="checkbox" checked={emotionsOk} onChange={(e) => setEmotionsOk(e.target.checked)} />
            <span>{c.shareEmotions}</span>
          </label>
          <button className="btn-primary" type="submit" disabled={!progressOk || code.trim().length < 4}>
            {c.join}
          </button>
        </form>
      )}
      {error && <p className="error-text" role="alert">{error}</p>}
    </section>
  );
}
