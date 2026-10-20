/**
 * Sonidos de la app — síntesis con Web Audio, sin archivos ni dependencias.
 *
 * Estilo: cálido, suave y "de juego infantil", nunca estridente.
 * - Cada nota es una "voz" en capas: fundamental senoidal (con un detune
 *   mínimo aleatorio) + un armónico suave cuyo timbre define el carácter
 *   (marimba de madera, campanita o soplo suave).
 * - Envolvente con ataque corto pero no instantáneo (sin "clic" digital) y
 *   decaimiento exponencial natural.
 * - Todo pasa por una cadena maestra: volumen moderado → filtro lowpass
 *   (quita el brillo áspero) → compresor suave (evita picos que asusten
 *   cuando se superponen varios sonidos).
 * - Las notas salen de la escala pentatónica de Do mayor: cualquier
 *   combinación suena consonante.
 * - Variantes sutiles (nota, detune, volumen) para que un mismo botón no
 *   suene idéntico cada vez.
 *
 * Política de autoplay: nunca se crea ni se reanuda el AudioContext antes de
 * un gesto real del usuario (clic/tecla/toque). Sin AudioContext (jsdom en
 * pruebas, navegadores antiguos) todas las funciones son no-op silenciosos.
 */

const MUTE_KEY = "mathfocus.muted";

type Timbre = "marimba" | "bell" | "soft";

interface NoteOpts {
  /** Segundos desde "ahora" en que empieza la nota. */
  at?: number;
  /** Duración del decaimiento (segundos). */
  dur?: number;
  /** Pico de volumen de la voz (antes de la cadena maestra). */
  gain?: number;
  timbre?: Timbre;
  /** Ataque en segundos. */
  attack?: number;
}

// Escala pentatónica de Do mayor (Hz).
const N = {
  C4: 261.63,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  G6: 1567.98,
} as const;

/** Volumen máximo permitido para una voz individual. */
export const MAX_VOICE_GAIN = 0.12;

let ctx: AudioContext | null = null;
let master: AudioNode | null = null;
let gestureSeen = false;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

// Se registra el primer gesto real del usuario: antes de eso no se toca el
// audio (política de autoplay de los navegadores).
if (typeof window !== "undefined") {
  const markGesture = () => {
    gestureSeen = true;
  };
  for (const type of ["pointerdown", "keydown", "touchstart", "mousedown"]) {
    window.addEventListener(type, markGesture, { capture: true, passive: true });
  }
}

function userHasInteracted(): boolean {
  if (gestureSeen) return true;
  const activation = (typeof navigator !== "undefined" ? navigator : undefined) as
    | (Navigator & { userActivation?: { hasBeenActive: boolean } })
    | undefined;
  return Boolean(activation?.userActivation?.hasBeenActive);
}

function getAudioCtor(): (new () => AudioContext) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: new () => AudioContext; webkitAudioContext?: new () => AudioContext };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function buildMasterChain(audio: AudioContext): AudioNode {
  const out = audio.createGain();
  out.gain.value = 0.8;
  let tail: AudioNode = out;

  if (typeof audio.createBiquadFilter === "function") {
    const lowpass = audio.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 3600;
    lowpass.Q.value = 0.5;
    tail.connect(lowpass);
    tail = lowpass;
  }

  if (typeof audio.createDynamicsCompressor === "function") {
    const comp = audio.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 14;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    tail.connect(comp);
    tail = comp;
  }

  tail.connect(audio.destination);
  return out;
}

