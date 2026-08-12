import { useMemo } from "react";

const CONFETTI_COLORS = ["#0EA5E9", "#F5A623", "#22C55E", "#7A5C99", "#38BDF8"];

/** Solo al terminar la sesión — respeta prefers-reduced-motion (no genera piezas). */
export function Confetti() {
  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pieces = useMemo(() => {
    if (prefersReduced) return [];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.floor(Math.random() * 360),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
