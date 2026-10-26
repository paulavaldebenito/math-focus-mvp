/**
 * Escalas de 5 caritas, siempre de izquierda (1, la más triste/nerviosa) a
 * derecha (5, la más contenta/tranquila) — el mismo sentido en las dos
 * preguntas para que el niño no tenga que pensar cuál es "buena". Lenguaje
 * cotidiano, nunca clínico: es un autorreporte, no una evaluación.
 */
export const MOOD_FACES = [
  { value: 1, emoji: "😢", es: "Muy triste", en: "Very sad" },
  { value: 2, emoji: "🙁", es: "Un poco triste", en: "A little sad" },
  { value: 3, emoji: "😐", es: "Más o menos", en: "Okay" },
  { value: 4, emoji: "🙂", es: "Bien", en: "Good" },
  { value: 5, emoji: "😄", es: "¡Muy bien!", en: "Great!" },
] as const;

export const MATH_FACES = [
  { value: 1, emoji: "😰", es: "Con muchos nervios", en: "Very nervous" },
  { value: 2, emoji: "😟", es: "Con algunos nervios", en: "A little nervous" },
  { value: 3, emoji: "😐", es: "Más o menos", en: "Okay" },
  { value: 4, emoji: "🙂", es: "Con calma", en: "Calm" },
  { value: 5, emoji: "😎", es: "¡Con mucha calma!", en: "Very calm!" },
] as const;
