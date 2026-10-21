import { createContext, useContext } from "react";

export type Lang = "es" | "en";

export const LANG_KEY = "mathfocus.lang";

const STRINGS = {
  es: {
    reviewEntry: "🔍 Revisar preguntas",
    reviewTitle: "Modo revisión",
    reviewIntro: "Elige un curso y una habilidad, y responde como lo haría un estudiante. Nada de esto cuenta para el progreso de ningún niño.",
    reviewExit: "Salir de la revisión",
    reviewGrade: "básico",
    reviewExercises: "ejercicios",
    reviewOpenComments: "comentarios pendientes",
    reviewPendingList: "Ver todos los comentarios pendientes",
    reviewNoPending: "No hay comentarios pendientes.",
    reviewBackToSkills: "← Habilidades",
    reviewBackToGrades: "← Cursos",
    reviewPrev: "← Anterior",
    reviewNext: "Siguiente →",
    reviewRetry: "Responder de nuevo",
    reviewNeutral: "sin interés",
    reviewLevel: "nivel",
    reviewCorrectWas: "Respuesta correcta",
    reviewJumpTo: "Ir al ejercicio",
    reviewCommentsTitle: "Comentarios sobre esta pregunta",
    reviewCommentPlaceholder: "¿Qué cambiarías? (redacción, imagen, alternativas, pista, feedback, inglés…)",
    reviewCommentSave: "Guardar comentario",
    reviewCommentDelete: "Borrar",
    reviewCommentErr: "No se pudo guardar el comentario. Intenta de nuevo.",
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
    createChildSubtitle: "MVP: de 1° a 6° básico. Sin datos de salud ni diagnósticos.",
    createChildNameLabel: "Nombre",
    createChildGradeLabel: "Curso",
    grade1Label: "1° básico",
    grade2Label: "2° básico",
    grade3Label: "3° básico",
    grade4Label: "4° básico",
    grade5Label: "5° básico",
    grade6Label: "6° básico",
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
    enlargeImage: "Ampliar imagen",
    imageLegendLabel: "Qué significan las letras de la imagen",
    pictographKey: "Cada dibujo vale 1",
    closeImage: "Cerrar imagen",
    needHint: "Necesito una pista",
    hintLabel: "Pista",
    strategyLabel: "Así se resuelve",
    bonusStarLabel: "¡Racha de 3! Estrella extra",
    mascotStreakMessage: "¡Vas increíble! Sigue así",
    pauseCelebrationMessage: "¡Ganaste una estrella por cuidarte! ⭐",
    checkpointMascotCheer: "¡Qué bien lo estás haciendo!",
    spotErrorLead: "Tu amigo resolvió este problema:",
    spotErrorAsk: "¿Qué crees que le pasó?",
    spotErrorCorrectPrefix: "¡Exacto!",
    spotErrorWrongPrefix: "No fue por eso:",
    spotErrorRevealPrefix: "La respuesta correcta era",
    feedbackCorrect: "Avanzaste un paso más.",
    feedbackReview: "Mira nuevamente este dato.",
    feedbackRetry: "Probemos otra estrategia.",
    comboStreakLabel: "aciertos seguidos",
    prePauseTitle: "Antes de empezar",
    checkInTitle: "¿Cómo estás hoy?",
    checkInHint: "Toca una carita. No hay respuestas buenas ni malas.",
    checkInMoodQuestion: "¿Cómo te sientes hoy?",
    checkInMathQuestion: "¿Cómo te sientes con las matemáticas hoy?",
    checkInDone: "Listo",
    checkInSkip: "Saltar",
    prePauseQuestion: "¿Hacemos un momento de calma antes de la misión?",
    prePauseSkip: "Empezar ahora",
    pauseTitle: "Pausa para respirar",
    pauseQuestion: "¿Quieres tomarte un momento antes de seguir?",
    checkpointTitle: "¡Llegaste a la mitad! 🎉",
    checkpointQuestion: "Es un buen momento para un recreo. ¿Qué prefieres?",
    pauseAccept: "Respiración",
    pauseMovementOption: "Movimiento",
    pauseDecline: "Prefiero seguir",
    pauseSkip: "Prefiero seguirla sentado/a",
    pauseCheckSpace: "Comprueba que tienes espacio a tu alrededor.",
    pauseDone: "Listo",
    sessionDoneTitle: "¡Sesión terminada!",
    sessionDoneBody: "Buen trabajo hoy.",
    sessionDoneHabitatPrefix: "Con cada sesión le haces más espacio a",
    backHome: "Volver al inicio",
    progressTitle: "Progreso de",
    progressNote: "Este progreso es personal — no se compara con otros niños.",
    progressSessions: "Sesiones practicadas:",
    progressLastSession: "Última sesión:",
    progressAccuracy: "Precisión general:",
    progressNoData: "Todavía sin datos",
    progressLevel: "Nivel actual:",
    progressWhereToPractice: "Dónde practicar más:",
    progressHomeTipsTitle: "Ideas para practicar en casa:",
    progressBack: "Volver",
    progressErr: "No se pudo cargar el progreso. Intenta de nuevo en un momento.",
    progressNotYetPracticed: "Todavía no ha practicado",
    langToggleLabel: "ES",
    chooseLanguageLabel: "Elige el idioma",
    soundOnLabel: "Silenciar sonido",
    soundOffLabel: "Activar sonido",
    profileGreetingPrefix: "Hola,",
    practiceAgain: "Ver mapa",
    viewProgress: "Ver progreso",
    rankLabel: "Rango",
    starsToNextRankPrefix: "Faltan",
    starsToNextRankSuffix: "estrellas para el siguiente rango",
    mapTitle: "Mapa de aprendizaje",
    mapLoadErr: "No se pudo cargar el mapa.",
    mapBack: "Inicio",
    mapStartNode: "¡Empezar!",
    mapLockedNode: "Todavía no — completa lo anterior",
    mapCompletedNode: "Completado",
    sessionCorrectCount: "correctas",
    logout: "Cerrar sesión",
    chooseCompanionTitle: "Elige tu compañero",
    mascotNameLabel: "¿Cómo se llama?",
    mascotNamePlaceholder: "Ponle un nombre",
    changeMascotName: "Cambiar tu mascota o su nombre",
    chooseCompanionContinue: "¡Listo, empezar!",
    chooseInterestTitle: "¿Qué te gusta más?",
    chooseInterestHint: "Elige hasta 3",
    changeInterests: "Cambiar mis intereses",
    chooseInterestContinue: "¡Listo, empezar!",
    streakDays: "días seguidos",
    streakDay: "día seguido",
    starsToday: "estrellas hoy",
    starsTotal: "estrellas en total",
    starsEarnedThisSession: "estrellas ganadas hoy",
  },
  en: {
    reviewEntry: "🔍 Review questions",
    reviewTitle: "Review mode",
    reviewIntro: "Pick a grade and a skill, and answer the way a student would. None of this counts toward any child's progress.",
    reviewExit: "Leave review",
    reviewGrade: "grade",
    reviewExercises: "exercises",
    reviewOpenComments: "open comments",
    reviewPendingList: "See all open comments",
    reviewNoPending: "No open comments.",
    reviewBackToSkills: "← Skills",
    reviewBackToGrades: "← Grades",
    reviewPrev: "← Previous",
    reviewNext: "Next →",
    reviewRetry: "Answer again",
    reviewNeutral: "no interest",
    reviewLevel: "level",
    reviewCorrectWas: "Correct answer",
    reviewJumpTo: "Go to exercise",
    reviewCommentsTitle: "Comments on this question",
    reviewCommentPlaceholder: "What would you change? (wording, picture, options, hint, feedback, English…)",
    reviewCommentSave: "Save comment",
    reviewCommentDelete: "Delete",
    reviewCommentErr: "The comment couldn't be saved. Please try again.",
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
    createChildSubtitle: "MVP: 1st to 6th grade. No health data or diagnoses.",
    createChildNameLabel: "Name",
    createChildGradeLabel: "Grade",
    grade1Label: "1st grade",
    grade2Label: "2nd grade",
    grade3Label: "3rd grade",
    grade4Label: "4th grade",
    grade5Label: "5th grade",
    grade6Label: "6th grade",
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
    enlargeImage: "Zoom in",
    imageLegendLabel: "What the letters in the picture mean",
    pictographKey: "Each picture stands for 1",
    closeImage: "Close picture",
    needHint: "I need a hint",
    hintLabel: "Hint",
    strategyLabel: "Here's how",
    spotErrorLead: "Your friend solved this problem:",
    spotErrorAsk: "What do you think happened?",
    spotErrorCorrectPrefix: "Exactly!",
    spotErrorWrongPrefix: "That's not quite it:",
    spotErrorRevealPrefix: "The correct answer was",
    bonusStarLabel: "3 in a row! Bonus star",
    mascotStreakMessage: "You're doing amazing! Keep it up",
    pauseCelebrationMessage: "You earned a star for taking care of yourself! ⭐",
    checkpointMascotCheer: "You're doing so great!",
    feedbackCorrect: "You moved a step forward.",
    feedbackReview: "Take another look at this.",
    feedbackRetry: "Let's try another strategy.",
    comboStreakLabel: "in a row",
    prePauseTitle: "Before we start",
    checkInTitle: "How are you today?",
    checkInHint: "Tap a face. There are no right or wrong answers.",
    checkInMoodQuestion: "How do you feel today?",
    checkInMathQuestion: "How do you feel about math today?",
    checkInDone: "Done",
    checkInSkip: "Skip",
    prePauseQuestion: "Want a calm moment before the mission?",
    prePauseSkip: "Start now",
    pauseTitle: "Breathing pause",
    pauseQuestion: "Do you want a moment before continuing?",
    checkpointTitle: "You're halfway there! 🎉",
    checkpointQuestion: "Good time for a break. What would you like?",
    pauseAccept: "Breathing",
    pauseMovementOption: "Movement",
    pauseDecline: "I'd rather keep going",
    pauseSkip: "I'd rather do it sitting down",
    pauseCheckSpace: "Check that you have space around you.",
    pauseDone: "Done",
    sessionDoneTitle: "Session complete!",
    sessionDoneBody: "Great work today.",
    sessionDoneHabitatPrefix: "Every session makes more room for",
    backHome: "Back to home",
    progressTitle: "Progress for",
    progressNote: "This progress is personal — it's never compared to other children.",
    progressSessions: "Sessions practiced:",
    progressLastSession: "Last session:",
    progressAccuracy: "Overall accuracy:",
    progressNoData: "No data yet",
    progressLevel: "Current level:",
    progressWhereToPractice: "Where to practice more:",
    progressHomeTipsTitle: "Ideas to practice at home:",
    progressBack: "Back",
    progressErr: "Couldn't load progress. Try again in a moment.",
    progressNotYetPracticed: "Hasn't practiced yet",
    langToggleLabel: "EN",
    chooseLanguageLabel: "Choose your language",
    soundOnLabel: "Mute sound",
    soundOffLabel: "Unmute sound",
    profileGreetingPrefix: "Hi,",
    practiceAgain: "View map",
    viewProgress: "View progress",
    rankLabel: "Rank",
    starsToNextRankPrefix: "",
    starsToNextRankSuffix: "stars to the next rank",
    mapTitle: "Learning map",
    mapLoadErr: "Couldn't load the map.",
    mapBack: "Home",
    mapStartNode: "Start!",
    mapLockedNode: "Not yet — finish the one before it first",
    mapCompletedNode: "Completed",
    sessionCorrectCount: "correct",
    logout: "Log out",
    chooseCompanionTitle: "Choose your companion",
    mascotNameLabel: "What's their name?",
    mascotNamePlaceholder: "Give them a name",
    changeMascotName: "Change your mascot or its name",
    chooseCompanionContinue: "Ready, let's start!",
    chooseInterestTitle: "What do you like most?",
    chooseInterestHint: "Pick up to 3",
    changeInterests: "Change my interests",
    chooseInterestContinue: "Ready, let's start!",
    streakDays: "day streak",
    streakDay: "day streak",
    starsToday: "stars today",
    starsTotal: "total stars",
    starsEarnedThisSession: "stars earned today",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["es"];

/**
 * Variantes del texto de feedback tras responder — para que las 6 preguntas
 * de una sesión no repitan siempre la misma frase. Cálidas, sin lenguaje
 * clínico, ninguna culpa al niño por un error (mismo criterio que
 * `feedbackRetry`/`feedbackCorrect`, que se dejan además como respaldo).
 * Fuera de `STRINGS`/`t()` porque son listas, no un valor único por clave.
 */
export const FEEDBACK_CORRECT_VARIANTS: Record<Lang, string[]> = {
  es: ["¡Avanzaste un paso más!", "¡Así se hace!", "¡Muy bien pensado!", "¡Genial, sigamos!"],
  en: ["You moved a step forward!", "Nicely done!", "Great thinking!", "Awesome, let's keep going!"],
};

export const FEEDBACK_RETRY_VARIANTS: Record<Lang, string[]> = {
  es: ["Probemos otra estrategia.", "Casi. Intentemos de otra forma.", "Vamos por otro camino."],
  en: ["Let's try another strategy.", "So close. Let's try it another way.", "Let's take another path."],
};

/**
 * Mensaje concreto y accionable según el `ErrorType.code` clasificado en la
 * alternativa elegida (E1_OP/E2_RES/E2_CAL/E3_PREG/E3_DATO — ver seed.ts).
 * Reemplaza al texto genérico de `FEEDBACK_RETRY_VARIANTS` cuando el
 * ejercicio ya tiene esa clasificación cargada — hoy cubre desde 1° hasta
 * 6° básico (no solo suma/resta: también fracciones, porcentajes, razones,
 * valor posicional...). E1_OP y E2_RES se redactan a propósito SIN nombrar
 * una operación puntual ("sumar o restar", "reagrupar") — esa redacción
 * original solo calzaba con 1°-2° básico y era un consejo equivocado para,
 * por ejemplo, un ejercicio de razones de 6° básico donde el error real es
 * de multiplicación/proporción, no de suma/resta.
 * Redactado para el niño, no para el adulto — `ErrorType.description` en el
 * servidor es la versión clínica que ve la familia en el tablero, esta es
 * la que ayuda a mejorar en el momento. Ninguno culpa al niño por el error.
 */
export const ERROR_FEEDBACK: Record<Lang, Record<string, string>> = {
  es: {
    E1_OP: "Antes de calcular, piensa bien qué necesitas hacer con estos números para responder la pregunta.",
    E2_RES: "Revisa tu procedimiento paso a paso: puede que se haya saltado un paso o que el orden no sea el correcto.",
    E2_CAL: "Parece que hubo un error de cálculo. Revisa la cuenta paso a paso, con calma.",
    E3_PREG: "Vuelve a leer la pregunta: ¿qué es exactamente lo que te están preguntando?",
    E3_DATO: "Revisa los números del enunciado: puede que hayas usado uno equivocado.",
  },
  en: {
    E1_OP: "Before calculating, think carefully about what you need to do with these numbers to answer the question.",
    E2_RES: "Check your steps one by one: a step may have been skipped or done in the wrong order.",
    E2_CAL: "It looks like there was a calculation mistake. Check your work step by step.",
    E3_PREG: "Reread the question: what exactly is it asking for?",
    E3_DATO: "Check the numbers in the problem — you may have used the wrong one.",
  },
};

/**
 * Etiquetas cortas por código de ErrorType, para la ronda "detecta el
 * error": tanto para las alternativas de diagnóstico que el niño elige
 * (redactadas en tercera persona, sobre una respuesta AJENA — distinto de
 * ERROR_FEEDBACK, que le habla en segunda persona sobre SU PROPIO error)
 * como para revelar cuál era la real al terminar de diagnosticar.
 */
export const DIAGNOSIS_CHIPS: Record<Lang, Record<string, string>> = {
  es: {
    E1_OP: "Se confundió de operación",
    E2_RES: "Se equivocó en un paso del procedimiento",
    E2_CAL: "Tuvo un error de cálculo",
    E3_PREG: "No respondió lo que se preguntaba",
    E3_DATO: "Usó mal un dato del problema",
  },
  en: {
    E1_OP: "Mixed up the operation",
    E2_RES: "Made a mistake in one of the steps",
    E2_CAL: "Made a calculation mistake",
    E3_PREG: "Didn't answer what was asked",
    E3_DATO: "Used the wrong number from the problem",
  },
};

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
