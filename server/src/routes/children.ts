import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { childProfileSchema, companionSchema } from "../auth/schemas.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";

// MVP v1: fijo, no configurable por el cliente. Ver ADR en README.
const MVP_GRADE = 1;

export const childrenRouter = Router();

childrenRouter.get("/", requireAuth, async (req, res) => {
  const children = await prisma.childProfile.findMany({
    where: { adultUserId: req.session.adultUserId! },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, grade: true, language: true, companion: true },
  });
  res.status(200).json({ children });
});

childrenRouter.post("/", requireAuth, async (req, res) => {
  const parsed = childProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const { consentId, displayName, language } = parsed.data;

  const consent = await prisma.consent.findUnique({ where: { id: consentId } });
  if (!consent || consent.adultUserId !== req.session.adultUserId! || consent.revokedAt) {
    res.status(403).json({ error: "invalid_consent" });
    return;
  }

  const existingChildForConsent = await prisma.childProfile.findUnique({ where: { consentId } });
  if (existingChildForConsent) {
    res.status(409).json({ error: "consent_already_used" });
    return;
  }

  const child = await prisma.childProfile.create({
    data: {
      adultUserId: req.session.adultUserId!,
      consentId,
      displayName,
      grade: MVP_GRADE,
      language,
    },
  });

  res.status(201).json({
    id: child.id,
    displayName: child.displayName,
    grade: child.grade,
    language: child.language,
    companion: child.companion,
  });
});

childrenRouter.patch("/:childId/companion", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const parsed = companionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const updated = await prisma.childProfile.update({
    where: { id: child.id },
    data: { companion: parsed.data.companion },
  });

  res.status(200).json({ id: updated.id, companion: updated.companion });
});
