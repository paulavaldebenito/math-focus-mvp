import type { ExerciseVisualDescriptor } from "../api/types.js";

const DEFAULT_EMOJI = "🔵";

interface Props {
  visual: ExerciseVisualDescriptor;
}

/**
 * Representación concreta antes que simbólica (principio "Representar" del
 * currículum): grupos de objetos a combinar, o un grupo del que se quita una
 * cantidad — con emoji, al estilo de math-focus-app. Decorativa a propósito
 * (aria-hidden): el enunciado en texto y la narración por voz siguen siendo
 * el contenido accesible principal.
 */
export function ExerciseVisual({ visual }: Props) {
  const emoji = visual.emoji ?? DEFAULT_EMOJI;

  if (visual.kind === "combine") {
    return (
      <div className="pictorial-row" aria-hidden="true">
        {Array.from({ length: visual.a }, (_, i) => (
          <span key={`a${i}`} className="pictorial-icon">
            {emoji}
          </span>
        ))}
        <span className="pictorial-op">+</span>
        {Array.from({ length: visual.b }, (_, i) => (
          <span key={`b${i}`} className="pictorial-icon">
            {emoji}
          </span>
        ))}
        <span className="pictorial-eq">= ?</span>
      </div>
    );
  }

  return (
    <div className="pictorial-row" aria-hidden="true">
      {Array.from({ length: visual.total }, (_, i) => (
        <span key={i} className={`pictorial-icon ${i >= visual.total - visual.removed ? "removed" : ""}`}>
          {emoji}
        </span>
      ))}
      <span className="pictorial-eq">= ?</span>
    </div>
  );
}
