/**
 * Biblioteca curada específicamente para niños con TDAH/dificultades
 * atencionales: microintervenciones breves y concretas, no sesiones largas
 * de relajación. Reemplaza la lista anterior por los "imprescindibles"
 * priorizados explícitamente por el usuario del proyecto.
 */
export interface BreathingExercise {
  key: string;
  icon: string;
  visual: "star" | "swap" | "circle" | "hand" | "wave" | "companion";
  /** Segundos por fase (inhalar/sostener/exhalar…), suman 20-30s. */
  phases: number[];
  emojiPair?: [string, string];
  es: { title: string; labels: string[] };
  en: { title: string; labels: string[] };
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    key: "flor-vela",
    icon: "🌸",
    visual: "swap",
    phases: [15, 15],
    emojiPair: ["🌸", "🕯️"],
    es: { title: "Huele la flor, sopla la vela", labels: ["huele la flor 🌸", "sopla la vela 🕯️"] },
    en: { title: "Smell the flower, blow the candle", labels: ["smell the flower 🌸", "blow the candle 🕯️"] },
  },
  {
    key: "estrella",
    icon: "⭐",
    visual: "star",
    phases: [6, 6, 6, 6, 6],
    es: { title: "Respiración de la estrella", labels: ["sigue cada punta mientras respiras"] },
    en: { title: "Star breathing", labels: ["follow each point as you breathe"] },
  },
  {
    key: "mano-respira",
    icon: "🖐️",
    visual: "hand",
    phases: [30],
    es: { title: "La mano que respira", labels: ["recorre cada dedo: sube inhalando, baja exhalando"] },
    en: { title: "The breathing hand", labels: ["trace each finger: up to breathe in, down to breathe out"] },
  },
  {
    key: "globo",
    icon: "🎈",
    visual: "circle",
    phases: [8, 4, 18],
    es: { title: "Respiración de globo", labels: ["inhalar", "sostener", "exhalar"] },
    en: { title: "Balloon breathing", labels: ["breathe in", "hold", "breathe out"] },
  },
  {
    key: "abeja",
    icon: "🐝",
    visual: "circle",
    phases: [4, 8],
    es: { title: "Respiración de abeja", labels: ["inhala por la nariz, exhala zumbando mmm"] },
    en: { title: "Bee breathing", labels: ["breathe in through your nose, hum mmm as you breathe out"] },
  },
];

export interface MovementExercise {
  key: string;
  icon: string;
  es: string;
  en: string;
  seatedEs: string;
  seatedEn: string;
}

export const MOVEMENT_EXERCISES: MovementExercise[] = [
  {
    key: "saltos-estrella",
    icon: "🤸",
    es: "Haz 10 saltos de estrella (brazos y piernas abriendo y cerrando)",
    en: "Do 10 star jumps (arms and legs opening and closing)",
    seatedEs: "Abre y cierra los brazos por encima de la cabeza, sentado/a",
    seatedEn: "Open and close your arms above your head while seated",
  },
  {
    key: "marcha-cruzada",
    icon: "🦵",
    es: "Marcha en el lugar tocando la rodilla contraria con la mano",
    en: "March in place, touching your opposite knee with your hand",
    seatedEs: "Toca la rodilla contraria con la mano, sentado/a",
    seatedEn: "Touch your opposite knee with your hand while seated",
  },
  {
    key: "empujar-pared",
    icon: "🧱",
    es: "Empuja una pared con ambas manos, fuerte, contando hasta 5",
    en: "Push against a wall with both hands, hard, counting to 5",
    seatedEs: "Junta tus palmas y presiona fuerte, contando hasta 5",
    seatedEn: "Press your palms together hard, counting to 5",
  },
  {
    key: "animal-walks",
    icon: "🐻",
    es: "Camina como oso, cangrejo o rana durante unos pasos",
    en: "Walk like a bear, a crab, or a frog for a few steps",
    seatedEs: "Imita el animal solo con los brazos y la cara, sentado/a",
    seatedEn: "Imitate the animal using just your arms and face, while seated",
  },
  {
    key: "congelados",
    icon: "🧊",
    es: "Muévete libremente unos segundos y después congélate como una estatua, sin moverte",
    en: "Move around freely for a few seconds, then freeze like a statue, without moving",
    seatedEs: "Igual, sentado/a: mueve los brazos unos segundos y después congélate",
    seatedEn: "Same, seated: move your arms for a few seconds, then freeze",
  },
];

export function randomBreathing(): BreathingExercise {
  return BREATHING_EXERCISES[Math.floor(Math.random() * BREATHING_EXERCISES.length)]!;
}

export function randomMovement(): MovementExercise {
  return MOVEMENT_EXERCISES[Math.floor(Math.random() * MOVEMENT_EXERCISES.length)]!;
}
