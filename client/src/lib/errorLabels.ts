import type { Lang } from "./i18n.js";

/// Nombre para adultos (familia, docentes) de cada tipo de error (ErrorType.code).
export const ERROR_LABELS: Record<Lang, Record<string, string>> = {
  es: {
    E1_OP: "Elegir qué operación usar",
    E2_RES: "Seguir los pasos del procedimiento",
    E2_CAL: "Hacer los cálculos con cuidado",
    E3_PREG: "Entender qué se pregunta",
    E3_DATO: "Usar bien los datos del problema",
    respuesta_rapida: "Tomarse tiempo antes de responder",
    abandono: "Terminar las actividades",
    solicitud_ayuda_repetida: "Intentar antes de pedir pista",
  },
  en: {
    E1_OP: "Choosing the operation",
    E2_RES: "Following the steps",
    E2_CAL: "Calculating carefully",
    E3_PREG: "Understanding the question",
    E3_DATO: "Using the problem's data",
    respuesta_rapida: "Very fast responses",
    abandono: "Unfinished activities",
    solicitud_ayuda_repetida: "Hints used often",
  },
};
