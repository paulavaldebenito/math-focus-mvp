import session from "express-session";
import type { RequestHandler } from "express";

declare module "express-session" {
  interface SessionData {
    adultUserId?: string;
  }
}

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET no está definida. Copia .env.example a .env.");
}

/// MVP: MemoryStore (por defecto). No apto para producción con más de un
/// proceso — pendiente decidir un store persistente (ej. sesiones en
/// Postgres) antes de desplegar. Ver README.
export const sessionMiddleware = session({
  secret,
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
