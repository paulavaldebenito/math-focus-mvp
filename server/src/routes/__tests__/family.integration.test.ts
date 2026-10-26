import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

/**
 * Espacio familia y pregunta social semanal (specs/018): el panel familiar queda detrás de un PIN,
 * la pregunta social solo existe con consentimiento, y sus señales llegan solo al panel.
 */
describe("Espacio familia con PIN y pregunta social semanal (specs/018)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  const email = `ficticio.familia.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";

  const call = (path: string, method = "GET", body?: unknown, c = cookie) => {
    const init: RequestInit = { method, headers: { "Content-Type": "application/json", Cookie: c } };
    if (body !== undefined) init.body = JSON.stringify(body);
    return fetch(`${baseUrl}${path}`, init);
  };

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    baseUrl = `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    cookie = login.headers.get("set-cookie")!.split(";")[0]!;
    const consent = (await (await call("/api/consent", "POST", { scope: "MVP v1 — ficticio de prueba" })).json()) as { id: string };
    const child = (await (await call("/api/children", "POST", { consentId: consent.id, displayName: "Niña ficticia", grade: 3 })).json()) as {
      id: string;
    };
    childId = child.id;
  });

  afterAll(async () => {
    await prisma.socialCheckIn.deleteMany({ where: { childProfileId: childId } });
    await prisma.childProfile.deleteMany({ where: { id: childId } });
    await prisma.consent.deleteMany({ where: { adultUser: { email } } });
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("sin PIN, el panel familiar no se abre y pide crearlo", async () => {
    const res = await call(`/api/children/${childId}/progress`);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "family_pin_required" });
  });

  it("crear el PIN exige la contraseña de la cuenta y deja el espacio desbloqueado", async () => {
    expect((await call("/api/family/pin", "PUT", { pin: "1234", password: "otra-clave" })).status).toBe(401);
    expect((await call("/api/family/pin", "PUT", { pin: "12a4", password })).status).toBe(400);
    expect((await call("/api/family/pin", "PUT", { pin: "2468", password })).status).toBe(204);
    const status = (await (await call("/api/family/status")).json()) as { hasPin: boolean; unlocked: boolean; plan: string };
    expect(status).toEqual({ hasPin: true, unlocked: true, plan: "familia" });
    expect((await call(`/api/children/${childId}/progress`)).status).toBe(200);
  });

  it("al cerrar el espacio vuelve a pedir el PIN; un PIN equivocado no abre y avisa cuántos intentos quedan", async () => {
    await call("/api/family/lock", "POST", {});
    expect(await (await call(`/api/children/${childId}/progress`)).json()).toEqual({ error: "family_locked" });
    const wrong = await call("/api/family/unlock", "POST", { pin: "0000" });
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: "wrong_pin", attemptsLeft: 4 });
    expect((await call("/api/family/unlock", "POST", { pin: "2468" })).status).toBe(204);
    expect((await call(`/api/children/${childId}/progress`)).status).toBe(200);
  });

  it("sin consentimiento, al niño nunca se le hace la pregunta social", async () => {
    expect(await (await call(`/api/children/${childId}/social-check-in`)).json()).toEqual({ due: false });
    expect((await call(`/api/children/${childId}/social-check-in`, "POST", { recess: 1 })).status).toBe(403);
    const progress = (await (await call(`/api/children/${childId}/progress`)).json()) as { social: { enabled: boolean } };
    expect(progress.social.enabled).toBe(false);
  });

  it("con consentimiento: una vez por semana, y si cuenta que lo molestaron, la señal llega al panel y al inicio (solo como punto)", async () => {
    expect((await call(`/api/children/${childId}/social-consent`, "PUT", { enabled: true })).status).toBe(200);
    expect(await (await call(`/api/children/${childId}/social-check-in`)).json()).toEqual({ due: true });
    expect((await call(`/api/children/${childId}/social-check-in`, "POST", { recess: 4, confidant: 2, excluded: "varias" })).status).toBe(201);
    expect(await (await call(`/api/children/${childId}/social-check-in`)).json()).toEqual({ due: false });
    expect((await call(`/api/children/${childId}/social-check-in`, "POST", {})).status).toBe(409);

    // El punto del inicio se enciende (sin decir qué es) y se apaga cuando la familia abre el panel.
    const home = (await (await call(`/api/children/${childId}/home`)).json()) as Record<string, unknown>;
    expect(home.familyAlert).toBe(true);
    expect(JSON.stringify(home)).not.toMatch(/excluded|recess|confidant/);

    const progress = (await (await call(`/api/children/${childId}/progress`)).json()) as {
      social: { signal: { level: string; reasons: string[] }; guidance: { school: { es: string } } };
      week: { social: { status: string; answeredThisWeek: boolean } };
    };
    expect(progress.social.signal).toEqual({ level: "atencion", reasons: ["excluded_often"] });
    expect(progress.social.guidance.school.es).toMatch(/encargado de convivencia escolar/);
    expect((progress.social.guidance as unknown as { urgent: { es: string } }).urgent.es).toMatch(/\*4141/);
    expect(progress.week.social).toEqual({ status: "atencion", answeredThisWeek: true });

    const after = (await (await call(`/api/children/${childId}/home`)).json()) as Record<string, unknown>;
    expect(after.familyAlert).toBe(false);
    const child = await prisma.childProfile.findUniqueOrThrow({ where: { id: childId } });
    expect(child.socialConsentVersion).toBeTruthy();
  });

  it("al desactivar, la familia puede borrar sus respuestas", async () => {
    expect((await call(`/api/children/${childId}/social-consent`, "PUT", { enabled: false, deleteAnswers: true })).status).toBe(200);
    expect(await prisma.socialCheckIn.count({ where: { childProfileId: childId } })).toBe(0);
    await call(`/api/children/${childId}/social-consent`, "PUT", { enabled: true });
  });

  it("cambiar el consentimiento social exige el espacio familia desbloqueado", async () => {
    await call("/api/family/lock", "POST", {});
    expect((await call(`/api/children/${childId}/social-consent`, "PUT", { enabled: false })).status).toBe(403);
  });

  it("tras 5 PIN equivocados se bloquea un rato, aunque luego se pruebe el correcto", async () => {
    for (let i = 0; i < 4; i++) await call("/api/family/unlock", "POST", { pin: "1111" });
    expect((await call("/api/family/unlock", "POST", { pin: "1111" })).status).toBe(429);
    expect((await call("/api/family/unlock", "POST", { pin: "2468" })).status).toBe(429);
  });
});
