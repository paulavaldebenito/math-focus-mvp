/**
 * Evaluación de ubicación adaptativa (specs/020-ubicacion-adaptativa). Función pura, determinista y
 * sin IA, igual que adaptiveEngine.ts: a partir de las respuestas ya dadas decide qué habilidad
 * preguntar ahora, o si terminó, y qué domina el niño.
 *
 * Primero pasa por todas las habilidades de Números y operaciones de su curso. Si domina una, se
 * dan por dominadas también sus bases (inferidas: la práctica puede desmentirlas). De las que falló,
 * baja por sus prerrequisitos (prerequisites.ts), de un curso a otro, hasta encontrar lo que domina. Así un niño de 5° que no sabe las tablas termina con
 * «reforzar» en las tablas de 3° (y, si hace falta, en las del 2, 5 y 10 de 2°), no solo en
 * división de 5°.
 *
 * Como no se replica el estado, el servidor lo recalcula desde los intentos guardados en cada
 * respuesta: no hay estado escondido que se pueda desincronizar.
 */

export interface PlacementSkill {
  id: string;
  grade: number;
  order: number;
  oaCode: string | null;
}

export interface PlacementAnswer {
  skillId: string;
  isCorrect: boolean;
}

export type PlacementStatus = "dominada" | "reforzar";

export interface PlacementState {
  /** Habilidad de la que toca la siguiente pregunta; null si terminó. */
  nextSkillId: string | null;
  done: boolean;
  /** Resultado por habilidad: evaluada directamente o inferida (una base de algo dominado). */
  results: Record<string, PlacementStatus>;
  /** Habilidades con evidencia directa (para distinguirlas de las inferidas). */
  evaluated: string[];
}

/// Tope de preguntas (unos 8–10 minutos): la 1ª pasada por su curso usa 6–8 y el resto baja por las
/// cadenas que falló. Lo que no alcance a evaluarse lo detecta después la práctica diaria
/// (flagPrerequisitesFromPractice en placementData.ts).
export const PLACEMENT_MAX_QUESTIONS = 15;

/**
 * Veredicto con las respuestas de una habilidad. 2 de 2 → domina; 0 de 2 → reforzar; 1 de 2 →
 * una tercera pregunta decide (2 de 3). Una sola respuesta nunca ubica al niño.
 */
export function verdict(answers: readonly boolean[]): PlacementStatus | null {
  const right = answers.filter(Boolean).length;
  const wrong = answers.length - right;
  if (right >= 2) return "dominada";
  if (wrong >= 2) return "reforzar";
  return null;
}

export function computePlacement(
  grade: number,
  skills: readonly PlacementSkill[],
  prerequisites: Readonly<Record<string, readonly { oa: string }[]>>,
  answers: readonly PlacementAnswer[],
  maxQuestions = PLACEMENT_MAX_QUESTIONS,
  /** Habilidades sin ejercicios disponibles para preguntar: quedan sin evidencia (ni se preguntan ni se infieren). */
  unavailable: ReadonlySet<string> = new Set(),
): PlacementState {
  const byOa = new Map(skills.filter((s) => s.oaCode).map((s) => [s.oaCode!, s]));
  const prereqIds = (skill: PlacementSkill): string[] =>
    (prerequisites[skill.oaCode ?? ""] ?? []).flatMap((p) => {
      const found = byOa.get(p.oa);
      // Solo bases de cursos anteriores o del mismo curso (nunca subir).
      return found && found.grade <= skill.grade && found.id !== skill.id ? [found.id] : [];
    });
  const byId = new Map(skills.map((s) => [s.id, s]));

  const answersBySkill = new Map<string, boolean[]>();
  for (const a of answers) answersBySkill.set(a.skillId, [...(answersBySkill.get(a.skillId) ?? []), a.isCorrect]);

  const results: Record<string, PlacementStatus> = {};
  const evaluated = new Set<string>();

  // Dominar una habilidad implica dominar sus bases, salvo que haya evidencia directa en contra.
  const inferMastered = (id: string) => {
    for (const p of prereqIds(byId.get(id)!)) {
      if (evaluated.has(p) || results[p] === "dominada" || unavailable.has(p)) continue;
      results[p] = "dominada";
      inferMastered(p);
    }
  };

  const targets = skills
    .filter((s) => s.grade === grade && s.oaCode && s.oaCode in prerequisites)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id);

  const ask = (id: string): PlacementState => {
    const done = answers.length >= maxQuestions;
    return { nextSkillId: done ? null : id, done, results, evaluated: [...evaluated] };
  };
  const settle = (id: string, status: PlacementStatus) => {
    evaluated.add(id);
    results[id] = status;
    if (status === "dominada") inferMastered(id);
  };

  // 1ª pasada: todas las habilidades de su curso, para no gastar las preguntas en una sola cadena.
  for (const id of targets) {
    if (evaluated.has(id) || unavailable.has(id)) continue;
    const status = verdict(answersBySkill.get(id) ?? []);
    if (status === null) return ask(id);
    settle(id, status);
  }

  // 2ª pasada: desde cada una que falló se baja por sus prerrequisitos, en profundidad.
  const prereqsToProbe = (id: string) =>
    prereqIds(byId.get(id)!)
      // Una base inferida («dominada» por algo que sí sabe) se pregunta igual si es base de algo que
      // falló: hay evidencia en contra y no se da por sabida.
      .filter((p) => !evaluated.has(p))
      // Primero la base del curso más alto (la más cercana); se sigue bajando desde ahí.
      .sort((a, b) => byId.get(a)!.grade - byId.get(b)!.grade || byId.get(a)!.order - byId.get(b)!.order);
  const stack = targets
    .filter((id) => results[id] === "reforzar")
    .reverse()
    .flatMap((id) => prereqsToProbe(id));
  const passedThrough = new Set<string>();
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (evaluated.has(id)) continue;
    if (unavailable.has(id)) {
      // No se puede preguntar: se sigue bajando por sus bases (venía de algo que falló).
      if (!passedThrough.has(id)) stack.push(...prereqsToProbe(id));
      passedThrough.add(id);
      continue;
    }
    const status = verdict(answersBySkill.get(id) ?? []);
    if (status === null) return ask(id);
    settle(id, status);
    if (status === "reforzar") stack.push(...prereqsToProbe(id));
  }
  return { nextSkillId: null, done: true, results, evaluated: [...evaluated] };
}

/**
 * Repaso que resulta de la ubicación: las habilidades «reforzar» de cursos anteriores al del niño
 * (las de su curso ya están en su mapa normal), de la más básica a la más avanzada.
 */
export function reviewSkillIds(grade: number, skills: readonly PlacementSkill[], results: Readonly<Record<string, PlacementStatus>>): string[] {
  return skills
    .filter((s) => s.grade < grade && results[s.id] === "reforzar")
    .sort((a, b) => a.grade - b.grade || a.order - b.order)
    .map((s) => s.id);
}
