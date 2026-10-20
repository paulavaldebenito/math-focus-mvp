import type { EmojiPictographPublic } from "../api/types.js";
import { t, useLang } from "../lib/i18n.js";

/** Mismo retraso escalonado que ExerciseVisual: los dibujos aparecen uno tras otro. */
const POP_DELAY_STEP_MS = 35;
const POP_DELAY_MAX_MS = 350;

/**
 * Pictograma de 1.° y 2.° básico con emojis (1 dibujo = 1): una fila por
 * categoría, con su nombre en el idioma activo al lado — sin letras que
 * haya que buscar en una leyenda. Es la representación pictórica concreta
 * que corresponde a la etapa (COPISI): el niño cuenta 🍎 como manzanas.
 * El texto alternativo describe el gráfico; los emojis son decorativos.
 */
export function EmojiPictograph({ image }: { image: EmojiPictographPublic }) {
  const { lang } = useLang();
  return (
    <figure className="emoji-pictograph" role="img" aria-label={image.alt[lang]}>
      <div className="emoji-pictograph-rows" aria-hidden="true">
        {image.rows.map((row, r) => (
          <div className="emoji-pictograph-row" key={r}>
            {row.label && <span className="emoji-pictograph-label">{row.label[lang]}</span>}
            <span className="emoji-pictograph-icons">
              {Array.from({ length: row.count }, (_, i) => (
                <span
                  key={i}
                  className="pictorial-icon"
                  style={{ animationDelay: `${Math.min((r * 3 + i) * POP_DELAY_STEP_MS, POP_DELAY_MAX_MS)}ms` }}
                >
                  {row.emoji}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="emoji-pictograph-key">{t(lang, "pictographKey")}</figcaption>
    </figure>
  );
}
