import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("POST /api/sessions/:sessionId/check-in", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let sessionId: string;
  const email = `ficticio.checkin.${Date.now()}@example.test`;
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
    await prisma.wellbeingCheckIn.deleteMany({ where: { childProfileId: childId } });
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

  const post = (body: unknown, cookieHeader = cookie, id = sessionId) =>
    fetch(`${baseUrl}/api/sessions/${id}/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify(body),
    });

  const newSession = async () =>
    ((await (await fetch(`${baseUrl}/api/children/${childId}/sessions`, { method: "POST", headers: { Cookie: cookie } })).json()) as {
      sessionId: string;
      checkInDue: boolean;
    });

  it("rechaza valores fuera de 1-5 o campos desconocidos", async () => {
    expect((await post({ mood: 0 })).status).toBe(400);
    expect((await post({ mood: 6 })).status).toBe(400);
    expect((await post({ mathFeeling: 2.5 })).status).toBe(400);
    expect((await post({ mood: 3, diagnosis: "x" })).status).toBe(400);
  });

  it("no deja registrar en la sesión de otro adulto", async () => {
    expect((await post({ mood: 4 }, "connect.sid=otra")).status).toBe(401);
    expect((await post({ mood: 4 }, cookie, "sesion-inexistente")).status).toBe(404);
  });

  it("guarda ánimo y cómo se siente con las matemáticas, ligado a la sesión — y solo una vez por día", async () => {
    const res = await post({ mood: 2, mathFeeling: 4 });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    expect(await prisma.wellbeingCheckIn.findUnique({ where: { id } })).toMatchObject({
      childProfileId: childId,
      sessionId,
      mood: 2,
      mathFeeling: 4,
    });

    // Segunda práctica del mismo día: ya no toca preguntar, y no se duplica.
    const second = await newSession();
    expect(second.checkInDue).toBe(false);
    expect((await post({ mood: 5 }, cookie, second.sessionId)).status).toBe(409);
    expect(await prisma.wellbeingCheckIn.count({ where: { childProfileId: childId } })).toBe(1);
  });

  it("al día siguiente vuelve a tocar; saltarlo (cuerpo vacío) también cuenta como el check-in del día", async () => {
    // Simula que el check-in anterior fue ayer.
    await prisma.wellbeingCheckIn.updateMany({
      where: { childProfileId: childId },
      data: { createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000) },
    });
    const s = await newSession();
    expect(s.checkInDue).toBe(true);
    expect((await post({}, cookie, s.sessionId)).status).toBe(201);
    expect(await prisma.wellbeingCheckIn.findFirst({ where: { sessionId: s.sessionId } })).toMatchObject({
      mood: null,
      mathFeeling: null,
    });
    expect((await newSession()).checkInDue).toBe(false);
  });
});
