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

describe("Evaluación inicial breve (HU4)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let otherCookie: string;
  const email = `ficticio.assess.${Date.now()}@example.test`;
  const otherEmail = `ficticio.assess.other.${Date.now()}@example.test`;
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

  it("GET no filtra cuál alternativa es correcta", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/initial-assessment`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { exercises: Array<{ options: Array<Record<string, unknown>> }> };
    expect(body.exercises.length).toBeGreaterThan(0);
    for (const ex of body.exercises) {
      for (const opt of ex.options) {
        expect(opt).not.toHaveProperty("isCorrect");
        expect(opt).not.toHaveProperty("errorTypeId");
      }
    }
  });

  it("un adulto no puede ver la evaluación de un niño que no es suyo (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/initial-assessment`, {
      headers: { Cookie: otherCookie },
    });
    expect(res.status).toBe(404);
  });

  it("calcula el nivel inicial correctamente a partir de respuestas reales (2/3 correctas → nivel 2)", async () => {
    const getRes = await fetch(`${baseUrl}/api/children/${childId}/initial-assessment`, {
      headers: { Cookie: cookie },
    });
    const { exercises } = (await getRes.json()) as {
      exercises: Array<{ id: string; prompt: string; options: Array<{ id: string; label: string }> }>;
    };

    // Se buscan las respuestas correctas reales en la base (el test no las
    // inventa): 2 correctas, 1 incorrecta a propósito.
    const attempts = [];
    let correctSoFar = 0;
    for (const ex of exercises.slice(0, 3)) {
      const full = await prisma.exercise.findUnique({
        where: { id: ex.id },
        include: { options: true },
      });
      const correctOption = full!.options.find((o) => o.isCorrect)!;
      const wrongOption = full!.options.find((o) => !o.isCorrect)!;
      const useCorrect = correctSoFar < 2;
      if (useCorrect) correctSoFar += 1;
      attempts.push({
        exerciseId: ex.id,
        selectedOptionId: useCorrect ? correctOption.id : wrongOption.id,
      });
    }

    const postRes = await fetch(`${baseUrl}/api/children/${childId}/initial-assessment/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ attempts }),
    });
    expect(postRes.status).toBe(201);
    const result = (await postRes.json()) as { sessionId: string; correctCount: number; initialLevel: number };
    expect(result.correctCount).toBe(2);
    expect(result.initialLevel).toBe(2);

    const decision = await prisma.adaptiveDecision.findFirst({ where: { sessionId: result.sessionId } });
    expect(decision?.ruleCode).toBe("INITIAL_ASSESSMENT");
    expect(decision?.newLevel).toBe(2);
  });
});
