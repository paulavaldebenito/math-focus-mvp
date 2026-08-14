import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

async function registerLoginAndChild(baseUrl: string, email: string, password: string) {
  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;

  const consentRes = await fetch(`${baseUrl}/api/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba" }),
  });
  const { id: consentId } = (await consentRes.json()) as { id: string };

  const childRes = await fetch(`${baseUrl}/api/children`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ consentId, displayName: "Niño ficticio", grade: 1 }),
  });
  const child = (await childRes.json()) as { id: string };

  return { cookie, childId: child.id };
}

describe("Sesión de práctica + motor adaptativo (T4.2)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let otherCookie: string;
  const email = `ficticio.practice.${Date.now()}@example.test`;
  const otherEmail = `ficticio.practice.other.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";
  const childIdsToClean: string[] = [];
  const emailsToClean: string[] = [];

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;

    const created = await registerLoginAndChild(baseUrl, email, password);
    cookie = created.cookie;
    childId = created.childId;
    childIdsToClean.push(childId);
    emailsToClean.push(email);

    const other = await registerLoginAndChild(baseUrl, otherEmail, password);
    otherCookie = other.cookie;
    childIdsToClean.push(other.childId);
    emailsToClean.push(otherEmail);
  });

  afterAll(async () => {
    await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: { in: childIdsToClean } } } });
    await prisma.attempt.deleteMany({ where: { session: { childProfileId: { in: childIdsToClean } } } });
    await prisma.starEvent.deleteMany({ where: { childProfileId: { in: childIdsToClean } } });
    await prisma.session.deleteMany({ where: { childProfileId: { in: childIdsToClean } } });
    for (const cid of childIdsToClean) {
      const child = await prisma.childProfile.findUnique({ where: { id: cid } });
      if (child) {
        await prisma.childProfile.delete({ where: { id: cid } });
        await prisma.consent.delete({ where: { id: child.consentId } });
      }
    }
    for (const e of emailsToClean) {
      await prisma.adultUser.deleteMany({ where: { email: e } });
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("una sesión nueva sin historial previo arranca en el nivel neutro (2)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { currentLevel: number };
    expect(body.currentLevel).toBe(2);
  });

  it("un adulto no puede crear una sesión para un niño que no es suyo (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: otherCookie },
    });
    expect(res.status).toBe(404);
  });

  it("3 aciertos consecutivos sin pistas suben el nivel y quedan registrados como AdaptiveDecision", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercises = await prisma.exercise.findMany({ include: { options: true }, take: 3 });
    expect(exercises.length).toBe(3);

    let lastBody: { level: number; action: { ruleCode: string } } | null = null;
    for (const ex of exercises) {
      const correctOption = ex.options.find((o) => o.isCorrect)!;
      const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          exerciseId: ex.id,
          selectedOptionId: correctOption.id,
          hintsUsed: 0,
          responseTimeMs: 6000,
        }),
      });
      expect(res.status).toBe(201);
      lastBody = (await res.json()) as { level: number; action: { ruleCode: string } };
    }

    expect(lastBody?.action.ruleCode).toBe("THREE_CORRECT_NO_HELP");
    expect(lastBody?.level).toBe(3);

    const decision = await prisma.adaptiveDecision.findFirst({
      where: { sessionId, ruleCode: "THREE_CORRECT_NO_HELP" },
    });
    expect(decision).not.toBeNull();
    expect(decision?.previousLevel).toBe(2);
    expect(decision?.newLevel).toBe(3);
  });

  it("no se puede falsear la corrección: enviar un selectedOptionId incorrecto se registra como incorrecto igual", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercise = await prisma.exercise.findFirst({ include: { options: true } });
    const wrongOption = exercise!.options.find((o) => !o.isCorrect)!;

    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: exercise!.id, selectedOptionId: wrongOption.id }),
    });
    const body = (await res.json()) as { isCorrect: boolean };
    expect(body.isCorrect).toBe(false);
  });
});
