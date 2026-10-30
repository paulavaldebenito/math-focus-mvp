import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

// specs/021: las sesiones viven en Postgres (no en memoria del proceso), así que un reinicio o
// despliegue del servidor no cierra la sesión de las familias.
describe("sesiones de login guardadas en Postgres", () => {
  let server: Server;
  let baseUrl: string;
  const email = `ficticio.sesion.${Date.now()}@example.test`;
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

  it("el login crea una fila en http_session, /me la usa y el logout la borra", async () => {
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(login.status).toBe(200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0];
    // Cookie firmada: mathfocus.sid=s%3A<sid>.<firma>
    const sid = decodeURIComponent(cookie.split("=")[1]).slice(2).split(".")[0];

    const row = await prisma.httpSession.findUnique({ where: { sid } });
    expect(row?.sess).toMatchObject({ adultUserId: expect.any(String) });

    const me = await fetch(`${baseUrl}/api/auth/me`, { headers: { cookie } });
    expect(me.status).toBe(200);

    await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: { cookie } });
    expect(await prisma.httpSession.findUnique({ where: { sid } })).toBeNull();
  });
});
