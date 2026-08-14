import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("POST /api/sessions/:sessionId/pause-events", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let sessionId: string;
  const email = `ficticio.pause.${Date.now()}@example.test`;
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
      body: JSON.stringify({ consentId, displayName: "Niño ficticio", grade: 1 }),
    });
    const child = (await childRes.json()) as { id: string };
    childId = child.id;

    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const s = (await sessionRes.json()) as { sessionId: string };
    sessionId = s.sessionId;
  });

  afterAll(async () => {
    await prisma.pauseEvent.deleteMany({ where: { sessionId } });
    await prisma.starEvent.deleteMany({ where: { childProfileId: childId } });
    await prisma.session.deleteMany({ where: { childProfileId: childId } });
    const child = await prisma.childProfile.findUnique({ where: { id: childId } });
    if (child) {
      await prisma.childProfile.delete({ where: { id: childId } });
      await prisma.consent.delete({ where: { id: child.consentId } });
    }
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("registra una pausa RECHAZADA sin bloquear nada", async () => {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/pause-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ kind: "respiracion", accepted: false }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { accepted: boolean };
    expect(body.accepted).toBe(false);
  });

  it("registra una pausa aceptada con su duración", async () => {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/pause-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ kind: "movimiento", accepted: true, durationMs: 15000 }),
    });
    expect(res.status).toBe(201);
    const stored = await prisma.pauseEvent.findMany({ where: { sessionId } });
    expect(stored.some((p) => p.kind === "movimiento" && p.durationMs === 15000)).toBe(true);
  });
});
