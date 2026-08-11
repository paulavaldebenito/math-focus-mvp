/**
 * Calibración inicial: decide el nivel de partida (1-3) a partir de la
 * evaluación breve. Función pura, determinista, sin IA — auditable y
 * testeable sin base de datos.
 */
export function computeInitialLevel(correctCount: number, totalCount: number): number {
  if (totalCount <= 0) {
    throw new Error("totalCount debe ser mayor que 0");
  }
  if (correctCount < 0 || correctCount > totalCount) {
    throw new Error("correctCount fuera de rango [0, totalCount]");
  }

  const ratio = correctCount / totalCount;
  if (ratio < 0.4) return 1;
  if (ratio < 0.8) return 2;
  return 3;
}
