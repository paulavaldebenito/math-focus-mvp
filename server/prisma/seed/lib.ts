/// Tipos y datos puros del banco — sin acceso a BD (ver persist.ts).

/// Códigos de error → id en BD (los 5 códigos de nivel 1-3 más los de comportamiento).
export type ErrorIds = { [code: string]: string };

export interface SeedExercise {
  prompt: string;
  promptEn: string;
  procedureNote: string;
  procedureNoteEn: string;
  difficultyLevel: number;
  visual: unknown;
  /// Interés (ver INTEREST_KEYS en el servidor) cuyo vocabulario reescribe
  /// el enunciado. Ausente = contenido neutro, usado siempre como respaldo.
  theme?: string;
  /// Agrupa un ejercicio base con sus variantes temáticas (mismo problema
  /// contado con otro vocabulario). Ver themes/lib.ts.
  baseKey?: string;
  options: Array<{ label: string; isCorrect: boolean; errorTypeId?: string }>;
}

export interface SeedSkill {
  grade: number;
  axis: string;
  name: string;
  /// Traducción al inglés del eje/nombre — vocabulario escolar real en
  /// inglés (p. ej. "pie chart"), no una traducción literal. Opcional: sin
  /// ella, el mapa cae de vuelta al español (mismo patrón que promptEn).
  axisEn?: string;
  nameEn?: string;
  oaCode?: string;
  /// Orden dentro de su curso, para el mapa de habilidades. Lo asigna
  /// `seed.ts` según la posición del contenido en el arreglo de su curso —
  /// los agentes de curso no lo declaran a mano.
  order?: number;
}

/// Un contenido del banco: la habilidad y sus ejercicios (datos puros).
export interface SkillBlock {
  skill: SeedSkill;
  exercises: SeedExercise[];
}

export function block(skill: SeedSkill, exercises: SeedExercise[]): SkillBlock {
  return { skill, exercises };
}
