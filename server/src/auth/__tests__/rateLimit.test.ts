import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { attemptLimiter } from "../rateLimit.js";

describe("attemptLimiter", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.post("/login", attemptLimiter(3, 60_000), (_req, res) => {
      res.status(401).json({ error: "invalid_credentials" });
    });
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

  it("deja pasar hasta el límite y después responde 429 con JSON", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await fetch(`${baseUrl}/login`, { method: "POST" })).status);
    }
    expect(statuses).toEqual([401, 401, 401, 429]);

    const blocked = await fetch(`${baseUrl}/login`, { method: "POST" });
    expect(await blocked.json()).toEqual({ error: "too_many_attempts" });
  });
});
