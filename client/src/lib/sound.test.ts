import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// AudioContext falso mínimo: registra osciladores y picos de volumen para
// verificar comportamiento sin audio real (jsdom no tiene Web Audio).
interface FakeRecord {
  oscillators: number;
  peaks: number[];
  created: number;
}

function param() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(function (this: unknown, v: number) {
      record.peaks.push(v);
    }),
  };
}

let record: FakeRecord;

class FakeAudioContext {
  currentTime = 0;
  state = "running";
  destination = {};
  constructor() {
    record.created++;
  }
  resume() {
    return Promise.resolve();
  }
  createGain() {
    return { gain: param(), connect: vi.fn() };
  }
  createOscillator() {
    record.oscillators++;
    return { type: "sine", frequency: param(), detune: param(), connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  }
  createBiquadFilter() {
    return { type: "lowpass", frequency: param(), Q: param(), connect: vi.fn() };
  }
  createDynamicsCompressor() {
    return { threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect: vi.fn() };
  }
}

async function loadSound() {
  vi.resetModules();
  return import("./sound.js");
}

describe("sound", () => {
  beforeEach(() => {
    record = { oscillators: 0, peaks: [], created: 0 };
    window.localStorage.clear();
  });

  afterEach(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });

  it("no falla ni suena cuando no existe AudioContext (jsdom)", async () => {
    const s = await loadSound();
    window.dispatchEvent(new Event("pointerdown"));
    expect(() => {
      s.playClick();
      s.playSelect();
      s.playConfirm();
      s.playBack();
      s.playWelcome();
      s.playCorrect(1);
      s.playRetry();
      s.primeAudio();
    }).not.toThrow();
  });

  it("no crea el contexto de audio antes de un gesto del usuario", async () => {
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    const s = await loadSound();
    s.playWelcome();
    s.playClick();
    expect(record.created).toBe(0);
    expect(record.oscillators).toBe(0);

    window.dispatchEvent(new Event("pointerdown"));
    s.playClick();
    expect(record.created).toBe(1);
    expect(record.oscillators).toBeGreaterThan(0);
  });

  it("respeta el silencio persistido", async () => {
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    window.localStorage.setItem("mathfocus.muted", "1");
    const s = await loadSound();
    window.dispatchEvent(new Event("pointerdown"));
    expect(s.isMuted()).toBe(true);
    s.playWelcome();
    s.playConfirm();
    s.primeAudio();
    expect(record.oscillators).toBe(0);

    s.setMuted(false);
    expect(window.localStorage.getItem("mathfocus.muted")).toBe("0");
    s.playClick();
    expect(record.oscillators).toBeGreaterThan(0);
  });

  it("mantiene todos los picos de volumen en un nivel moderado", async () => {
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    const s = await loadSound();
    window.dispatchEvent(new Event("keydown"));
    s.playClick();
    s.playSelect();
    s.playDeselect();
    s.playConfirm();
    s.playBack();
    s.playWelcome();
    s.playCorrect(0);
    s.playCorrect(5);
    s.playCombo();
    s.playRetry();
    s.playStar();
    s.playHint();
    s.playMascotChirp();
    s.playLevelUp();
    s.playComplete();
    s.playReady();
    expect(record.peaks.length).toBeGreaterThan(0);
    for (const peak of record.peaks) {
      expect(peak).toBeGreaterThan(0);
      expect(peak).toBeLessThanOrEqual(s.MAX_VOICE_GAIN);
    }
  });
});
