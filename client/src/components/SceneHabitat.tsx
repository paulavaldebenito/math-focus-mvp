import type { Companion } from "../lib/companions.js";
import { BrickCompanionAvatar } from "./BrickCompanionAvatar.js";

interface Props {
  companion: Companion;
  totalStars: number;
}

/** Umbrales de estrellas para cada regalo — arbitrarios, no hay ningún
 * hito ya definido en el dominio. Fáciles de ajustar. El progreso es
 * siempre absoluto (estrellas propias del niño): nunca se compara entre
 * hermanos ni se muestra un ranking. */
const STAR_THRESHOLDS = [3, 6, 10, 15, 20] as const;

/** Cada mascota "recibe" un tipo de regalo propio a medida que el niño
 * acumula estrellas — capi flores, búho ramitas, zorro hojitas cafés,
 * conejo zanahorias. Le da identidad a cada especie en vez de un mismo
 * set genérico de decoraciones para todas. */
function GiftIcon({ speciesKey }: { speciesKey: string }) {
  if (speciesKey === "buho") return <Twig />;
  if (speciesKey === "zorro") return <Leaf />;
  if (speciesKey === "conejo") return <Carrot />;
  return <span className="gift-emoji">🌸</span>;
}

/** Mascota + fila de regalos que se van sumando a medida que el niño
 * acumula estrellas — se ve claramente cuántos lleva. La mascota en sí
 * sigue siendo la foto de BrickCompanionAvatar — esto es aditivo, nunca
 * le cambia el humor. */
export function SceneHabitat({ companion, totalStars }: Props) {
  const unlockedCount = STAR_THRESHOLDS.filter((s) => totalStars >= s).length;

  return (
    <div className="scene-habitat" aria-hidden="true">
      <BrickCompanionAvatar companion={companion} size="lg" />

      {unlockedCount > 0 && (
        <div className="scene-gifts">
          <div className="scene-gifts-row">
            {Array.from({ length: unlockedCount }, (_, i) => (
              <div key={i} className="scene-gift scene-pop">
                <GiftIcon speciesKey={companion.key} />
              </div>
            ))}
          </div>
          <span className="scene-gifts-count">×{unlockedCount}</span>
        </div>
      )}
    </div>
  );
}

/** Ramita — regalo del búho. */
function Twig() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <path d="M 7 19 L 16 9" stroke="#8B6B3D" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 11 15 L 6 12" stroke="#8B6B3D" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M 13 12 L 18 8" stroke="#8B6B3D" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** Hojita café — regalo del zorro. */
function Leaf() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <g transform="rotate(-20 12 12)">
        <ellipse cx="12" cy="12" rx="7.5" ry="5" fill="#9C6B3E" stroke="rgba(42,33,24,0.2)" strokeWidth="0.6" />
        <path d="M 6 12 L 18 12" stroke="rgba(42,33,24,0.35)" strokeWidth="0.6" />
      </g>
    </svg>
  );
}

/** Zanahoria — regalo del conejo. */
function Carrot() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <path d="M 8 8 L 16 8 L 12 21 Z" fill="#E8862E" stroke="rgba(42,33,24,0.2)" strokeWidth="0.6" />
      <path
        d="M 9.5 8 L 8 2 M 12 8 L 12 1 M 14.5 8 L 16 2"
        stroke="var(--success-dark)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
