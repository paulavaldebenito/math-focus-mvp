import { rateLimit } from "express-rate-limit";
import type { RequestHandler } from "express";

/// Límite de intentos por IP para los endpoints donde se puede adivinar algo (contraseña, código
/// de colegio o de curso). Sin esto se podrían probar contraseñas de familias, o códigos de
/// colegio — que dan acceso docente a datos de niños — sin parar (specs/021).
/// El contador vive en memoria del proceso: suficiente con una instancia; con varias, cada una
/// cuenta por separado (el límite efectivo se multiplica, sigue acotado).
export function attemptLimiter(limit: number, windowMs: number): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "too_many_attempts" },
  });
}

// Solo en producción: en local, pruebas y E2E todo llega desde 127.0.0.1 y la suite registra
// muchas cuentas seguidas. El limitador en sí se prueba aparte (rateLimit.test.ts).
const inProduction = process.env.NODE_ENV === "production";
const passThrough: RequestHandler = (_req, _res, next) => next();
const forEnv = (limiter: () => RequestHandler) => (inProduction ? limiter() : passThrough);

const MIN = 60 * 1000;

export const loginLimiter = forEnv(() => attemptLimiter(10, 15 * MIN));
export const registerLimiter = forEnv(() => attemptLimiter(10, 60 * MIN));
/// Cambiar el PIN familiar exige la contraseña de la cuenta: mismo riesgo que el login.
export const passwordCheckLimiter = forEnv(() => attemptLimiter(10, 15 * MIN));
export const joinCodeLimiter = forEnv(() => attemptLimiter(20, 15 * MIN));
