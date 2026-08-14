import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

/**
 * Cobertura de control de acceso cruzado (IDOR): un adulto autenticado no
 * debe poder leer ni escribir datos de un niño que no es suyo, ni por
 * `childId` ni por `sessionId`, aunque adivine o enumere el ID correcto.
 * Regla centralizada en `getOwnedChild` / `getOwnedSession`
 * (`server/src/routes/childAccess.ts`) — este test la ejercita de punta a
 * punta por cada ruta que la usa, en vez de confiar solo en que el código
 * la llama.
 */

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

describe("Control de acceso cruzado entre adultos (IDOR)", () => {
  let server: Server;
  let baseUrl: string;
  let cookieA: string;
  let cookieB: string;
  let childIdA: string;
  let sessionIdA: string;
  const emailA = `ficticio.access.a.${Date.now()}@example.test`;
  const emailB = `ficticio.access.b.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";

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
    const { id: consentId } = (await consentRes.json()) as { id: string };

    const childRes = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ consentId, displayName: "Niño ficticio A" }),
    });
    ({ id: childIdA } = (await childRes.json()) as { id: string });

    const sessionRes = await fetch(`${baseUrl}/api/children/${childIdA}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
    });
    ({ sessionId: sessionIdA } = (await sessionRes.json()) as { sessionId: string });
  });

  afterAll(async () => {
    await prisma.adaptiveDecision.deleteMany({ where: { sessionId: sessionIdA } });
    await prisma.starEvent.deleteMany({ where: { childProfileId: childIdA } });
    await prisma.attempt.deleteMany({ where: { sessionId: sessionIdA } });
    await prisma.pauseEvent.deleteMany({ where: { sessionId: sessionIdA } });
    await prisma.session.deleteMany({ where: { childProfileId: childIdA } });
    await prisma.childProfile.deleteMany({ where: { id: childIdA } });
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

  it("B no puede ver el panel de progreso de un hijo de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/progress`, {
      headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });

  it("B no puede ver la evaluación inicial de un hijo de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/initial-assessment`, {
      headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });

  it("B no puede registrar intentos de evaluación inicial para un hijo de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/initial-assessment/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ attempts: [] }),
    });
    expect(res.status).toBe(404);
  });

  it("B no puede abrir una sesión de práctica para un hijo de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });

  it("B no puede pedir el siguiente ejercicio de un hijo de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/next-exercise`, {
      headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });

  it("B no puede ver el resumen de inicio de un hijo de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/home`, {
      headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });

  it("B no puede cambiar la mascota de un hijo de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/companion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ companion: "gato" }),
    });
    expect(res.status).toBe(404);
  });

  it("B no puede registrar un intento en una sesión de práctica de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionIdA}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ exerciseId: "no-existe", selectedOptionId: "no-existe" }),
    });
    expect(res.status).toBe(404);
  });

  it("B no puede registrar una pausa en una sesión de práctica de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionIdA}/pause-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({ kind: "respiracion", accepted: true }),
    });
    expect(res.status).toBe(404);
  });

  it("B no puede cerrar una sesión de práctica de A (404)", async () => {
    const res = await fetch(`${baseUrl}/api/sessions/${sessionIdA}/complete`, {
      method: "POST",
      headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });

  it("A sí puede acceder a los datos de su propio hijo (control positivo)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childIdA}/progress`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(200);
  });
});
