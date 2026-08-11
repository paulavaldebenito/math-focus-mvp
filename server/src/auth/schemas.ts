import { z } from "zod";

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

// MVP v1: sin campo `grade` — el curso queda fijo en el servidor (1° básico).
// No se acepta desde el cliente para no reabrir por error la cobertura de
// curso en una versión que debe quedar acotada.
export const childProfileSchema = z.object({
  consentId: z.string().min(1),
  displayName: z.string().trim().min(1).max(60),
  language: z.enum(["es", "en"]).default("es"),
});

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

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
