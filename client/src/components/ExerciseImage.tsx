import { useEffect, useRef, useState } from "react";
import type { ExerciseImagePublic, ExerciseOptionPublic, ImageLegend } from "../api/types.js";
import { localize, t, useLang, type Lang } from "../lib/i18n.js";

/** Alto máximo de la imagen en el ejercicio (en vh) — ampliada no tiene tope. */
const MAX_HEIGHT_VH = 50;

interface Props {
  image: ExerciseImagePublic;
  /** Alternativas del ejercicio: una letra ligada a una opción muestra el
   * texto ACTUAL de esa opción (por su ID, aunque se hayan mezclado). */
  options?: ExerciseOptionPublic[];
}

/** Leyenda de las letras A, B, C de la imagen — siempre texto de la
 * interfaz (cambia con el idioma), nunca incrustada en la imagen. */
function Legend({ legend, options, lang }: { legend: ImageLegend | undefined; options?: ExerciseOptionPublic[]; lang: Lang }) {
  if (!legend || legend.type === "none") return null;
  if (legend.type === "generic") return <p className="exercise-image-legend-note">{legend.text[lang]}</p>;
  return (
    <ul className="exercise-image-legend" aria-label={t(lang, "imageLegendLabel")}>
      {legend.items.map((item) => {
        const option = item.optionId ? options?.find((o) => o.id === item.optionId) : undefined;
        const label = option ? localize(lang, option.label, option.labelEn) : item.label[lang];
        return (
          <li key={item.key}>
            <span className="exercise-image-legend-key">{item.key}</span> {label}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Ilustración SVG del banco de imágenes por curso, en el idioma elegido
 * (archivo y texto alternativo). Conserva la proporción original del SVG
 * (width/height del viewBox → sin saltos de diseño al cargar) y se puede
 * ampliar a pantalla completa, pensado para pantallas chicas. El enunciado
 * sigue siendo texto en la pantalla — la imagen lo acompaña, no lo reemplaza.
 */
export function ExerciseImage({ image, options }: Props) {
  const { lang } = useLang();
  const [enlarged, setEnlarged] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const { width, height } = image.size[lang];

  useEffect(() => {
    if (!enlarged) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnlarged(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enlarged]);

  const close = () => {
    setEnlarged(false);
    openRef.current?.focus();
  };

  return (
    <figure className="exercise-image">
      <button
        ref={openRef}
        type="button"
        className="exercise-image-open"
        // Ancho tal que el alto nunca pase de media pantalla, sin deformar.
        style={{ maxWidth: `min(100%, ${MAX_HEIGHT_VH}vh * ${(width / height).toFixed(4)})` }}
        onClick={() => setEnlarged(true)}
      >
        <img src={image.src[lang]} alt={image.alt[lang]} width={width} height={height} />
        <span className="exercise-image-zoom">
          <span aria-hidden="true">🔍</span> {t(lang, "enlargeImage")}
        </span>
      </button>

      <Legend legend={image.legend} options={options} lang={lang} />

      {enlarged && (
        <div className="exercise-image-overlay" role="dialog" aria-modal="true" aria-label={image.alt[lang]} onClick={close}>
          <button ref={closeRef} type="button" className="exercise-image-close" onClick={close}>
            ✕ {t(lang, "closeImage")}
          </button>
          <img
            src={image.src[lang]}
            alt={image.alt[lang]}
            width={width}
            height={height}
            onClick={(e) => e.stopPropagation()}
          />
          {image.legend && image.legend.type !== "none" && (
            <div className="exercise-image-overlay-legend" onClick={(e) => e.stopPropagation()}>
              <Legend legend={image.legend} options={options} lang={lang} />
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
