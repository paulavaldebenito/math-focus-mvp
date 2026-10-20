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

/// Cómo se mueve la mascota mientras acompaña el ejercicio (animación CSS
/// `mascot-motion-<tipo>` en App.css) — imita lo que está haciendo el niño.
export type MascotMotion =
  | "jump"
  | "march"
  | "walk"
  | "turn"
  | "squat"
  | "stretch"
  | "clap"
  | "circle"
  | "push"
  | "freeze";

export interface MovementExercise {
  key: string;
  /** Movimiento de la mascota que lo acompaña. */
  motion: MascotMotion;
  /** Cursos (1-6) para los que es un movimiento MATEMÁTICO adecuado.
   * Ausente = movimiento genérico, sin contenido matemático (respaldo). */
  grades?: readonly number[];
  icon: string;
  es: string;
  en: string;
  seatedEs: string;
  seatedEn: string;
}

export const MOVEMENT_EXERCISES: MovementExercise[] = [
  {
    key: "saltos-estrella",
    motion: "jump",
    icon: "🤸",
    es: "Haz 10 saltos de estrella (brazos y piernas abriendo y cerrando)",
    en: "Do 10 star jumps (arms and legs opening and closing)",
    seatedEs: "Abre y cierra los brazos por encima de la cabeza, sentado/a",
    seatedEn: "Open and close your arms above your head while seated",
  },
  {
    key: "marcha-cruzada",
    motion: "march",
    icon: "🦵",
    es: "Marcha en el lugar tocando la rodilla contraria con la mano",
    en: "March in place, touching your opposite knee with your hand",
    seatedEs: "Toca la rodilla contraria con la mano, sentado/a",
    seatedEn: "Touch your opposite knee with your hand while seated",
  },
  {
    key: "empujar-pared",
    motion: "push",
    icon: "🧱",
    es: "Empuja una pared con ambas manos, fuerte, contando hasta 5",
    en: "Push against a wall with both hands, hard, counting to 5",
    seatedEs: "Junta tus palmas y presiona fuerte, contando hasta 5",
    seatedEn: "Press your palms together hard, counting to 5",
  },
  {
    key: "animal-walks",
    motion: "walk",
    icon: "🐻",
    es: "Camina como oso, cangrejo o rana durante unos pasos",
    en: "Walk like a bear, a crab, or a frog for a few steps",
    seatedEs: "Imita el animal solo con los brazos y la cara, sentado/a",
    seatedEn: "Imitate the animal using just your arms and face, while seated",
  },
  {
    key: "congelados",
    motion: "freeze",
    icon: "🧊",
    es: "Muévete libremente unos segundos y después congélate como una estatua, sin moverte",
    en: "Move around freely for a few seconds, then freeze like a statue, without moving",
    seatedEs: "Igual, sentado/a: mueve los brazos unos segundos y después congélate",
    seatedEn: "Same, seated: move your arms for a few seconds, then freeze",
  },
];

/// Elige al azar entre los ejercicios que NO están en `exclude` (los ya
/// hechos en esta sesión), para que no se repita el mismo. Si ya se usaron
/// todos, vuelve a elegir entre el catálogo completo — nunca deja al niño
/// sin pausa.
function pickFresh<T extends { key: string }>(items: readonly T[], exclude: readonly string[], rng: () => number): T {
  const fresh = items.filter((e) => !exclude.includes(e.key));
  const pool = fresh.length > 0 ? fresh : items;
  return pool[Math.floor(rng() * pool.length)]!;
}

/**
 * Movimientos con contenido matemático (contar, patrones, valor posicional,
 * tablas, ángulos, plano cartesiano, porcentajes…) según el curso — mueven
 * el cuerpo y a la vez repasan lo que el niño está aprendiendo. Cortos
 * (~30 s), sin materiales, cada uno con versión sentado/a.
 */
