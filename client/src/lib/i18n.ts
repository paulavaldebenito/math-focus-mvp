import { createContext, useContext } from "react";

export type Lang = "es" | "en";

export const LANG_KEY = "mathfocus.lang";

const STRINGS = {
  es: {
    appName: "Math Focus",
    authTitle: "Math Focus",
    authLoginTitle: "Inicia sesión",
    authRegisterTitle: "Crea tu cuenta",
    authSubtitle: "Cuenta del adulto responsable — el perfil de tu hijo/a se crea después.",
    authEmail: "Correo electrónico",
    authPassword: "Contraseña",
    authPasswordHint: "Al menos 8 caracteres.",
    authSubmitting: "Un momento…",
    authLogin: "Iniciar sesión",
    authRegister: "Crear cuenta",
    authSwitchToRegister: "¿No tienes cuenta? Regístrate",
    authSwitchToLogin: "¿Ya tienes cuenta? Inicia sesión",
    authErrEmailTaken: "Ese correo ya tiene una cuenta. Intenta iniciar sesión.",
    authErrInvalidCredentials: "Correo o contraseña incorrectos.",
    authErrInvalidPayloadRegister: "Revisa el correo y usa una contraseña de al menos 8 caracteres.",
    authErrInvalidPayloadLogin: "Revisa el correo y la contraseña.",
    authErrGeneric: "Algo no funcionó. Intenta de nuevo en un momento.",
    consentTitle: "Antes de continuar",
    consentCheckboxLabel: "He leído lo anterior y doy mi consentimiento como adulto responsable.",
    consentErr: "No se pudo registrar el consentimiento. Intenta de nuevo.",
    consentErrGeneric: "Algo no funcionó.",
    continueBtn: "Continuar",
    createChildTitle: "Crea el perfil de tu hijo/a",
    createChildSubtitle: "MVP: por ahora solo 1° básico. Sin datos de salud ni diagnósticos.",
    createChildNameLabel: "Nombre",
    createChildErrConsentUsed: "Ese consentimiento ya se usó para otro perfil.",
    createChildErrGeneric: "No se pudo crear el perfil. Revisa el nombre e intenta de nuevo.",
    loading: "Cargando…",
    preparingPractice: "Preparando tu práctica…",
    genericError: "No se pudo continuar. Intenta de nuevo en un momento.",
    retryButton: "Intentar de nuevo",
    assessmentLoadErr: "No se pudo cargar la evaluación. Intenta de nuevo en un momento.",
    assessmentSubmitErr: "No se pudo guardar la evaluación. Intenta de nuevo en un momento.",
    assessmentIntroTitle: "Vamos a conocernos",
    assessmentIntroBody: "Unas preguntas cortas para saber cómo ayudarte mejor. No hay respuestas malas.",
    assessmentIntroStart: "Empezar",
    assessmentOutroTitle: "¡Perfecto!",
    assessmentOutroBody: "Ya sé cómo armar tu primera misión.",
    assessmentOutroContinue: "Vamos a practicar",
    level: "nivel",
    listenAgain: "Escuchar de nuevo",
    needHint: "Necesito una pista",
    hintLabel: "Pista",
    feedbackCorrect: "Avanzaste un paso más.",
    feedbackReview: "Mira nuevamente este dato.",
    feedbackRetry: "Probemos otra estrategia.",
    prePauseTitle: "Antes de empezar",
    prePauseQuestion: "¿Hacemos un momento de calma antes de la misión?",
    prePauseSkip: "Empezar ahora",
    pauseTitle: "Pausa para respirar",
    pauseQuestion: "¿Quieres tomarte un momento antes de seguir?",
    pauseAccept: "Respiración",
    pauseMovementOption: "Movimiento",
    pauseDecline: "Prefiero seguir",
    pauseSkip: "Prefiero seguirla sentado/a",
    pauseCheckSpace: "Comprueba que tienes espacio a tu alrededor.",
    pauseDone: "Listo",
    sessionDoneTitle: "¡Sesión terminada!",
    sessionDoneBody: "Buen trabajo hoy.",
    backHome: "Volver al inicio",
    progressTitle: "Progreso de",
    progressNote: "Este progreso es personal — no se compara con otros niños.",
    progressSessions: "Sesiones practicadas:",
    progressLastSession: "Última sesión:",
    progressAccuracy: "Precisión general:",
    progressNoData: "Todavía sin datos",
    progressLevel: "Nivel actual:",
    progressWhereToPractice: "Dónde practicar más:",
    progressBack: "Volver",
    progressErr: "No se pudo cargar el progreso. Intenta de nuevo en un momento.",
    progressNotYetPracticed: "Todavía no ha practicado",
    langToggleLabel: "ES",
    chooseLanguageLabel: "Elige el idioma",
    soundOnLabel: "Silenciar sonido",
    soundOffLabel: "Activar sonido",
    profileGreetingPrefix: "Hola,",
    practiceAgain: "Practicar de nuevo",
    viewProgress: "Ver progreso",
    logout: "Cerrar sesión",
    chooseCompanionTitle: "Elige tu compañero",
    chooseCompanionContinue: "¡Listo, empezar!",
    streakDays: "días seguidos",
    streakDay: "día seguido",
    starsToday: "estrellas hoy",
    starsTotal: "estrellas en total",
    starsEarnedThisSession: "estrellas ganadas hoy",
  },
  en: {
    appName: "Math Focus",
    authTitle: "Math Focus",
    authLoginTitle: "Log in",
    authRegisterTitle: "Create your account",
    authSubtitle: "Account for the responsible adult — your child's profile is created next.",
    authEmail: "Email",
    authPassword: "Password",
    authPasswordHint: "At least 8 characters.",
    authSubmitting: "One moment…",
    authLogin: "Log in",
    authRegister: "Create account",
    authSwitchToRegister: "No account yet? Sign up",
    authSwitchToLogin: "Already have an account? Log in",
    authErrEmailTaken: "That email already has an account. Try logging in.",
    authErrInvalidCredentials: "Wrong email or password.",
    authErrInvalidPayloadRegister: "Check the email and use a password with at least 8 characters.",
    authErrInvalidPayloadLogin: "Check the email and password.",
    authErrGeneric: "Something didn't work. Try again in a moment.",
    consentTitle: "Before you continue",
    consentCheckboxLabel: "I have read the above and give my consent as the responsible adult.",
    consentErr: "Couldn't record consent. Try again.",
    consentErrGeneric: "Something didn't work.",
    continueBtn: "Continue",
    createChildTitle: "Create your child's profile",
    createChildSubtitle: "MVP: 1st grade only for now. No health data or diagnoses.",
    createChildNameLabel: "Name",
    createChildErrConsentUsed: "That consent was already used for another profile.",
    createChildErrGeneric: "Couldn't create the profile. Check the name and try again.",
    loading: "Loading…",
    preparingPractice: "Getting your practice ready…",
    genericError: "Couldn't continue. Try again in a moment.",
    retryButton: "Try again",
    assessmentLoadErr: "Couldn't load the assessment. Try again in a moment.",
    assessmentSubmitErr: "Couldn't save the assessment. Try again in a moment.",
    assessmentIntroTitle: "Let's get to know each other",
    assessmentIntroBody: "A few short questions so I know how to help you best. There are no wrong answers.",
    assessmentIntroStart: "Start",
    assessmentOutroTitle: "Perfect!",
    assessmentOutroBody: "Now I know how to build your first mission.",
    assessmentOutroContinue: "Let's practice",
    level: "level",
    listenAgain: "Listen again",
    needHint: "I need a hint",
    hintLabel: "Hint",
    feedbackCorrect: "You moved a step forward.",
    feedbackReview: "Take another look at this.",
    feedbackRetry: "Let's try another strategy.",
    prePauseTitle: "Before we start",
    prePauseQuestion: "Want a calm moment before the mission?",
    prePauseSkip: "Start now",
    pauseTitle: "Breathing pause",
    pauseQuestion: "Do you want a moment before continuing?",
    pauseAccept: "Breathing",
    pauseMovementOption: "Movement",
    pauseDecline: "I'd rather keep going",
    pauseSkip: "I'd rather do it sitting down",
    pauseCheckSpace: "Check that you have space around you.",
    pauseDone: "Done",
    sessionDoneTitle: "Session complete!",
    sessionDoneBody: "Great work today.",
    backHome: "Back to home",
    progressTitle: "Progress for",
    progressNote: "This progress is personal — it's never compared to other children.",
    progressSessions: "Sessions practiced:",
    progressLastSession: "Last session:",
    progressAccuracy: "Overall accuracy:",
    progressNoData: "No data yet",
    progressLevel: "Current level:",
    progressWhereToPractice: "Where to practice more:",
    progressBack: "Back",
    progressErr: "Couldn't load progress. Try again in a moment.",
    progressNotYetPracticed: "Hasn't practiced yet",
    langToggleLabel: "EN",
    chooseLanguageLabel: "Choose your language",
    soundOnLabel: "Mute sound",
    soundOffLabel: "Unmute sound",
    profileGreetingPrefix: "Hi,",
    practiceAgain: "Practice again",
    viewProgress: "View progress",
    logout: "Log out",
    chooseCompanionTitle: "Choose your companion",
    chooseCompanionContinue: "Ready, let's start!",
    streakDays: "day streak",
    streakDay: "day streak",
    starsToday: "stars today",
    starsTotal: "total stars",
    starsEarnedThisSession: "stars earned today",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["es"];

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang]?.[key] ?? STRINGS.es[key] ?? key;
}

/**
 * Contenido de datos (no de interfaz): usa la traducción en inglés si
 * existe, si no cae de vuelta al español — nunca deja el texto vacío.
 */
export function localize(lang: Lang, es: string, en: string | null | undefined): string {
  return lang === "en" && en ? en : es;
}

export interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

// Valor por defecto (no null) a propósito: las pantallas se testean muchas
// veces de forma aislada, sin envolverlas en <LangProvider> — deben poder
// llamar useLang() igual y quedarse en español por defecto.
export const LangReactContext = createContext<LangContextValue>({ lang: "es", setLang: () => {} });

export function loadStoredLang(): Lang {
  if (typeof window === "undefined") return "es";
  const stored = window.localStorage.getItem(LANG_KEY);
  return stored === "en" ? "en" : "es";
}

export function useLang() {
  return useContext(LangReactContext);
}
