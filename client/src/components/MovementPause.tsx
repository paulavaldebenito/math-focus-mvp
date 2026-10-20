import { useMemo, useState } from "react";
import { randomMovement } from "../lib/pauses.js";
import { t, type Lang } from "../lib/i18n.js";
import { BrickCompanionAvatar } from "./BrickCompanionAvatar.js";
import type { Companion } from "../lib/companions.js";

interface Props {
  lang: Lang;
  companion: Companion;
  /** Recibe la clave del ejercicio hecho, para no repetirlo en la sesión. */
  onDone: (exerciseKey: string) => void;
  /** Claves ya usadas en esta sesión — se elige otro ejercicio. */
  exclude?: readonly string[];
  /** Curso del niño: elige un movimiento matemático de su nivel. */
  grade?: number;
}

export function MovementPause({ lang, companion, onDone, exclude = [], grade }: Props) {
  // Solo al montar: la pausa en curso no cambia aunque el padre re-renderice.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const exercise = useMemo(() => randomMovement(exclude, Math.random, grade), []);
  const [seated, setSeated] = useState(false);

  const instruction = seated
    ? lang === "en"
      ? exercise.seatedEn
      : exercise.seatedEs
    : lang === "en"
      ? exercise.en
      : exercise.es;

  return (
    <div className="pause-body">
      {/* La mascota hace el ejercicio junto al niño: su animación imita el
          movimiento (saltar, marchar, girar…), más suave si lo hace sentado/a.
          Decorativa (aria-hidden en el avatar); con "reducir movimiento"
          activado queda quieta (regla global de index.css). */}
      <div
        className={`mascot-exercise mascot-motion-${exercise.motion}${seated ? " seated" : ""}`}
        data-motion={exercise.motion}
      >
        <BrickCompanionAvatar companion={companion} mood="happy" />
        <span className="mascot-exercise-shadow" aria-hidden="true" />
      </div>
      <p className="hint-text">{t(lang, "pauseCheckSpace")}</p>
      <div className="movement-icon">{exercise.icon}</div>
      <p className="movement-instruction">{instruction}</p>

      {!seated && (
        <button className="btn-secondary" type="button" onClick={() => setSeated(true)}>
          {t(lang, "pauseSkip")}
        </button>
      )}

      <button className="btn-primary" type="button" onClick={() => onDone(exercise.key)}>
        {t(lang, "pauseDone")}
      </button>
    </div>
  );
}
