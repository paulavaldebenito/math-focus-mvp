import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { crearRutasSalud } from "../health.js";

async function levantar(a: express.Express): Promise<{ server: Server; base: string }> {
  const server = await new Promise<Server>((resolve) => {
    const s = a.listen(0, () => resolve(s));
  });
  const address = server.address();
  return { server, base: `http://localhost:${typeof address === "object" && address ? address.port : 0}` };
}

// specs/025: el balanceador de Elastic Beanstalk llama a /api/health sin cookie.
describe("chequeo de salud", () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    ({ server, base } = await levantar(app));
  });

  afterAll(async () => {
    await new Promise((r) => server.close(r));
  });

  it("GET /api/health responde 200 sin sesión y sin crear cookie", async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("GET /api/health/db consulta la base de verdad", async () => {
    const res = await fetch(`${base}/api/health/db`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, db: "ok" });
  });

  it("si la base falla o no responde a tiempo, /api/health/db es 503 sin detalles", async () => {
    const original = console.error;
    console.error = () => {};
    try {
      const falla = express();
      falla.use("/api/health", crearRutasSalud(() => Promise.reject(new Error("ECONNREFUSED 10.0.0.1"))));
      const colgada = express();
      colgada.use("/api/health", crearRutasSalud(() => new Promise(() => {}), 50));
      for (const a of [falla, colgada]) {
        const { server: s, base: b } = await levantar(a);
        const res = await fetch(`${b}/api/health/db`);
        expect(res.status).toBe(503);
        expect(await res.json()).toEqual({ ok: false, db: "sin_conexion" });
        // El proceso sigue vivo: el chequeo liviano no depende de la base.
        expect((await fetch(`${b}/api/health`)).status).toBe(200);
        await new Promise((r) => s.close(r));
      }
    } finally {
      console.error = original;
    }
  });
});
