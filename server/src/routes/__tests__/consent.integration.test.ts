import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("POST /api/consent (HU2)", () => {
  let server: Server;
  let baseUrl: string;
  let sessionCookie: string;
  const email = `ficticio.consent.${Date.now()}@example.test`;
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
    sessionCookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;
  });

  afterAll(async () => {
    const adult = await prisma.adultUser.findUnique({ where: { email } });
    if (adult) {
      await prisma.consent.deleteMany({ where: { adultUserId: adult.id } });
      await prisma.adultUser.delete({ where: { id: adult.id } });
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("rechaza crear consentimiento sin sesión (401)", async () => {
    const res = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "MVP v1 — datos mínimos" }),
    });
    expect(res.status).toBe(401);
  });

  it("rechaza un scope demasiado corto (400)", async () => {
    const res = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ scope: "ok" }),
    });
    expect(res.status).toBe(400);
  });

  it("crea el consentimiento ligado al adulto autenticado", async () => {
    const res = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba" }),
    });
    expect(res.status).toBe(201);

    const body = (await res.json()) as { id: string };
    const stored = await prisma.consent.findUnique({ where: { id: body.id } });
    const adult = await prisma.adultUser.findUnique({ where: { email } });
    expect(stored?.adultUserId).toBe(adult?.id);
  });
});