function getCtx(): AudioContext | null {
  if (!userHasInteracted()) return null;
  try {
    if (!ctx) {
      const Ctor = getAudioCtor();
      if (!Ctor) return null;
      ctx = new Ctor();
      master = buildMasterChain(ctx);
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Crea/reanuda el contexto de audio dentro de un gesto, sin sonar. Útil
 * cuando el sonido llegará después de una espera async (p. ej. login). */
export function primeAudio() {
  if (muted) return;
  getCtx();
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function envelope(g: GainNode, t0: number, peak: number, attack: number, dur: number) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + dur);
}

/** Una nota en capas: fundamental + armónico suave según el timbre. */
function note(freq: number, opts: NoteOpts = {}) {
  const audio = getCtx();
  if (!audio || !master) return;
  const { at = 0, dur = 0.18, timbre = "marimba", attack = timbre === "soft" ? 0.02 : 0.006 } = opts;
  const peak = Math.min(opts.gain ?? 0.08, MAX_VOICE_GAIN) * rand(0.9, 1);
  const t0 = audio.currentTime + at + 0.005;

  // Capa principal: seno puro, detune mínimo para que no sea "de laboratorio".
  const layers: Array<{ ratio: number; type: OscillatorType; level: number; decay: number; detune: number }> = [
    { ratio: 1, type: "sine", level: 1, decay: dur, detune: rand(-4, 4) },
  ];
  if (timbre === "marimba") {
    // Sobretono de madera (4x), muy breve — da el "toc" amable.
    layers.push({ ratio: 4, type: "sine", level: 0.12, decay: dur * 0.25, detune: 0 });
  } else if (timbre === "bell") {
    // Octava suave que se desvanece antes — campanita.
    layers.push({ ratio: 2, type: "sine", level: 0.22, decay: dur * 0.6, detune: rand(-3, 3) });
    layers.push({ ratio: 3, type: "sine", level: 0.06, decay: dur * 0.35, detune: 0 });
  } else {
    // Soplo suave: triángulo un pelín desafinado, rellena sin brillar.
    layers.push({ ratio: 1, type: "triangle", level: 0.3, decay: dur, detune: 7 });
  }

  for (const layer of layers) {
    const osc = audio.createOscillator();
    const g = audio.createGain();
    osc.type = layer.type;
    osc.frequency.setValueAtTime(freq * layer.ratio, t0);
    osc.detune.value = layer.detune;
    osc.connect(g);
    g.connect(master);
    envelope(g, t0, peak * layer.level, attack, layer.decay);
    osc.start(t0);
    osc.stop(t0 + attack + layer.decay + 0.05);
  }
}

function sequence(freqs: readonly number[], step: number, opts: NoteOpts = {}) {
  freqs.forEach((f, i) => note(f, { ...opts, at: (opts.at ?? 0) + i * step }));
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    // Sin almacenamiento (modo privado): el mute dura solo esta sesión.
  }
}

// ---------------------------------------------------------------------------
// Botones y navegación
// ---------------------------------------------------------------------------

/** "Toc" breve de madera al presionar un botón cualquiera. La nota varía
 * sutilmente entre tres vecinas para que no suene idéntico cada vez. */
export function playClick() {
  if (muted) return;
  note(pick([N.G5, N.A5, N.C6]), { dur: 0.09, gain: 0.07, timbre: "marimba" });
}

/** Elegir algo (mascota, interés, curso, idioma, alternativa del
 * diagnóstico): dos notas ascendentes, alegres pero neutras — no indica
 * acierto ni error, solo que la elección quedó registrada. */
export function playSelect() {
  if (muted) return;
  const [a, b] = pick([
    [N.E5, N.A5],
    [N.D5, N.G5],
    [N.G5, N.C6],
  ] as const);
  note(a, { dur: 0.12, gain: 0.07 });
  note(b, { at: 0.06, dur: 0.16, gain: 0.075 });
}

/** Deseleccionar (quitar un interés, desmarcar): una sola nota más grave. */
export function playDeselect() {
  if (muted) return;
  note(pick([N.D5, N.E5]), { dur: 0.1, gain: 0.055, timbre: "soft" });
}

/** Confirmar / continuar: arpegio corto ascendente con una campanita. */
export function playConfirm() {
  if (muted) return;
  sequence([N.C5, N.E5, N.G5], 0.055, { dur: 0.14, gain: 0.07 });
  note(N.C6, { at: 0.165, dur: 0.32, gain: 0.06, timbre: "bell" });
}

/** Volver / salir: dos notas suaves descendentes, más bajas de volumen. */
export function playBack() {
  if (muted) return;
  note(N.G5, { dur: 0.11, gain: 0.055, timbre: "soft" });
  note(N.D5, { at: 0.07, dur: 0.16, gain: 0.05, timbre: "soft" });
}

/** Bienvenida al entrar a la app (tras iniciar sesión / crear cuenta). */
export function playWelcome() {
  if (muted) return;
  // Colchón muy suave debajo (Do + Sol), da calidez sin protagonismo.
  note(N.C4, { dur: 0.9, gain: 0.03, timbre: "soft", attack: 0.08 });
  note(N.G4, { dur: 0.9, gain: 0.025, timbre: "soft", attack: 0.08 });
  sequence([N.C5, N.E5, N.G5, N.A5], 0.085, { dur: 0.2, gain: 0.065 });
  note(N.C6, { at: 0.34, dur: 0.6, gain: 0.07, timbre: "bell" });
  note(N.E6, { at: 0.42, dur: 0.45, gain: 0.03, timbre: "bell" });
}

// ---------------------------------------------------------------------------
// Práctica y diagnóstico
// ---------------------------------------------------------------------------

// Variantes del mismo "ding" de acierto (misma sensación, distinta melodía
// corta) para que varios aciertos seguidos no suenen idénticos.
const CORRECT_VARIANTS: ReadonlyArray<readonly [number, number]> = [
  [N.C5, N.G5],
  [N.D5, N.A5],
  [N.E5, N.C6],
];

export function playCorrect(variant = 0) {
  if (muted) return;
  const [a, b] = CORRECT_VARIANTS[Math.abs(variant) % CORRECT_VARIANTS.length]!;
  note(a, { dur: 0.16, gain: 0.085 });
  note(b, { at: 0.08, dur: 0.26, gain: 0.09 });
  // Brillo de campanita justo después — refuerza el acierto sin alargarlo.
  note(b * 2, { at: 0.14, dur: 0.28, gain: 0.035, timbre: "bell" });
}

/** Arpegio corto y ascendente — se suma a playCorrect() cuando el niño lleva
 * varios aciertos seguidos (racha). Nunca suena si se rompe la racha: eso
 * nunca se anuncia, solo se deja de sumar. */
export function playCombo() {
  if (muted) return;
  sequence([N.E5, N.G5, N.C6], 0.07, { at: 0.12, dur: 0.18, gain: 0.05, timbre: "bell" });
}

/** Tras una respuesta no correcta. Deliberadamente NO suena a castigo: nada
 * de tonos graves ni descendentes; es un "¿probamos otra vez?" suave, con
 * una pequeña subida interrogativa y volumen bajo. */
export function playRetry() {
  if (muted) return;
  note(N.A4, { dur: 0.16, gain: 0.05, timbre: "soft" });
  note(N.C5, { at: 0.1, dur: 0.2, gain: 0.05, timbre: "soft" });
}

export function playStar() {
  if (muted) return;
  note(N.E6, { dur: 0.22, gain: 0.05, timbre: "bell" });
  note(N.G6, { at: 0.06, dur: 0.28, gain: 0.04, timbre: "bell" });
}

/** Al pedir una pista — neutro, nunca punitivo (pedir ayuda suma, no resta). */
export function playHint() {
  if (muted) return;
  note(N.D5, { dur: 0.14, gain: 0.055, timbre: "soft" });
  note(N.G5, { at: 0.07, dur: 0.2, gain: 0.055, timbre: "bell" });
}

/** Un gorjeo corto — la mascota "reacciona" junto con el sonido de acierto. */
export function playMascotChirp() {
  if (muted) return;
  note(N.E6, { dur: 0.06, gain: 0.035 });
  note(N.G6, { at: 0.05, dur: 0.08, gain: 0.035 });
}

export function playLevelUp() {
  if (muted) return;
  sequence([N.C5, N.E5, N.G5, N.C6], 0.08, { dur: 0.18, gain: 0.07 });
  note(N.E6, { at: 0.32, dur: 0.45, gain: 0.045, timbre: "bell" });
}

export function playComplete() {
  if (muted) return;
  note(N.C4, { dur: 1, gain: 0.03, timbre: "soft", attack: 0.1 });
  sequence([N.C5, N.E5, N.G5, N.C6], 0.1, { dur: 0.24, gain: 0.07 });
  note(N.E6, { at: 0.4, dur: 0.6, gain: 0.045, timbre: "bell" });
  note(N.G6, { at: 0.5, dur: 0.5, gain: 0.03, timbre: "bell" });
}

/** Cierre cálido del diagnóstico, antes de pasar a la práctica. */
export function playReady() {
  if (muted) return;
  note(N.G5, { dur: 0.18, gain: 0.07 });
  note(N.C6, { at: 0.1, dur: 0.4, gain: 0.07, timbre: "bell" });
}
