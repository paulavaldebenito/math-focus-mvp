import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { configurarProxy, saltosDeProxy } from "../proxy.js";
import { attemptLimiter } from "../../auth/rateLimit.js";

// specs/025: navegador → CloudFront → ALB → nginx → Node. Así llega X-Forwarded-For a Node
// (el socket es nginx, en la misma máquina).
const CLIENTE = "203.0.113.9";
const CLOUDFRONT = "130.176.10.20";
const ALB = "172.31.5.5";
const cadena = (...ips: string[]) => ips.join(", ");

describe("saltosDeProxy", () => {
  it("por defecto 1: nunca cree lo que manda el cliente", () => {
    expect(saltosDeProxy({})).toBe(1);
    expect(saltosDeProxy({ TRUST_PROXY_HOPS: "" })).toBe(1);
  });

  it("acepta un entero y rechaza valores raros al arrancar", () => {
    expect(saltosDeProxy({ TRUST_PROXY_HOPS: "3" })).toBe(3);
    for (const malo of ["tres", "-1", "1.5", "true", "11"]) {
      expect(() => saltosDeProxy({ TRUST_PROXY_HOPS: malo }), malo).toThrow(/TRUST_PROXY_HOPS/);
    }
  });
});

describe("trust proxy detrás de CloudFront + ALB + nginx", () => {
  const servidores: Server[] = [];

  async function levantar(hops: string): Promise<string> {
    const app = express();
    configurarProxy(app, { TRUST_PROXY_HOPS: hops });
    app.get("/quien", (req, res) => {
      res.json({ ip: req.ip, secure: req.secure });
    });
    app.post("/login", attemptLimiter(2, 60_000), (_req, res) => {
      res.status(401).json({ error: "invalid_credentials" });
    });
    const server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    servidores.push(server);
    const address = server.address();
    return `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
  }

  afterAll(async () => {
    await Promise.all(servidores.map((s) => new Promise((r) => s.close(r))));
  });

  let base3: string;
  beforeAll(async () => {
    base3 = await levantar("3");
  });

  const quien = async (base: string, xff: string) =>
    (await fetch(`${base}/quien`, { headers: { "X-Forwarded-For": xff, "X-Forwarded-Proto": "https" } })).json();

  it("con 3 saltos req.ip es la IP real del cliente y req.secure es true", async () => {
    expect(await quien(base3, cadena(CLIENTE, CLOUDFRONT, ALB))).toEqual({ ip: CLIENTE, secure: true });
  });

  it("un X-Forwarded-For inventado por el cliente no cambia su IP", async () => {
    expect(await quien(base3, cadena("1.2.3.4", CLIENTE, CLOUDFRONT, ALB))).toMatchObject({ ip: CLIENTE });
  });

  it("con 1 salto (el valor antiguo) todas las familias aparecen con la IP del balanceador", async () => {
    const base1 = await levantar("1");
    expect(await quien(base1, cadena(CLIENTE, CLOUDFRONT, ALB))).toMatchObject({ ip: ALB });
  });

  it("el límite de intentos cuenta por cliente real, no por proxy", async () => {
    const intento = (cliente: string) =>
      fetch(`${base3}/login`, { method: "POST", headers: { "X-Forwarded-For": cadena(cliente, CLOUDFRONT, ALB) } }).then(
        (r) => r.status,
      );
    expect([await intento(CLIENTE), await intento(CLIENTE), await intento(CLIENTE)]).toEqual([401, 401, 429]);
    // Otra familia, detrás de los mismos CloudFront y ALB, no queda bloqueada.
    expect(await intento("198.51.100.7")).toBe(401);
  });
});
