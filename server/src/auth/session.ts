import session from "express-session";
import type { RequestHandler } from "express";
import { PrismaSessionStore } from "./sessionStore.js";

declare module "express-session" {
  interface SessionData {
    adultUserId?: string;
  }
}

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET no está definida. Copia .env.example a .env.");
}
// En producción, un secreto corto o el de ejemplo permitiría falsificar cookies de sesión.
if (
  process.env.NODE_ENV === "production" &&
  (secret.length < 32 || secret.startsWith("reemplazar-con"))
) {
  throw new Error("SESSION_SECRET de producción debe ser propio y tener al menos 32 caracteres.");
}

/// Las sesiones viven en Postgres (tabla `http_session`, migración 20261027180000), no en
/// memoria: así un reinicio o despliegue no cierra la sesión de todas las familias y el
/// servidor puede correr en más de una instancia (specs/021).
export const sessionMiddleware = session({
  secret,
  // Borra sesiones vencidas cada 15 min; en pruebas no, para no dejar timers vivos.
  store: new PrismaSessionStore({ pruneIntervalMs: process.env.NODE_ENV === "test" ? false : 15 * 60 * 1000 }),
  name: "mathfocus.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
  },
});

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.adultUserId) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }
  next();
};
