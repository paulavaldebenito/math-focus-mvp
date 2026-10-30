import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

// specs/023: condiciones de seguridad conocidas que el servidor debe cumplir siempre.
describe("seguridad del servidor (specs/023)", () => {
  let server: Server;
  let baseUrl: string;
  const email = `ficticio.seguridad.${Date.now()}@example.test`;

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

  const post = (path: string, body: string) =>
    fetch(`${baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body });

  it("manda cabeceras de seguridad y no delata la tecnología del servidor", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.headers.get("x-powered-by")).toBeNull();
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("strict-transport-security")).toContain("max-age=");
    expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'self'");
  });

  it("JSON mal formado es 400, no 500", async () => {
    const res = await post("/api/auth/login", '{"email":');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_body" });
  });

  it("un body sobre el límite es 413, no 500", async () => {
    const res = await post("/api/auth/login", JSON.stringify({ email: "a@b.cl", password: "a".repeat(200_000) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "payload_too_large" });
  });

  it("rechaza contraseñas de más de 128 caracteres sin crear la cuenta", async () => {
    const res = await post("/api/auth/register", JSON.stringify({ email, password: "a".repeat(129) }));
    expect(res.status).toBe(400);
    expect(await prisma.adultUser.findUnique({ where: { email } })).toBeNull();
  });

  it("sin sesión no se accede a datos de niños ni al modo revisión", async () => {
    for (const path of ["/api/children", "/api/children/x/progress", "/api/family/status", "/api/review/skills", "/api/school/mine"]) {
      const res = await fetch(`${baseUrl}${path}`);
      expect(res.status, path).toBe(401);
    }
  });

  it("el login no revela si el correo existe", async () => {
    const res = await post("/api/auth/login", JSON.stringify({ email: "no.existe@example.test", password: "clave-cualquiera" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "invalid_credentials" });
  });
});
