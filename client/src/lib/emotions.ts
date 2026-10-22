import type { Emotion } from "../api/types.js";
import type { Lang } from "./i18n.js";

type Bi = Record<Lang, string>;

/// Las 6 emociones del cierre de práctica (mismo catálogo que EMOTIONS en
/// server/src/domain/feelings.ts): emoji, nombre para el niño y la frase con
/// que la mascota le agradece. El panel familiar usa el mismo emoji.
export const EMOTION_CHOICES: Array<{ key: Emotion; emoji: string; label: Bi; thanks: Bi }> = [
  { key: "orgullo", emoji: "🤩", label: { es: "Orgullo", en: "Proud" }, thanks: { es: "¡Qué bueno! Te esforzaste y se nota. 🌟", en: "Great! You worked hard and it shows. 🌟" } },
  { key: "alegria", emoji: "😊", label: { es: "Alegría", en: "Happy" }, thanks: { es: "¡Qué bueno que lo disfrutaste! 🎉", en: "So glad you enjoyed it! 🎉" } },
  { key: "calma", emoji: "😌", label: { es: "Calma", en: "Calm" }, thanks: { es: "¡Así se aprende, con calma! 🍃", en: "That’s how we learn, nice and calm! 🍃" } },
  { key: "aburrimiento", emoji: "🥱", label: { es: "Aburrimiento", en: "Bored" }, thanks: { es: "Gracias por decírmelo. Puedes elegir otro tema en el mapa. 🚀", en: "Thanks for telling me. You can pick another topic on the map. 🚀" } },
  { key: "rabia", emoji: "😤", label: { es: "Rabia", en: "Frustrated" }, thanks: { es: "Es normal sentir rabia cuando algo cuesta. La próxima vez respiramos y lo intentamos de nuevo. 💪", en: "It’s normal to feel frustrated when something is hard. Next time we’ll breathe and try again. 💪" } },
  { key: "nervios", emoji: "😰", label: { es: "Nervios", en: "Nervous" }, thanks: { es: "Equivocarse está permitido. ¡Lo importante es que lo intentaste! 💙", en: "Mistakes are allowed. What matters is that you tried! 💙" } },
];
