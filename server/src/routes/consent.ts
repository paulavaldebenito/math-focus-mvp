import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { consentSchema } from "../auth/schemas.js";
import { requireAuth } from "../auth/session.js";

export const consentRouter = Router();

consentRouter.post("/", requireAuth, async (req, res) => {
  const parsed = consentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const consent = await prisma.consent.create({
    data: { adultUserId: req.session.adultUserId!, scope: parsed.data.scope },
  });

  res.status(201).json({ id: consent.id, scope: consent.scope, grantedAt: consent.grantedAt });
});
