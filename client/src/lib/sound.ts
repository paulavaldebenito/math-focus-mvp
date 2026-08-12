const MUTE_KEY = "mathfocus.muted";

let ctx: AudioContext | null = null;
let muted = typeof window !== "undefined" && window.localStorage.getItem(MUTE_KEY) === "1";

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, startTime: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(audio.destination);
  const t0 = audio.currentTime + startTime;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
}

export function playCorrect() {
  if (muted) return;
  tone(523.25, 0, 0.12, "sine", 0.18);
  tone(783.99, 0.08, 0.18, "sine", 0.18);
}

export function playRetry() {
  if (muted) return;
  tone(330, 0, 0.18, "sine", 0.1);
}

export function playStar() {
  if (muted) return;
  tone(1046.5, 0, 0.1, "triangle", 0.1);
}

/** Al pedir una pista — neutro, nunca punitivo (pedir ayuda suma, no resta). */
export function playHint() {
  if (muted) return;
  tone(698.46, 0, 0.09, "sine", 0.09);
  tone(880, 0.06, 0.12, "sine", 0.09);
}

/** Un chirrido corto y agudo — la mascota "reacciona" junto con el sonido de acierto. */
export function playMascotChirp() {
  if (muted) return;
  tone(1318.5, 0, 0.05, "sine", 0.07);
  tone(1567.98, 0.05, 0.06, "sine", 0.07);
}

export function playLevelUp() {
  if (muted) return;
  tone(523.25, 0, 0.1, "square", 0.08);
  tone(659.25, 0.08, 0.1, "square", 0.08);
  tone(783.99, 0.16, 0.18, "square", 0.1);
}

export function playComplete() {
  if (muted) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.22, "sine", 0.14));
}

/** Clic neutro al elegir una respuesta en el diagnóstico — no indica acierto
 * ni error, solo confirma que la elección se registró. */
export function playSelect() {
  if (muted) return;
  tone(440, 0, 0.07, "sine", 0.08);
}

/** Cierre cálido del diagnóstico, antes de pasar a la práctica. */
export function playReady() {
  if (muted) return;
  tone(659.25, 0, 0.12, "sine", 0.12);
  tone(880, 0.1, 0.16, "sine", 0.12);
}
