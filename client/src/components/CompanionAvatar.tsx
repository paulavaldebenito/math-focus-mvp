import type { Companion } from "../lib/companions.js";

export type CompanionMood = "idle" | "happy" | "encourage";

interface Props {
  companion: Companion;
  mood?: CompanionMood;
}

/** La mascota acompaña visualmente la sesión — nunca reacciona con enojo o
 * decepción ante un error, solo neutra o alentadora (regla: nunca leer un
 * error como fracaso). */
export function CompanionAvatar({ companion, mood = "idle" }: Props) {
  const moodClass = mood === "happy" ? "mood-happy" : mood === "encourage" ? "mood-encourage" : "mood-idle-pulse";
  return (
    <div
      key={mood}
      className={`capy-avatar-sm ${moodClass}`}
      style={{ background: companion.bg, borderColor: companion.color }}
      aria-hidden="true"
    >
      {companion.emoji}
    </div>
  );
}
