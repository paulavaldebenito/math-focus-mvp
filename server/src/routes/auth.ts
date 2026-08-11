import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { hashPassword } from "../auth/password.js";
import { registerSchema } from "../auth/schemas.js";

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
