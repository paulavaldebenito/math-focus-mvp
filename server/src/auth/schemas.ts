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
