import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("GET /api/children/:childId/next-exercise (T4.3)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  const email = `ficticio.nextex.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;

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
    cookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;

    const consentRes = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba" }),
    });
    const { id: consentId } = (await consentRes.json()) as { id: string };

    const childRes = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ consentId, displayName: "Niño ficticio" }),
    });
    const child = (await childRes.json()) as { id: string };
    childId = child.id;
  });

  afterAll(async () => {
    const child = await prisma.childProfile.findUnique({ where: { id: childId } });
    if (child) {
      await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: childId } } });
      await prisma.attempt.deleteMany({ where: { session: { childProfileId: childId } } });
      await prisma.session.deleteMany({ where: { childProfileId: childId } });
      await prisma.childProfile.delete({ where: { id: childId } });
      await prisma.consent.delete({ where: { id: child.consentId } });
    }
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("devuelve un ejercicio del nivel neutro (2) sin filtrar la respuesta correcta", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/next-exercise`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { difficultyLevel: number; options: Array<Record<string, unknown>> };
    expect(body.difficultyLevel).toBe(2);
    for (const opt of body.options) {
      expect(opt).not.toHaveProperty("isCorrect");
    }
  });

  it("no repite un ejercicio ya usado en la misma sesión mientras haya otros disponibles", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const seen = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const res = await fetch(
        `${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`,
        { headers: { Cookie: cookie } },
      );
      const body = (await res.json()) as { id: string; options: Array<{ id: string }> };
      expect(seen.has(body.id)).toBe(false);
      seen.add(body.id);

      // Simula que el niño responde (para que el próximo GET lo excluya).
      await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ exerciseId: body.id, selectedOptionId: body.options[0]!.id }),
      });
    }
  });
});
