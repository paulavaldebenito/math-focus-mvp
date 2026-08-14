import type { ReactNode } from "react";
import type { ExerciseVisualDescriptor } from "../api/types.js";

const DEFAULT_EMOJI = "🔵";
/** Sobre este umbral, un objeto por unidad deja de ser legible (2° básico
 * llega hasta ~90) — se cambia a bloques de decena + unidad, la misma
 * estrategia que ya enseñan las pistas ("separa decenas y unidades"). Nunca
 * se activa para 1° básico (tope 20), así que su representación no cambia. */
const BLOCK_THRESHOLD = 20;

interface Props {
  visual: ExerciseVisualDescriptor;
}

/**
 * Renderiza una cantidad como objetos individuales (n ≤ 20) o como bloques
 * de decena ("10") + unidades sueltas (n > 20). `removedCount`, si se pasa,
 * marca esa cantidad como tachada — descompuesta en su propia decena/unidad
 * para que lo tachado nunca cruce una columna (coherente con "sin reserva").
 */
function renderQuantity(n: number, removed: number, emoji: string, keyPrefix: string): ReactNode {
  if (n > BLOCK_THRESHOLD) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const removedTens = Math.floor(removed / 10);
    const removedOnes = removed % 10;
    return (
      <>
        {Array.from({ length: tens }, (_, i) => (
          <span key={`${keyPrefix}-t${i}`} className={`pictorial-ten ${i >= tens - removedTens ? "removed" : ""}`}>
            10
          </span>
        ))}
        {Array.from({ length: ones }, (_, i) => (
          <span key={`${keyPrefix}-o${i}`} className={`pictorial-icon ${i >= ones - removedOnes ? "removed" : ""}`}>
            {emoji}
          </span>
        ))}
      </>
    );
  }

  return Array.from({ length: n }, (_, i) => (
    <span key={`${keyPrefix}-${i}`} className={`pictorial-icon ${i >= n - removed ? "removed" : ""}`}>
      {emoji}
    </span>
  ));
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
        {renderQuantity(visual.a, 0, emoji, "a")}
        <span className="pictorial-op">+</span>
        {renderQuantity(visual.b, 0, emoji, "b")}
        <span className="pictorial-eq">= ?</span>
      </div>
    );
  }

  if (visual.kind === "takeaway") {
    return (
      <div className="pictorial-row" aria-hidden="true">
        {renderQuantity(visual.total, visual.removed, emoji, "t")}
        <span className="pictorial-eq">= ?</span>
      </div>
    );
  }

  return (
    <div className="pictorial-row" aria-hidden="true">
      {renderQuantity(visual.a, 0, emoji, "a")}
      <span className="pictorial-op">vs</span>
      {renderQuantity(visual.b, 0, emoji, "b")}
    </div>
  );
}
