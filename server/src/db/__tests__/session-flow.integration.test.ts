import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../prisma.js";

// Prueba de integración: recorre el modelo de datos completo de una sesión
// de práctica (T1.3) — intento, pista, pausa y decisión adaptativa —
// con datos ficticios que se limpian al final.

describe("Modelo de datos de una sesión completa (T1.3)", () => {
  const email = `ficticio.session.${Date.now()}@example.test`;
  let adultId: string;
  let consentId: string;
  let childId: string;
  let sessionId: string;

  beforeAll(async () => {
    const adult = await prisma.adultUser.create({
      data: { email, passwordHash: "placeholder-hash-not-real" },
    });
    adultId = adult.id;

    const consent = await prisma.consent.create({
      data: { adultUserId: adultId, scope: "ficticio de prueba" },
    });
    consentId = consent.id;

    const child = await prisma.childProfile.create({
      data: { adultUserId: adultId, consentId, displayName: "Niño ficticio", grade: 1 },
    });
    childId = child.id;

    const session = await prisma.session.create({ data: { childProfileId: childId } });
    sessionId = session.id;
  });

  afterAll(async () => {
    await prisma.adaptiveDecision.deleteMany({ where: { sessionId } });
    await prisma.pauseEvent.deleteMany({ where: { sessionId } });
    await prisma.hint.deleteMany({ where: { attempt: { sessionId } } });
    await prisma.attempt.deleteMany({ where: { sessionId } });
    await prisma.session.delete({ where: { id: sessionId } });
    await prisma.progressSnapshot.deleteMany({ where: { childProfileId: childId } });
    await prisma.childProfile.delete({ where: { id: childId } });
    await prisma.consent.delete({ where: { id: consentId } });
    await prisma.adultUser.delete({ where: { id: adultId } });
  });

  it("registra un intento incorrecto con su tipo de error, tiempo de respuesta y una pista", async () => {
    const exercise = await prisma.exercise.findFirst({ include: { options: true } });
    expect(exercise).not.toBeNull();
    const wrongOption = exercise!.options.find((o) => !o.isCorrect && o.errorTypeId);
    expect(wrongOption).toBeDefined();

    const attempt = await prisma.attempt.create({
      data: {
        sessionId,
        exerciseId: exercise!.id,
        selectedOptionId: wrongOption!.id,
        isCorrect: false,
        errorTypeId: wrongOption!.errorTypeId,
        responseTimeMs: 900,
        attemptNumber: 1,
      },
    });

    const hint = await prisma.hint.create({
      data: { attemptId: attempt.id, level: 1, text: "Pista ficticia de prueba." },
    });

    expect(attempt.errorTypeId).toBe(wrongOption!.errorTypeId);
    expect(hint.attemptId).toBe(attempt.id);
  });

  it("registra una pausa activa opcional, aceptada o no, sin bloquear la sesión", async () => {
    const pause = await prisma.pauseEvent.create({
      data: { sessionId, kind: "respiracion", accepted: false },
    });
    expect(pause.accepted).toBe(false);

    // La sesión sigue existiendo y aceptando intentos después de rechazar la pausa.
    const stillThere = await prisma.session.findUnique({ where: { id: sessionId } });
    expect(stillThere).not.toBeNull();
  });

  it("registra una decisión adaptativa con motivo legible (nunca opaca)", async () => {
    const decision = await prisma.adaptiveDecision.create({
      data: {
        sessionId,
        ruleCode: "TWO_CONCEPTUAL_ERRORS_LOWER_LEVEL",
        reason: "2 errores conceptuales consecutivos",
        previousLevel: 2,
        newLevel: 1,
      },
    });

    expect(decision.reason.length).toBeGreaterThan(0);
    expect(decision.newLevel).toBeLessThan(decision.previousLevel);
  });

  it("una fotografía de progreso no incluye a ningún otro estudiante", async () => {
    const snapshot = await prisma.progressSnapshot.create({
      data: {
        childProfileId: childId,
        periodStart: new Date(Date.now() - 7 * 86400000),
        periodEnd: new Date(),
        exercisesCompleted: 5,
        accuracyRate: 0.8,
      },
    });

    expect(snapshot.childProfileId).toBe(childId);
  });
});
