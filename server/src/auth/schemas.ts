import { z } from "zod";
import { COMPANION_KEYS } from "../domain/companions.js";

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

// Cursos con banco de ejercicios real (Números y operaciones). Whitelist
// explícita — no un rango abierto — para no aceptar por error un curso sin
// contenido todavía. Ver specs/004-expansion-2basico/spec.md.
export const SUPPORTED_GRADES = [1, 2] as const;

export const childProfileSchema = z.object({
  consentId: z.string().min(1),
  displayName: z.string().trim().min(1).max(60),
  grade: z.number().int().refine((g) => (SUPPORTED_GRADES as readonly number[]).includes(g), {
    message: `El curso debe ser uno de: ${SUPPORTED_GRADES.join(", ")}.`,
  }),
  language: z.enum(["es", "en"]).default("es"),
});

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

export const companionSchema = z.object({
  companion: z.enum(COMPANION_KEYS),
});

export type CompanionInput = z.infer<typeof companionSchema>;

export const initialAssessmentAttemptsSchema = z.object({
  attempts: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        selectedOptionId: z.string().min(1),
        responseTimeMs: z.number().int().positive().optional(),
      }),
    )
    .min(3, "La evaluación inicial requiere al menos 3 respuestas.")
    .max(5, "La evaluación inicial no debe exceder 5 preguntas."),
});

export type InitialAssessmentAttemptsInput = z.infer<typeof initialAssessmentAttemptsSchema>;
