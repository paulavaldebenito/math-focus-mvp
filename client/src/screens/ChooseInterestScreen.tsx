import { useState } from "react";
import * as endpoints from "../api/endpoints.js";
import { INTERESTS, MAX_INTERESTS, interestName } from "../lib/interests.js";
import { t, useLang } from "../lib/i18n.js";
import { playConfirm, playDeselect, playSelect } from "../lib/sound.js";

interface Props {
  childId: string;
  /** Intereses ya elegidos (al editar desde Home). */
  initial?: string[];
  onDone: (selection: string[]) => void;
}

export function ChooseInterestScreen({ childId, initial = [], onDone }: Props) {
  const { lang } = useLang();
  const [selected, setSelected] = useState<string[]>(initial);
  const [submitting, setSubmitting] = useState(false);
  const full = selected.length >= MAX_INTERESTS;

  function toggle(key: string) {
    setSelected((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : current.length < MAX_INTERESTS ? [...current, key] : current,
    );
  }

  async function handleFinish() {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      await endpoints.setInterests(childId, selected);
    } catch {
      // Elegir intereses no debe bloquear el resto de la experiencia — si
      // falla el guardado, igual se avanza; se puede volver a elegir desde Inicio.
    } finally {
      setSubmitting(false);
      onDone(selected);
    }
  }

  return (
    <main className="screen">
      <h1>{t(lang, "chooseInterestTitle")}</h1>
      <p className="hint-text">
        {t(lang, "chooseInterestHint")} · {selected.length}/{MAX_INTERESTS}
      </p>
      <div className="choice-grid">
        {INTERESTS.map((i) => {
          const isSelected = selected.includes(i.key);
          return (
            <button
              key={i.key}
              type="button"
              className={`choice-card ${isSelected ? "selected" : ""}`}
              aria-pressed={isSelected}
              disabled={full && !isSelected}
              onClick={() => {
                if (isSelected) playDeselect();
                else playSelect();
                toggle(i.key);
              }}
            >
              <span className="emoji">{i.emoji}</span>
              {interestName(i, lang)}
            </button>
          );
        })}
      </div>
      <button
        className="btn-primary"
        type="button"
        disabled={selected.length === 0 || submitting}
        onClick={() => {
          playConfirm();
          void handleFinish();
        }}
      >
        {t(lang, "chooseInterestContinue")}
      </button>
    </main>
  );
}
