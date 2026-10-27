import { z } from "zod";
import { COMPANION_KEYS } from "../domain/companions.js";
import { INTEREST_KEYS, MAX_INTERESTS } from "../domain/interests.js";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const consentSchema = z.object({
  scope: z.string().trim().min(10, "Describe brevemente qué se consiente (mínimo 10 caracteres)."),
});

export type ConsentInput = z.infer<typeof consentSchema>;

// Cursos con banco de ejercicios sembrado (1° a 6° básico). Whitelist
// explícita — no un rango abierto — para no aceptar por error un curso sin
// contenido todavía. Ver specs/004-expansion-2basico y
// specs/006-expansion-3a6-basico.
export const SUPPORTED_GRADES = [1, 2, 3, 4, 5, 6] as const;

export const childProfileSchema = z.object({
  consentId: z.string().min(1),
  displayName: z.string().trim().min(1).max(60),
  grade: z.number().int().refine((g) => (SUPPORTED_GRADES as readonly number[]).includes(g), {
    message: `El curso debe ser uno de: ${SUPPORTED_GRADES.join(", ")}.`,
  }),
  language: z.enum(["es", "en"]).default("es"),
  /// Consentimiento aparte para la pregunta social semanal (specs/018). Opcional.
  socialCheckInConsent: z.boolean().default(false),
});

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

export const companionSchema = z.object({
  companion: z.enum(COMPANION_KEYS),
});

export type CompanionInput = z.infer<typeof companionSchema>;

export const interestsSchema = z.object({
  interests: z
    .array(z.enum(INTEREST_KEYS))
    .min(1, "Elige al menos un interés.")
    .max(MAX_INTERESTS, `Elige como máximo ${MAX_INTERESTS} intereses.`)
    .refine((list) => new Set(list).size === list.length, { message: "No repitas intereses." }),
});

export type InterestsInput = z.infer<typeof interestsSchema>;

// Tope de largo generoso para un nombre inventado por un niño — no es
// moderación de contenido (esto no se comparte con nadie más), solo evita un
// texto absurdamente largo rompiendo el layout donde se muestra el nombre.
const MASCOT_NAME_MAX_LENGTH = 20;

export const mascotNameSchema = z.object({
  mascotName: z
    .string()
    .trim()
    .min(1, "El nombre no puede estar vacío.")
    .max(MASCOT_NAME_MAX_LENGTH, `El nombre puede tener como máximo ${MASCOT_NAME_MAX_LENGTH} caracteres.`),
});

export type MascotNameInput = z.infer<typeof mascotNameSchema>;

/// Una respuesta de la evaluación de ubicación (specs/020): se envía de a una, porque la siguiente
/// pregunta depende de esta.
export const placementAnswerSchema = z
  .object({
    exerciseId: z.string().min(1),
    selectedOptionId: z.string().min(1).optional(),
    /// «Todavía no lo sé»: cuenta como no dominada sin obligar a adivinar.
    dontKnow: z.literal(true).optional(),
    responseTimeMs: z.number().int().positive().optional(),
  })
  .refine((a) => Boolean(a.selectedOptionId) !== Boolean(a.dontKnow), "Elige una alternativa o «todavía no lo sé».");
