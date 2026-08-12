import { useEffect, useMemo } from "react";
import type { BreathingExercise } from "../lib/pauses.js";
import { randomBreathing } from "../lib/pauses.js";
import type { Lang } from "../lib/i18n.js";

const STAR_PATH =
  "M50,5 L60.58,35.44 L92.80,36.09 L67.12,55.56 L76.45,86.41 L50,68 L23.55,86.41 L32.88,55.56 L7.20,36.09 L39.42,35.44 Z";

function StarBreath({ totalSec }: { totalSec: number }) {
  return (
    <svg viewBox="0 0 100 100" className="breath-visual" role="img" aria-hidden="true">
      <path d={STAR_PATH} fill="none" stroke="var(--info)" strokeWidth="3" strokeLinejoin="round" />
      <circle r="5" fill="var(--brand)" className="star-breath-dot" style={{ animationDuration: `${totalSec}s` }} />
    </svg>
  );
}

function SwapBreath({ pair, totalSec }: { pair: [string, string]; totalSec: number }) {
  return (
    <div className="swap-breath">
      <span className="swap-emoji swap-emoji-a" style={{ animationDuration: `${totalSec}s` }}>
        {pair[0]}
      </span>
      <span className="swap-emoji swap-emoji-b" style={{ animationDuration: `${totalSec}s` }}>
        {pair[1]}
      </span>
    </div>
  );
}

function CircleBreath({ totalSec, icon }: { totalSec: number; icon?: string }) {
  return (
    <div className="pause-circle-outer">
      <div className="pause-circle" style={{ animationDuration: `${totalSec}s` }}>
        {icon && <span className="pause-circle-icon">{icon}</span>}
      </div>
    </div>
  );
}

const HAND_FINGER_X = [15, 42, 69, 96, 123];

function HandBreath({ totalSec }: { totalSec: number }) {
  return (
    <svg viewBox="0 0 146 100" className="breath-visual" role="img" aria-hidden="true">
      {HAND_FINGER_X.map((x) => (
        <rect key={x} x={x} y={20} width={16} height={70} rx={8} fill="none" stroke="var(--info)" strokeWidth="3" />
      ))}
      <rect x={8} y={78} width={130} height={18} rx={9} fill="none" stroke="var(--info)" strokeWidth="3" />
      <circle r="6" fill="var(--brand)" className="hand-breath-dot" style={{ animationDuration: `${totalSec}s` }} />
    </svg>
  );
}

function WaveBreath({ totalSec }: { totalSec: number }) {
  return (
    <div className="wave-breath">
      <span className="wave-dot" style={{ animationDuration: `${totalSec}s` }} />
      <div className="wave-line" aria-hidden="true" />
    </div>
  );
}

interface Props {
  lang: Lang;
  onDone: () => void;
}

export function BreathingPause({ lang, onDone }: Props) {
  const exercise: BreathingExercise = useMemo(() => randomBreathing(), []);
  const totalSec = useMemo(() => exercise.phases.reduce((s, p) => s + p, 0), [exercise]);
  const copy = exercise[lang] ?? exercise.es;

  useEffect(() => {
    const timer = setTimeout(onDone, totalSec * 1000);
    return () => clearTimeout(timer);
  }, [onDone, totalSec]);

  return (
    <div className="pause-body">
      <h2>
        {exercise.icon} {copy.title}
      </h2>
      <div className="pause-visual-wrap">
        {exercise.visual === "star" && <StarBreath totalSec={totalSec} />}
        {exercise.visual === "swap" && exercise.emojiPair && (
          <SwapBreath pair={exercise.emojiPair} totalSec={totalSec} />
        )}
        {exercise.visual === "circle" && <CircleBreath totalSec={totalSec} />}
        {exercise.visual === "hand" && <HandBreath totalSec={totalSec} />}
        {exercise.visual === "wave" && <WaveBreath totalSec={totalSec} />}
        {exercise.visual === "companion" && <CircleBreath totalSec={totalSec} icon={exercise.icon} />}
        <p className="pause-label">{copy.labels[0]}</p>
      </div>
    </div>
  );
}
