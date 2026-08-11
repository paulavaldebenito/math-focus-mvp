import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("POST /api/auth/login + sesión (HU1)", () => {
  let server: Server;
  let baseUrl: string;
  const email = `ficticio.login.${Date.now()}@example.test`;
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
  });

  afterAll(async () => {
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("rechaza credenciales inválidas con 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "clave-incorrecta" }),
    });
    expect(res.status).toBe(401);
  });

  it("rechaza /api/auth/me sin sesión con 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    expect(res.status).toBe(401);
  });

  it("permite iniciar sesión y luego acceder a /me con la cookie recibida", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(loginRes.status).toBe(200);

    const cookie = loginRes.headers.get("set-cookie");
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("HttpOnly");

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie!.split(";")[0]! },
    });
    expect(meRes.status).toBe(200);
    const body = (await meRes.json()) as { email: string };
    expect(body.email).toBe(email);
  });
});
