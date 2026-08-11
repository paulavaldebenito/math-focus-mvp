import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

// Prueba de integración HTTP real: levanta el servidor Express en un puerto
// efímero y le pega peticiones de verdad — no se simula el handler.

describe("POST /api/auth/register (HU1)", () => {
  let server: Server;
  let baseUrl: string;
  const email = `ficticio.register.${Date.now()}@example.test`;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("rechaza una contraseña débil con 400 y sin tocar la base de datos", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "123" }),
    });
    expect(res.status).toBe(400);

    const found = await prisma.adultUser.findUnique({ where: { email } });
    expect(found).toBeNull();
  });

  it("registra un adulto con contraseña válida y nunca devuelve el hash", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "clave-de-prueba-segura" }),
    });
    expect(res.status).toBe(201);

    const body = (await res.json()) as { email: string };
    expect(body.email).toBe(email);
    expect(body).not.toHaveProperty("passwordHash");
    expect(body).not.toHaveProperty("password");

    const stored = await prisma.adultUser.findUnique({ where: { email } });
    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).not.toBe("clave-de-prueba-segura");
    expect(stored!.passwordHash).toContain(":");
  });

  it("rechaza un correo ya registrado con 409", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "otra-clave-valida" }),
    });
    expect(res.status).toBe(409);
  });
});