export const MATH_MOVEMENT_EXERCISES: MovementExercise[] = [
  {
    key: "contar-saltos",
    motion: "jump",
    grades: [1],
    icon: "🔢",
    es: "Da 10 saltitos contando en voz alta del 1 al 10, y después cuenta hacia atrás del 10 al 1 agachándote poco a poco",
    en: "Do 10 little jumps counting out loud from 1 to 10, then count back from 10 to 1 while crouching down little by little",
    seatedEs: "Aplaude contando del 1 al 10 y después cuenta hacia atrás del 10 al 1 bajando las manos",
    seatedEn: "Clap counting from 1 to 10, then count back from 10 to 1 while lowering your hands",
  },
  {
    key: "dedos-que-suman",
    motion: "clap",
    grades: [1],
    icon: "🖐️",
    es: "Muestra 5 con tus dedos de todas las formas que puedas (3 y 2, 4 y 1, 5 y 0) y da un salto por cada forma",
    en: "Show 5 with your fingers in as many ways as you can (3 and 2, 4 and 1, 5 and 0) and jump once for each way",
    seatedEs: "Muestra 5 con tus dedos de todas las formas que puedas (3 y 2, 4 y 1…) y aplaude por cada una",
    seatedEn: "Show 5 with your fingers in as many ways as you can (3 and 2, 4 and 1…) and clap for each one",
  },
  {
    key: "patron-cuerpo",
    motion: "clap",
    grades: [1, 2],
    icon: "👏",
    es: "Repite este patrón 3 veces: aplauso, aplauso, salto. Después inventa tu propio patrón y hazlo 2 veces",
    en: "Repeat this pattern 3 times: clap, clap, jump. Then make up your own pattern and do it twice",
    seatedEs: "Repite 3 veces: aplauso, aplauso, golpe en la mesa. Después inventa tu propio patrón",
    seatedEn: "Repeat 3 times: clap, clap, tap the table. Then make up your own pattern",
  },
  {
    key: "figuras-en-el-aire",
    motion: "circle",
    grades: [1, 2],
    icon: "🔺",
    es: "De pie, dibuja en el aire con todo el brazo un círculo, un cuadrado y un triángulo bien grandes. ¿Cuántos lados tuvo cada uno?",
    en: "Standing up, draw a big circle, a square and a triangle in the air with your whole arm. How many sides did each one have?",
    seatedEs: "Dibuja en el aire con el dedo un círculo, un cuadrado y un triángulo. ¿Cuántos lados tuvo cada uno?",
    seatedEn: "Draw a circle, a square and a triangle in the air with your finger. How many sides did each one have?",
  },
  {
    key: "saltar-de-2-en-2",
    motion: "jump",
    grades: [2],
    icon: "🦘",
    es: "Salta de 2 en 2 hasta 20: un salto por cada número (2, 4, 6…)",
    en: "Skip count by 2s up to 20: one jump for each number (2, 4, 6…)",
    seatedEs: "Aplaude contando de 2 en 2 hasta 20 (2, 4, 6…)",
    seatedEn: "Clap while counting by 2s up to 20 (2, 4, 6…)",
  },
  {
    key: "decenas-y-unidades",
    motion: "jump",
    grades: [2, 3],
    icon: "🔟",
    es: "Muestra el 34 con el cuerpo: 3 saltos grandes (las decenas) y 4 aplausos (las unidades). Ahora haz el 52 y el 45",
    en: "Show 34 with your body: 3 big jumps (the tens) and 4 claps (the ones). Now do 52 and 45",
    seatedEs: "Muestra el 34: 3 golpes en la mesa (decenas) y 4 aplausos (unidades). Ahora el 52 y el 45",
    seatedEn: "Show 34: 3 taps on the table (tens) and 4 claps (ones). Now 52 and 45",
  },
  {
    key: "marcha-de-5-en-5",
    motion: "march",
    grades: [2, 3],
    icon: "🥁",
    es: "Marcha en el lugar contando de 5 en 5 hasta 50: di un número en cada paso",
    en: "March in place counting by 5s up to 50: say one number with each step",
    seatedEs: "Golpea suave la mesa contando de 5 en 5 hasta 50",
    seatedEn: "Tap the table gently counting by 5s up to 50",
  },
  {
    key: "tabla-saltando",
    motion: "jump",
    grades: [3, 4],
    icon: "✖️",
    es: "Elige la tabla del 3 o del 4 y di sus resultados en voz alta dando un salto con cada uno, desde × 1 hasta × 10 (3, 6, 9…)",
    en: "Pick the 3 or 4 times table and say its answers out loud, jumping with each one, from × 1 to × 10 (3, 6, 9…)",
    seatedEs: "Elige la tabla del 3 o del 4 y di sus resultados aplaudiendo con cada uno",
    seatedEn: "Pick the 3 or 4 times table and say its answers, clapping with each one",
  },
  {
    key: "cabeza-hombros-diez",
    motion: "squat",
    grades: [3],
    icon: "🙆",
    es: "Cuenta de 10 en 10 hasta 100 tocándote por turnos la cabeza, los hombros, las rodillas y los pies",
    en: "Count by 10s up to 100, touching your head, shoulders, knees and toes in turn",
    seatedEs: "Cuenta de 10 en 10 hasta 100 tocándote por turnos la cabeza, los hombros y las rodillas",
    seatedEn: "Count by 10s up to 100, touching your head, shoulders and knees in turn",
  },
  {
    key: "perimetro-en-pasos",
    motion: "walk",
    grades: [3, 4, 5],
    icon: "👣",
    es: "Camina alrededor de una mesa o una alfombra contando tus pasos: ¡ese es su perímetro medido en pasos!",
    en: "Walk around a table or a rug counting your steps: that's its perimeter measured in steps!",
    seatedEs: "Recorre con el dedo el borde de un cuaderno contando cuántos dedos mide cada lado, y súmalos",
    seatedEn: "Trace the edge of a notebook with your finger counting how many fingers each side measures, and add them up",
  },
  {
    key: "poses-simetricas",
    motion: "stretch",
    grades: [4],
    icon: "🦋",
    es: "Haz 3 poses simétricas (iguales a ambos lados de tu cuerpo) y 3 que no lo sean. ¿Dónde está tu línea de simetría?",
    en: "Make 3 symmetrical poses (the same on both sides of your body) and 3 that aren't. Where is your line of symmetry?",
    seatedEs: "Con los brazos, haz 3 poses simétricas y 3 que no lo sean",
    seatedEn: "With your arms, make 3 symmetrical poses and 3 that aren't",
  },
  {
    key: "angulos-con-brazos",
    motion: "stretch",
    grades: [4, 5, 6],
    icon: "📐",
    es: "Con los brazos forma un ángulo recto (una L), uno agudo (más cerrado) y uno obtuso (más abierto). Repite la serie 3 veces",
    en: "Use your arms to make a right angle (an L), an acute angle (narrower) and an obtuse angle (wider). Repeat the set 3 times",
    seatedEs: "Con los antebrazos forma un ángulo recto, uno agudo y uno obtuso, 3 veces",
    seatedEn: "Use your forearms to make a right, an acute and an obtuse angle, 3 times",
  },
  {
    key: "giros-en-fracciones",
    motion: "turn",
    grades: [4, 5],
    icon: "🔄",
    es: "Gira 1/4 de vuelta, luego 1/2 vuelta y luego 1/4 más. ¿Diste una vuelta completa? ¿Hacia dónde quedaste mirando?",
    en: "Turn 1/4 of a turn, then 1/2 a turn, then 1/4 more. Did you make a full turn? Which way are you facing?",
    seatedEs: "Con el brazo estirado, señala 1/4 de vuelta, luego 1/2 y luego 1/4 más. ¿Completaste la vuelta?",
    seatedEn: "With your arm stretched out, point 1/4 of a turn, then 1/2, then 1/4 more. Did you complete the turn?",
  },
  {
    key: "pasos-cartesianos",
    motion: "walk",
    grades: [5],
    icon: "🗺️",
    es: "Imagina una cuadrícula en el suelo: desde tu lugar, da 3 pasos a la derecha y 2 hacia adelante, ¡llegaste al punto (3, 2)! Vuelve y ve al (1, 4)",
    en: "Imagine a grid on the floor: from where you are, take 3 steps right and 2 forward. You reached the point (3, 2)! Go back and go to (1, 4)",
    seatedEs: "Con el dedo sobre la mesa, avanza 3 a la derecha y 2 hacia arriba: el punto (3, 2). Ahora ve al (1, 4)",
    seatedEn: "With your finger on the table, move 3 right and 2 up: the point (3, 2). Now go to (1, 4)",
  },
  {
    key: "multiplos-saltando",
    motion: "jump",
    grades: [5, 6],
    icon: "🎯",
    es: "Cuenta del 1 al 30 en voz alta: salta en los múltiplos de 3 y aplaude en los de 5. ¿Qué haces en el 15?",
    en: "Count from 1 to 30 out loud: jump on multiples of 3 and clap on multiples of 5. What do you do on 15?",
    seatedEs: "Cuenta del 1 al 30: golpea la mesa en los múltiplos de 3 y aplaude en los de 5. ¿Y en el 15?",
    seatedEn: "Count from 1 to 30: tap the table on multiples of 3 and clap on multiples of 5. And on 15?",
  },
  {
    key: "giros-en-grados",
    motion: "turn",
    grades: [6],
    icon: "🧭",
    es: "Gira 90°, luego 180° y luego 90° más. ¿Cuántos grados giraste en total? ¿Quedaste mirando hacia el mismo lado?",
    en: "Turn 90°, then 180°, then 90° more. How many degrees did you turn in total? Are you facing the same way?",
    seatedEs: "Con el brazo, señala giros de 90°, 180° y 90° más. ¿Cuántos grados sumaste?",
    seatedEn: "With your arm, point out turns of 90°, 180° and 90° more. How many degrees did that add up to?",
  },
  {
    key: "sentadillas-porcentaje",
    motion: "squat",
    grades: [6],
    icon: "💯",
    es: "Haz 10 sentadillas: en la 5.ª di «¡50 %!», en la 8.ª «¡80 %!» y en la 10.ª «¡100 %!»",
    en: "Do 10 squats: on the 5th say “50%!”, on the 8th “80%!” and on the 10th “100%!”",
    seatedEs: "Levanta los brazos 10 veces: en la 5.ª di «¡50 %!», en la 8.ª «¡80 %!» y en la 10.ª «¡100 %!»",
    seatedEn: "Raise your arms 10 times: on the 5th say “50%!”, on the 8th “80%!” and on the 10th “100%!”",
  },
  {
    key: "pasos-y-aplausos",
    motion: "walk",
    grades: [6],
    icon: "⚖️",
    es: "Por cada 2 pasos que das, aplaude 1 vez. Camina 12 pasos: ¿cuántos aplausos diste? Esa es la razón 2 : 1",
    en: "For every 2 steps you take, clap once. Walk 12 steps: how many claps did you make? That's the ratio 2 : 1",
    seatedEs: "Por cada 2 golpes en la mesa, aplaude 1 vez. Haz 12 golpes: ¿cuántos aplausos diste?",
    seatedEn: "For every 2 taps on the table, clap once. Do 12 taps: how many claps did you make?",
  },
];

