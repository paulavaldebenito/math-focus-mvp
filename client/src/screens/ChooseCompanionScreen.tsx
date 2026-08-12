import { useState } from "react";
import * as endpoints from "../api/endpoints.js";
import { COMPANIONS, companionName } from "../lib/companions.js";
import { t, useLang } from "../lib/i18n.js";

interface Props {
  childId: string;
  onDone: () => void;
}

export function ChooseCompanionScreen({ childId, onDone }: Props) {
  const { lang } = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFinish() {
    if (!selected) return;
    setSubmitting(true);
    try {
      await endpoints.setCompanion(childId, selected);
    } catch {
      // Elegir compañero no debe bloquear el resto de la experiencia — si
      // falla el guardado, igual se avanza; se puede volver a elegir después.
    } finally {
      setSubmitting(false);
      onDone();
    }
  }

  return (
    <main className="screen">
      <h1>{t(lang, "chooseCompanionTitle")}</h1>
      <div className="choice-grid">
        {COMPANIONS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`choice-card ${selected === c.key ? "selected" : ""}`}
            onClick={() => setSelected(c.key)}
          >
            <span className="emoji">{c.emoji}</span>
            {companionName(c, lang)}
          </button>
        ))}
      </div>
      <button className="btn-primary" type="button" disabled={!selected || submitting} onClick={() => void handleFinish()}>
        {t(lang, "chooseCompanionContinue")}
      </button>
    </main>
  );
}
