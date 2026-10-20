/**
 * Mapa de habilidades (estilo Duolingo): convierte las habilidades de un
 * curso y las respuestas correctas históricas del niño en un camino de
 * nodos que se desbloquean en orden. Función pura, determinista, sin
 * acceso a BD — igual que `adaptiveEngine.ts` y `exercises/select.ts`.
 *
 * Principio del proyecto que esto respeta: un nodo bloqueado nunca es una
 * falla, es "todavía no" — siempre alcanzable en orden, sin decaimiento ni
 * pérdida. `SKILL_COMPLETE_THRESHOLD` es una decisión de diseño del juego
 * (no un umbral pedagógico validado), igual criterio que
 * `FAST_RESPONSE_THRESHOLD_MS` en adaptiveEngine.ts.
 */

/// Aciertos históricos necesarios en una habilidad para darla por completada.
export const SKILL_COMPLETE_THRESHOLD = 5;

export interface SkillPathInput {
  id: string;
  grade: number;
  axis: string;
  name: string;
  /// Traducción al inglés — null cae de vuelta al español (mismo patrón que
  /// Exercise.promptEn). Ver comentario en schema.prisma.
  axisEn: string | null;
  nameEn: string | null;
  oaCode: string | null;
  order: number;
}

export type SkillStatus = "locked" | "available" | "completed";

export interface SkillNode extends SkillPathInput {
  status: SkillStatus;
  correctCount: number;
}

/// `correctCountsBySkillId` trae SOLO los aciertos ya contados por el
/// llamador (agrupar por `exercise.mathSkillId` con `isCorrect: true`) — este
/// módulo no sabe de dónde vienen los números, solo cómo convertirlos en un
/// mapa. Los intentos de antes de que existiera esta funcionalidad cuentan
/// igual: el estado siempre se deriva de `Attempt` real, sin migrar datos.
export function computeSkillPath(
  skills: readonly SkillPathInput[],
  correctCountsBySkillId: Readonly<Record<string, number>>,
): SkillNode[] {
  const ordered = [...skills].sort((a, b) => a.order - b.order);

  let previousCompleted = true; // la primera habilidad siempre es alcanzable
  return ordered.map((skill) => {
    const correctCount = correctCountsBySkillId[skill.id] ?? 0;
    const completed = correctCount >= SKILL_COMPLETE_THRESHOLD;
    const status: SkillStatus = completed ? "completed" : previousCompleted ? "available" : "locked";
    previousCompleted = completed;
    return { ...skill, status, correctCount };
  });
}
