import type { Lang } from "./i18n.js";

/// Nombre para adultos (familia, docentes) de cada tipo de error (ErrorType.code).
export const ERROR_LABELS: Record<Lang, Record<string, string>> = {
  es: {
    E1_OP: "Confusión de operación",
    E2_RES: "Reagrupación/procedimiento",
    E2_CAL: "Cálculo puntual",
    E3_PREG: "Comprensión del enunciado",
    E3_DATO: "Uso de un dato del enunciado",
    respuesta_rapida: "Respuestas muy rápidas",
    abandono: "Actividades sin terminar",
    solicitud_ayuda_repetida: "Pistas usadas seguido",
  },
  en: {
    E1_OP: "Operation confusion",
    E2_RES: "Regrouping/procedure",
    E2_CAL: "One-off calculation slip",
    E3_PREG: "Understanding the question",
    E3_DATO: "Using a detail from the question",
    respuesta_rapida: "Very fast responses",
    abandono: "Unfinished activities",
    solicitud_ayuda_repetida: "Hints used often",
  },
};
