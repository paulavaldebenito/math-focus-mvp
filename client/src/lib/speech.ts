import type { Lang } from "./i18n.js";

export const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

// Nombres de voces femeninas conocidas en los motores más comunes (macOS,
// Chrome/Google, Windows/Edge) — se usa para elegir una voz femenina real,
// no solo para adivinar el idioma. Si ninguna calza, se usa la primera voz
// que coincida con el idioma (mejor una voz masculina que silencio).
const FEMALE_NAME_HINTS = [
  // macOS / Safari
  "monica", "mónica", "paulina", "samantha", "victoria", "ines", "inés",
  // Windows / Edge
  "helena", "sabina", "elvira", "zira", "elena",
  // Chrome / Google
  "google español", "google us english", "google uk english female",
  // genérico
  "female", "mujer", "woman",
];

let voiceCache: SpeechSynthesisVoice[] = [];

function refreshVoices() {
  if (!speechSupported) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) voiceCache = voices;
}

if (speechSupported) {
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

function voicesFor(lang: Lang): SpeechSynthesisVoice[] {
  const prefix = lang === "en" ? "en" : "es";
  return voiceCache.filter((v) => v.lang.toLowerCase().startsWith(prefix));
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const pool = voicesFor(lang);
  if (pool.length === 0) return undefined;

  // Preferir la región exacta si existe (es-CL / en-US); si no, cualquier
  // variante del idioma — mejor un acento distinto que silencio total.
  const exactTag = lang === "en" ? "en-us" : "es-cl";
  const exact = pool.filter((v) => v.lang.toLowerCase() === exactTag);
  const searchIn = exact.length > 0 ? exact : pool;

  const female = searchIn.find((v) =>
    FEMALE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint)),
  );
  return female ?? searchIn[0];
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

function speakNow(text: string, lang: Lang) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(lang);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    // Aunque ya se esperó a que cargaran las voces, sigue sin haber
    // ninguna para este idioma — se deja un lang genérico y ampliamente
    // soportado en vez de "es-CL"/"en-US" exactos.
    utterance.lang = lang === "en" ? "en-US" : "es-ES";
  }
  utterance.rate = 0.9;
  utterance.pitch = 1.05;

  currentUtterance = utterance; // referencia persistente — evita que algunos navegadores la recolecten a mitad de la frase
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);
}

function safeSpeak(text: string, lang: Lang) {
  // Evita un bug conocido de Chrome: cancelar y hablar en el mismo instante
  // puede perder la frase nueva en silencio — solo se cancela si de verdad
  // hay algo sonando, y se espera un instante antes de la frase siguiente.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
    setTimeout(() => speakNow(text, lang), 60);
  } else {
    speakNow(text, lang);
  }
}

/**
 * Narración simple del enunciado — para niños de 1° básico que aún no leen
 * con soltura (requisito de accesibilidad: "lectura en voz alta de todo
 * enunciado"). No lee las opciones de respuesta todavía. El enunciado en sí
 * (contenido curricular) sigue solo en español — `lang` únicamente ajusta el
 * acento/idioma de la voz sintetizada, no traduce el texto.
 *
 * `getVoices()` puede devolver una lista incompleta la primera vez que se
 * consulta en la sesión — comprobado en la práctica: a veces todavía no
 * incluye ninguna voz en español. Si se habla en ese momento sin asignar
 * ninguna voz, el navegador dispara los eventos de inicio/fin como si
 * hubiera hablado pero no produce ningún sonido — silencio total sin
 * ningún error. Por eso, si todavía no hay ninguna voz para el idioma
 * pedido, se espera un momento a que termine de cargar antes de hablar.
 */
export function speak(text: string, lang: Lang = "es") {
  if (!speechSupported) return;
  refreshVoices();

  if (voicesFor(lang).length === 0) {
    let done = false;
    const tryAgain = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.removeEventListener("voiceschanged", tryAgain);
      refreshVoices();
      safeSpeak(text, lang);
    };
    window.speechSynthesis.addEventListener("voiceschanged", tryAgain);
    // Tope de espera por si el navegador nunca avisa (raro, pero pasa) —
    // mejor una voz sin garantía de idioma que dejar la frase colgada.
    setTimeout(tryAgain, 500);
    return;
  }

  safeSpeak(text, lang);
}

export function cancelSpeech() {
  if (!speechSupported) return;
  if (currentUtterance) window.speechSynthesis.cancel();
  currentUtterance = null;
}
