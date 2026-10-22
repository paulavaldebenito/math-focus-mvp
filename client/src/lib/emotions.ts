import type { Emotion } from "../api/types.js";
import type { Lang } from "./i18n.js";

type Bi = Record<Lang, string>;

/// Las 6 emociones del cierre de práctica (mismo catálogo que EMOTIONS en
/// server/src/domain/feelings.ts): emoji, nombre para el niño y la frase con
/// que la mascota le agradece. El panel familiar usa el mismo emoji.
export const EMOTION_CHOICES: Array<{ key: Emotion; emoji: string; label: Bi; thanks: Bi }> = [
  { key: "orgullo", emoji: "🤩", label: { es: "Orgullo", en: "Proud" }, thanks: { es: "¡Tienes razón en sentirte así! 🌟", en: "You should feel proud! 🌟" } },
  { key: "alegria", emoji: "😊", label: { es: "Alegría", en: "Happy" }, thanks: { es: "¡Qué bueno que lo disfrutaste! 🎉", en: "So glad you enjoyed it! 🎉" } },
  { key: "calma", emoji: "😌", label: { es: "Calma", en: "Calm" }, thanks: { es: "¡Así se aprende, con calma! 🍃", en: "That’s how we learn, nice and calm! 🍃" } },
  { key: "aburrimiento", emoji: "🥱", label: { es: "Aburrimiento", en: "Bored" }, thanks: { es: "Gracias por decírmelo. ¡La próxima probemos algo nuevo! 🚀", en: "Thanks for telling me. Next time let’s try something new! 🚀" } },
  { key: "rabia", emoji: "😤", label: { es: "Rabia", en: "Frustrated" }, thanks: { es: "Es normal cuando algo cuesta. ¡Respiramos y seguimos! 💪", en: "That’s normal when something is hard. Let’s breathe and keep going! 💪" } },
  { key: "nervios", emoji: "😰", label: { es: "Nervios", en: "Nervous" }, thanks: { es: "Equivocarse está permitido. ¡Lo importante es que lo intentaste! 💙", en: "Mistakes are allowed. What matters is that you tried! 💙" } },
];
