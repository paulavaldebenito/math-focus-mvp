import { useState } from "react";
import * as endpoints from "../api/endpoints.js";
import { COMPANIONS, companionByKey, companionName } from "../lib/companions.js";
import { t, useLang } from "../lib/i18n.js";
import { BrickCompanionAvatar } from "../components/BrickCompanionAvatar.js";
import { playConfirm, playSelect } from "../lib/sound.js";

interface Props {
  childId: string;
  onDone: () => void;
  /** Presente cuando se reabre esta pantalla para EDITAR una mascota que ya
   * existe (desde "Cambiar tu mascota o su nombre" en Inicio) — precarga la
   * selección y el nombre en vez de arrancar en blanco. Ausente en la
   * elección inicial de un perfil nuevo. */
  initialCompanion?: string | null;
  initialMascotName?: string | null;
  /** Nombre que el niño ya le había puesto a cada mascota (por clave): al
   * elegir otra, se recupera el suyo en vez de empezar de cero. */
  initialMascotNames?: Record<string, string>;
}

export function ChooseCompanionScreen({
  childId,
  onDone,
  initialCompanion,
  initialMascotName,
  initialMascotNames = {},
}: Props) {
  const { lang } = useLang();
  const [selected, setSelected] = useState<string | null>(initialCompanion ?? null);
  // Siempre parte con ALGÚN nombre no vacío (el propio si ya tenía, si no el
  // default del personaje elegido) — así nunca se puede enviar vacío, y el
  // niño solo edita si quiere ponerle otro nombre.
  const [mascotName, setMascotNameInput] = useState<string>(
    initialMascotName?.trim() || (initialCompanion ? companionName(companionByKey(initialCompanion), lang) : ""),
  );
  const [submitting, setSubmitting] = useState(false);
  // Cada mascota tiene su propio nombre: lo que el niño escribe se recuerda
  // por mascota mientras está en esta pantalla, así puede ir y volver entre
  // ellas sin perderlo.
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() => ({
    ...initialMascotNames,
    ...(initialCompanion && initialMascotName?.trim() ? { [initialCompanion]: initialMascotName.trim() } : {}),
  }));

  function handleSelect(key: string) {
    playSelect();
    const drafts = selected && mascotName.trim() ? { ...draftNames, [selected]: mascotName } : draftNames;
    setDraftNames(drafts);
    setSelected(key);
    // El nombre que ya le había puesto a ESTA mascota; si nunca le puso uno,
    // el nombre por defecto del personaje.
    setMascotNameInput(drafts[key] ?? companionName(companionByKey(key), lang));
  }

  async function handleFinish() {
    if (!selected) return;
    const finalName = mascotName.trim() || companionName(companionByKey(selected), lang);
    setSubmitting(true);
    try {
      await endpoints.setCompanion(childId, selected);
      await endpoints.setMascotName(childId, finalName);
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
            onClick={() => handleSelect(c.key)}
          >
            <BrickCompanionAvatar companion={c} />
            {companionName(c, lang)}
          </button>
        ))}
      </div>

      {selected && (
        <div className="field">
          <label htmlFor="mascotName">{t(lang, "mascotNameLabel")}</label>
          <input
            id="mascotName"
            type="text"
            required
            maxLength={20}
            value={mascotName}
            placeholder={t(lang, "mascotNamePlaceholder")}
            onChange={(e) => setMascotNameInput(e.target.value)}
          />
        </div>
      )}

      <button
        className="btn-primary"
        type="button"
        disabled={!selected || !mascotName.trim() || submitting}
        onClick={() => {
          playConfirm();
          void handleFinish();
        }}
      >
        {t(lang, "chooseCompanionContinue")}
      </button>
    </main>
  );
}
