import type { RequestHandler } from "express";
import { prisma } from "../db/prisma.js";

/**
 * Cuentas adultas con acceso al modo revisión (todos los cursos, respuestas
 * y feedback de cada alternativa): solo las de REVIEWER_EMAILS, separadas por
 * coma. Sin la variable, nadie es revisora — una familia cualquiera nunca ve
 * el banco completo. Se lee en cada llamada para que los tests puedan fijarla.
 */
export function isReviewerEmail(email: string): boolean {
  const list = (process.env.REVIEWER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/** Datos públicos del adulto: nunca passwordHash. */
export function adultPublic(adult: { id: string; email: string }) {
  return { id: adult.id, email: adult.email, isReviewer: isReviewerEmail(adult.email) };
}

/** Exige sesión iniciada y que la cuenta esté en REVIEWER_EMAILS (403 si no). */
export const requireReviewer: RequestHandler = async (req, res, next) => {
  if (!req.session.adultUserId) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }
  const adult = await prisma.adultUser.findUnique({ where: { id: req.session.adultUserId } });
  if (!adult) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }
  if (!isReviewerEmail(adult.email)) {
    res.status(403).json({ error: "not_reviewer" });
    return;
  }
  next();
};
