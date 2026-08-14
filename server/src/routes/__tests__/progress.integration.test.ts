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

describe("GET /api/children/:childId/progress (T6.1)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let otherCookie: string;
  const email = `ficticio.progress.${Date.now()}@example.test`;
  const otherEmail = `ficticio.progress.other.${Date.now()}@example.test`;
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

    // Genera actividad real: una sesión con un acierto y un error real.
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercises = await prisma.exercise.findMany({ include: { options: true }, take: 2 });
    const correctOption = exercises[0]!.options.find((o) => o.isCorrect)!;
    const wrongOption = exercises[1]!.options.find((o) => !o.isCorrect)!;

    await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: exercises[0]!.id, selectedOptionId: correctOption.id }),
    });
    await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: exercises[1]!.id, selectedOptionId: wrongOption.id }),
    });
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

  it("refleja los intentos reales — 1 sesión, 2 intentos, 1 correcto", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/progress`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      totalSessions: number;
      totalAttempts: number;
      correctAttempts: number;
      accuracy: number;
      errorBreakdown: Record<string, number>;
    };
    expect(body.totalSessions).toBe(1);
    expect(body.totalAttempts).toBe(2);
    expect(body.correctAttempts).toBe(1);
    expect(body.accuracy).toBe(0.5);
    expect(Object.values(body.errorBreakdown).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("un adulto no puede ver el progreso de un niño que no es suyo (404) — sin ranking posible", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/progress`, { headers: { Cookie: otherCookie } });
    expect(res.status).toBe(404);
  });

  it("rechaza sin sesión (401)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/progress`);
    expect(res.status).toBe(401);
  });
});
