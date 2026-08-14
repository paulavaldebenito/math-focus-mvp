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

  it("regenera el ID de sesión en login — evita fijación de sesión", async () => {
    const emailB = `ficticio.login.b.${Date.now()}@example.test`;
    const passwordB = "otra-clave-de-prueba-segura";
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailB, password: passwordB }),
    });

    // 1) Adulto A inicia sesión — la sesión queda activa y guardada.
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const cookieA = loginA.headers.get("set-cookie")!.split(";")[0]!;

    // 2) Sin cerrar esa sesión, adulto B inicia sesión enviando la cookie de
    //    A (equipo compartido / cookie fijada por un atacante). La sesión de
    //    A sigue activa y guardada en el store en este momento — el caso
    //    real que fixation explota. Si el servidor no regenerara el ID acá,
    //    B terminaría autenticado sobre el mismo ID que A ya conocía.
    const loginB = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({ email: emailB, password: passwordB }),
    });
    const cookieB = loginB.headers.get("set-cookie")!.split(";")[0]!;

    expect(cookieB).not.toBe(cookieA);

    await prisma.adultUser.deleteMany({ where: { email: emailB } });
  });
});
