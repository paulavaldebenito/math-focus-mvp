import { useEffect } from "react";
import { BrickCompanionAvatar } from "./BrickCompanionAvatar.js";
import { Confetti } from "./Confetti.js";
import type { Companion } from "../lib/companions.js";

interface Props {
  companion: Companion;
  message: string;
  onDone: () => void;
  /** Cuánto tiempo queda visible antes de cerrarse sola, en ms. */
  durationMs?: number;
}

/**
 * Momento destacado de la mascota — grande, festejante, "de vez en cuando"
 * (ver PracticeScreen: solo en rachas de 3 aciertos, nunca en cada acierto).
 * Puramente decorativo: no cambia nivel, estrellas ni ningún dato ya
 * registrado. Se cierra sola pasado `durationMs` — nunca requiere que el
 * niño la cierre a mano — y toda la capa tiene pointer-events: none (ver
 * App.css) para que jamás bloquee el botón "Continuar" que sigue debajo.
 * La animación de aparición respeta prefers-reduced-motion igual que el
 * resto de la app (ver la regla global en index.css); Confetti además hace
 * su propio chequeo de esa preferencia antes de generar piezas.
 */
export function MascotMoment({ companion, message, onDone, durationMs = 1700 }: Props) {
  useEffect(() => {
    const id = setTimeout(onDone, durationMs);
    return () => clearTimeout(id);
    // Solo se arma una vez al aparecer — un cambio de onDone (nueva función
    // en cada render del padre) no debe reiniciar el conteo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mascot-moment-layer" aria-hidden="true">
      <Confetti />
      <div className="mascot-moment-card">
        <BrickCompanionAvatar companion={companion} mood="happy" size="lg" />
        <p className="mascot-moment-message">{message}</p>
      </div>
    </div>
  );
}
