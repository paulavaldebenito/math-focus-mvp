import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";

/**
 * Antes de este fix, una ruta no definida devolvía la página HTML por
 * defecto de Express — el cliente (que siempre llama `.json()`) no podía
 * distinguir "no existe" de un fallo real. Ver server/src/index.ts.
 */
describe("Manejo de errores global", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("una ruta inexistente devuelve JSON, no HTML", async () => {
    const res = await fetch(`${baseUrl}/api/esto-no-existe`);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });
});
