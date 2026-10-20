import type { Companion } from "../lib/companions.js";
import { mascotImageForCompanion } from "../lib/mascotImages.js";

export type CompanionMood = "idle" | "happy" | "encourage";

interface Props {
  companion: Companion;
  mood?: CompanionMood;
  /** Tamaño del contenedor — "sm" reusa .capy-avatar-sm (chip inline de
   * PracticeScreen), "lg" reusa .capy-avatar (avatar grande de HomeScreen).
   * No forma parte del contrato original de CompanionAvatar, se agrega
   * como opcional para no romper los call-sites existentes. */
  size?: "sm" | "lg";
}

/** La mascota acompaña visualmente la sesión — nunca reacciona con enojo o
 * decepción ante un error, solo neutra o alentadora (regla: nunca leer un
 * error como fracaso). Usa la foto de la mascota (estilo "figura de
 * bloques"), recortada en círculo — una foto distinta por estado de ánimo,
 * no solo una animación sobre la misma foto, para que el cambio se note
 * también en la cara del personaje. */
export function BrickCompanionAvatar({ companion, mood = "idle", size = "sm" }: Props) {
  const moodClass = mood === "happy" ? "mood-happy" : mood === "encourage" ? "mood-encourage" : "mood-idle-pulse";
  const sizeClass = size === "lg" ? "capy-avatar" : "capy-avatar-sm";

  return (
    <div key={mood} className={`${sizeClass} brick-companion ${moodClass}`} aria-hidden="true">
      <img src={mascotImageForCompanion(companion.key, mood)} alt="" className="brick-companion-img" />
    </div>
  );
}
