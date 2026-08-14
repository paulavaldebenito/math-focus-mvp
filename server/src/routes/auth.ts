import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { loginSchema, registerSchema } from "../auth/schemas.js";
import { requireAuth } from "../auth/session.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const existing = await prisma.adultUser.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "email_already_registered" });
    return;
  }

  const passwordHash = hashPassword(password);
  const adult = await prisma.adultUser.create({ data: { email, passwordHash } });

  // Nunca se devuelve passwordHash en la respuesta.
  res.status(201).json({ id: adult.id, email: adult.email });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const adult = await prisma.adultUser.findUnique({ where: { email } });

  // Mensaje genérico en ambos casos — no revela si el correo existe o no.
  if (!adult || !verifyPassword(password, adult.passwordHash)) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }

  // Regenera el ID de sesión antes de autenticar — evita fijación de sesión
  // (un atacante que fija un session ID en la víctima antes del login no
  // puede heredar la sesión ya autenticada, porque el ID cambia acá).
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "session_error" });
      return;
    }
    req.session.adultUserId = adult.id;
    res.status(200).json({ id: adult.id, email: adult.email });
  });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const adult = await prisma.adultUser.findUnique({ where: { id: req.session.adultUserId } });
  if (!adult) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }
  res.status(200).json({ id: adult.id, email: adult.email });
});
