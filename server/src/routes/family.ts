import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { hashPassword, verifyPassword } from "../auth/password.js";

/**
 * Espacio familia (specs/018). El niño y el adulto usan la misma app y la misma cuenta, así que el
 * panel familiar (progreso, emociones, señales sociales, consentimientos) queda detrás de un PIN de
 * 4 dígitos que crea el adulto con su contraseña. Al ingresarlo, la sesión queda desbloqueada por
 * FAMILY_UNLOCK_MS; después vuelve a pedirse. Tras MAX_FAILS intentos fallidos se bloquea por
 * LOCKOUT_MS (un PIN de 4 dígitos solo protege si no se puede probar uno tras otro).
 */
declare module "express-session" {
  interface SessionData {
    familyUnlockedUntil?: number;
    familyPinFails?: number;
    familyPinLockedUntil?: number;
  }
}

export const FAMILY_UNLOCK_MS = 30 * 60 * 1000;
const MAX_FAILS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

const pinSchema = z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos.");

/// Exige el espacio familia desbloqueado. 403 `family_pin_required` si el adulto aún no crea su
/// PIN, 403 `family_locked` si lo tiene pero la sesión no está desbloqueada.
export const requireFamilyUnlock: RequestHandler = async (req, res, next) => {
  const adult = await prisma.adultUser.findUnique({ where: { id: req.session.adultUserId! }, select: { familyPinHash: true } });
  if (!adult?.familyPinHash) {
    res.status(403).json({ error: "family_pin_required" });
    return;
  }
  if (!req.session.familyUnlockedUntil || req.session.familyUnlockedUntil < Date.now()) {
    res.status(403).json({ error: "family_locked" });
    return;
  }
  next();
};

export const familyRouter = Router();

familyRouter.get("/status", requireAuth, async (req, res) => {
  const adult = await prisma.adultUser.findUnique({ where: { id: req.session.adultUserId! }, select: { familyPinHash: true, plan: true } });
  res.status(200).json({
    hasPin: !!adult?.familyPinHash,
    unlocked: !!req.session.familyUnlockedUntil && req.session.familyUnlockedUntil > Date.now(),
    plan: adult?.plan ?? "gratis",
  });
});

/// Crear o cambiar el PIN: siempre con la contraseña de la cuenta (así un niño que conoce el PIN no
/// puede cambiarlo, y un adulto que lo olvidó lo recupera). Deja el espacio desbloqueado.
familyRouter.put("/pin", requireAuth, async (req, res) => {
  const parsed = z.object({ pin: pinSchema, password: z.string().min(1) }).strict().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const adult = await prisma.adultUser.findUnique({ where: { id: req.session.adultUserId! } });
  if (!adult || !verifyPassword(parsed.data.password, adult.passwordHash)) {
    res.status(401).json({ error: "wrong_password" });
    return;
  }
  await prisma.adultUser.update({ where: { id: adult.id }, data: { familyPinHash: hashPassword(parsed.data.pin) } });
  req.session.familyPinFails = 0;
  req.session.familyPinLockedUntil = undefined;
  req.session.familyUnlockedUntil = Date.now() + FAMILY_UNLOCK_MS;
  res.status(204).end();
});

familyRouter.post("/unlock", requireAuth, async (req, res) => {
  if (req.session.familyPinLockedUntil && req.session.familyPinLockedUntil > Date.now()) {
    res.status(429).json({ error: "too_many_attempts", retryAfterMs: req.session.familyPinLockedUntil - Date.now() });
    return;
  }
  const parsed = z.object({ pin: pinSchema }).strict().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }
  const adult = await prisma.adultUser.findUnique({ where: { id: req.session.adultUserId! }, select: { familyPinHash: true } });
  if (!adult?.familyPinHash) {
    res.status(403).json({ error: "family_pin_required" });
    return;
  }
  if (!verifyPassword(parsed.data.pin, adult.familyPinHash)) {
    const fails = (req.session.familyPinFails ?? 0) + 1;
    req.session.familyPinFails = fails;
    if (fails >= MAX_FAILS) {
      req.session.familyPinFails = 0;
      req.session.familyPinLockedUntil = Date.now() + LOCKOUT_MS;
      res.status(429).json({ error: "too_many_attempts", retryAfterMs: LOCKOUT_MS });
      return;
    }
    res.status(401).json({ error: "wrong_pin", attemptsLeft: MAX_FAILS - fails });
    return;
  }
  req.session.familyPinFails = 0;
  req.session.familyUnlockedUntil = Date.now() + FAMILY_UNLOCK_MS;
  res.status(204).end();
});

familyRouter.post("/lock", requireAuth, (req, res) => {
  req.session.familyUnlockedUntil = undefined;
  res.status(204).end();
});
