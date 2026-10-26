import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { SOCIAL_CONSENT_VERSION } from "../domain/social.js";
import { childProfileSchema, companionSchema, interestsSchema, mascotNameSchema } from "../auth/schemas.js";
import { requireAuth } from "../auth/session.js";
import { getOwnedChild } from "./childAccess.js";
import { renameMascot, switchCompanion, toMascotNames } from "../domain/mascotNames.js";

export const childrenRouter = Router();

childrenRouter.get("/", requireAuth, async (req, res) => {
  const children = await prisma.childProfile.findMany({
    where: { adultUserId: req.session.adultUserId! },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      displayName: true,
      grade: true,
      language: true,
      companion: true,
      interests: true,
      mascotName: true,
    },
  });
  res.status(200).json({ children });
});

childrenRouter.post("/", requireAuth, async (req, res) => {
  const parsed = childProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const { consentId, displayName, grade, language, socialCheckInConsent } = parsed.data;

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
      grade,
      language,
      socialCheckInConsent,
      ...(socialCheckInConsent ? { socialConsentAt: new Date(), socialConsentVersion: SOCIAL_CONSENT_VERSION } : {}),
    },
  });

  res.status(201).json({
    id: child.id,
    displayName: child.displayName,
    grade: child.grade,
    language: child.language,
    companion: child.companion,
    interests: child.interests,
    mascotName: child.mascotName,
    mascotNames: toMascotNames(child.mascotNames),
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

  // Cada mascota recuerda su propio nombre: se guarda el de la actual y se
  // recupera el que ya tenía la nueva (ver domain/mascotNames.ts).
  const { mascotNames, mascotName } = switchCompanion(toMascotNames(child.mascotNames), child, parsed.data.companion);
  const updated = await prisma.childProfile.update({
    where: { id: child.id },
    data: { companion: parsed.data.companion, mascotName, mascotNames },
  });

  res.status(200).json({
    id: updated.id,
    companion: updated.companion,
    mascotName: updated.mascotName,
    mascotNames: toMascotNames(updated.mascotNames),
  });
});

childrenRouter.patch("/:childId/interests", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const parsed = interestsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const updated = await prisma.childProfile.update({
    where: { id: child.id },
    data: { interests: parsed.data.interests },
  });

  res.status(200).json({ id: updated.id, interests: updated.interests });
});

childrenRouter.patch("/:childId/mascot-name", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }

  const parsed = mascotNameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }

  const updated = await prisma.childProfile.update({
    where: { id: child.id },
    data: {
      mascotName: parsed.data.mascotName,
      mascotNames: renameMascot(toMascotNames(child.mascotNames), child.companion, parsed.data.mascotName),
    },
  });

  res.status(200).json({ id: updated.id, mascotName: updated.mascotName, mascotNames: toMascotNames(updated.mascotNames) });
});
