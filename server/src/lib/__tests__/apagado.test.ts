import { describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { crearApagado } from "../apagado.js";

async function levantar(app: express.Express): Promise<{ server: Server; base: string }> {
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  return { server, base: `http://localhost:${typeof address === "object" && address ? address.port : 0}` };
}

describe("apagado ordenado con SIGTERM (specs/025)", () => {
  it("termina la petición en curso, cierra el pool y sale con código 0", async () => {
    const app = express();
    app.get("/lenta", (_req, res) => {
      setTimeout(() => res.json({ ok: true }), 150);
    });
    const { server, base } = await levantar(app);
    const pasos: string[] = [];
    let codigo: number | undefined;
    const apagar = crearApagado({
      server,
      cerrarRecursos: async () => {
        pasos.push("pool cerrado");
      },
      salir: (c) => {
        codigo = c;
      },
      log: () => {},
    });

    const peticion = fetch(`${base}/lenta`).then((r) => r.json());
    await new Promise((r) => setTimeout(r, 30)); // la petición ya llegó al servidor
    const apagado = apagar("SIGTERM");
    expect(await peticion).toEqual({ ok: true });
    await apagado;
    expect(pasos).toEqual(["pool cerrado"]);
    expect(codigo).toBe(0);
    expect(server.listening).toBe(false);
  });

  it("una segunda señal no repite el apagado", async () => {
    const { server } = await levantar(express());
    let cierres = 0;
    const apagar = crearApagado({
      server,
      cerrarRecursos: async () => {
        cierres += 1;
      },
      salir: () => {},
      log: () => {},
    });
    await Promise.all([apagar("SIGTERM"), apagar("SIGINT")]);
    expect(cierres).toBe(1);
  });

  it("si cerrar recursos falla, sale con código 1", async () => {
    const { server } = await levantar(express());
    let codigo: number | undefined;
    const apagar = crearApagado({
      server,
      cerrarRecursos: async () => {
        throw new Error("pool roto");
      },
      salir: (c) => {
        codigo = c;
      },
      log: () => {},
    });
    await apagar("SIGTERM");
    expect(codigo).toBe(1);
  });
});
