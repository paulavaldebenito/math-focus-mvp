import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

async function registerAndLogin(baseUrl: string, email: string, password: string) {
  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.get("set-cookie")!.split(";")[0]!;
}

describe("POST /api/children (HU3)", () => {
  let server: Server;
  let baseUrl: string;
  let cookieA: string;
  let cookieB: string;
  let consentIdA: string;
  const emailA = `ficticio.child.a.${Date.now()}@example.test`;
  const emailB = `ficticio.child.b.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";
  const createdChildIds: string[] = [];

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;

    cookieA = await registerAndLogin(baseUrl, emailA, password);
    cookieB = await registerAndLogin(baseUrl, emailB, password);

    const consentRes = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba" }),
    });
    const consentBody = (await consentRes.json()) as { id: string };
    consentIdA = consentBody.id;
  });

  afterAll(async () => {
    await prisma.childProfile.deleteMany({ where: { id: { in: createdChildIds } } });
    for (const email of [emailA, emailB]) {
      const adult = await prisma.adultUser.findUnique({ where: { email } });
      if (adult) {
        await prisma.consent.deleteMany({ where: { adultUserId: adult.id } });
        await prisma.adultUser.delete({ where: { id: adult.id } });
      }
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("rechaza crear perfil sin sesión (401)", async () => {
    const res = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentId: consentIdA, displayName: "Niño ficticio", grade: 1 }),
    });
    expect(res.status).toBe(401);
  });

  it("rechaza usar el consentimiento de OTRO adulto (403) — no se puede robar consentimiento ajeno", async () => {
    const res = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ consentId: consentIdA, displayName: "Niño ficticio", grade: 1 }),
    });
    expect(res.status).toBe(403);
  });

  it("rechaza un curso sin banco de ejercicios (400) — no cualquier número es válido", async () => {
    const res = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ consentId: consentIdA, displayName: "Niño ficticio", grade: 6 }),
    });
    expect(res.status).toBe(400);
  });

  it("crea el perfil con el curso elegido por el adulto (1° o 2° básico)", async () => {
    const res = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ consentId: consentIdA, displayName: "Niño ficticio", grade: 2 }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; grade: number };
    createdChildIds.push(body.id);
    expect(body.grade).toBe(2);
  });

  it("rechaza reutilizar el mismo consentimiento para un segundo perfil (409)", async () => {
    const res = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ consentId: consentIdA, displayName: "Otro niño ficticio", grade: 1 }),
    });
    expect(res.status).toBe(409);
  });

  it("GET /api/children solo lista los hijos del adulto autenticado", async () => {
    const resA = await fetch(`${baseUrl}/api/children`, { headers: { Cookie: cookieA } });
    const bodyA = (await resA.json()) as { children: Array<{ id: string }> };
    expect(bodyA.children.some((c) => createdChildIds.includes(c.id))).toBe(true);

    const resB = await fetch(`${baseUrl}/api/children`, { headers: { Cookie: cookieB } });
    const bodyB = (await resB.json()) as { children: Array<{ id: string }> };
    expect(bodyB.children.some((c) => createdChildIds.includes(c.id))).toBe(false);
  });

  it("GET /api/children rechaza sin sesión (401)", async () => {
    const res = await fetch(`${baseUrl}/api/children`);
    expect(res.status).toBe(401);
  });
});
