import { useMemo, useState } from "react";
import { randomMovement } from "../lib/pauses.js";
import { t, type Lang } from "../lib/i18n.js";

interface Props {
  lang: Lang;
  onDone: () => void;
}

export function MovementPause({ lang, onDone }: Props) {
  const exercise = useMemo(() => randomMovement(), []);
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
      <p className="hint-text">{t(lang, "pauseCheckSpace")}</p>
      <div className="movement-icon">{exercise.icon}</div>
      <p className="movement-instruction">{instruction}</p>

      {!seated && (
        <button className="btn-secondary" type="button" onClick={() => setSeated(true)}>
          {t(lang, "pauseSkip")}
        </button>
      )}

      <button className="btn-primary" type="button" onClick={onDone}>
        {t(lang, "pauseDone")}
      </button>
    </div>
  );
}
