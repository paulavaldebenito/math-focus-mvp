import { useState } from "react";
import { t, type Lang } from "../lib/i18n.js";
import { playConfirm, playSelect, playClick } from "../lib/sound.js";
import type { CheckInInput } from "../api/endpoints.js";
import { MATH_FACES, MOOD_FACES } from "../lib/moodFaces.js";


type Face = (typeof MOOD_FACES)[number] | (typeof MATH_FACES)[number];

function FaceScale({
  id,
  question,
  faces,
  value,
  onChange,
  lang,
}: {
  id: string;
  question: string;
  faces: readonly Face[];
  value: number | undefined;
  onChange: (v: number) => void;
  lang: Lang;
}) {
  const selected = faces.find((f) => f.value === value);
  return (
    <div className="checkin-question">
      <p id={id} className="checkin-question-text">
        {question}
      </p>
      <div className="checkin-faces" role="radiogroup" aria-labelledby={id}>
        {faces.map((f) => (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={value === f.value}
            aria-label={f[lang]}
            className={`checkin-face ${value === f.value ? "selected" : ""}`}
            onClick={() => {
              playSelect();
              onChange(f.value);
            }}
          >
            <span aria-hidden="true">{f.emoji}</span>
          </button>
        ))}
      </div>
      <p className="checkin-face-label" aria-hidden="true">
        {selected ? selected[lang] : " "}
      </p>
    </div>
  );
}

interface Props {
  lang: Lang;
  /** Con lo que respondió (al menos una de las dos), o null si saltó. */
  onDone: (answer: CheckInInput | null) => void;
}

/** Pregunta breve y opcional al empezar la práctica: ánimo y cómo se siente con las matemáticas. */
export function MoodCheckIn({ lang, onDone }: Props) {
  const [mood, setMood] = useState<number>();
  const [mathFeeling, setMathFeeling] = useState<number>();
  const answered = mood !== undefined || mathFeeling !== undefined;

  return (
    <div className="checkin">
      <div className="pause-card">
        <h1>{t(lang, "checkInTitle")}</h1>
        <p>{t(lang, "checkInHint")}</p>
      </div>
      <FaceScale
        id="checkin-mood"
        question={t(lang, "checkInMoodQuestion")}
        faces={MOOD_FACES}
        value={mood}
        onChange={setMood}
        lang={lang}
      />
      <FaceScale
        id="checkin-math"
        question={t(lang, "checkInMathQuestion")}
        faces={MATH_FACES}
        value={mathFeeling}
        onChange={setMathFeeling}
        lang={lang}
      />
      <button
        className="btn-primary"
        type="button"
        disabled={!answered}
        onClick={() => {
          playConfirm();
          onDone({ ...(mood !== undefined && { mood }), ...(mathFeeling !== undefined && { mathFeeling }) });
        }}
      >
        {t(lang, "checkInDone")}
      </button>
      <button
        className="btn-secondary"
        type="button"
        onClick={() => {
          playClick();
          onDone(null);
        }}
      >
        {t(lang, "checkInSkip")}
      </button>
    </div>
  );
}