export function randomBreathing(exclude: readonly string[] = [], rng: () => number = Math.random): BreathingExercise {
  return pickFresh(BREATHING_EXERCISES, exclude, rng);
}

/// Con curso: primero un movimiento matemático de ese curso que no se haya
/// hecho en la sesión; si ya se hicieron todos, uno genérico no repetido;
/// y si también se agotaron, cualquiera de los de su curso. Sin curso
/// (pantallas que no lo conocen), solo genéricos, como antes.
export function randomMovement(
  exclude: readonly string[] = [],
  rng: () => number = Math.random,
  grade?: number,
): MovementExercise {
  if (grade === undefined) return pickFresh(MOVEMENT_EXERCISES, exclude, rng);
  const forGrade = MATH_MOVEMENT_EXERCISES.filter((e) => e.grades?.includes(grade));
  const freshMath = forGrade.filter((e) => !exclude.includes(e.key));
  if (freshMath.length > 0) return pickFresh(freshMath, [], rng);
  const freshGeneric = MOVEMENT_EXERCISES.filter((e) => !exclude.includes(e.key));
  if (freshGeneric.length > 0) return pickFresh(freshGeneric, [], rng);
  return pickFresh(forGrade.length > 0 ? forGrade : MOVEMENT_EXERCISES, [], rng);
}
