import { describe, expect, it } from "vitest";
import { randomBytes, scryptSync } from "node:crypto";
import { hashPassword, verifyPassword } from "../password.js";

// Prueba unitaria pura — sin base de datos.

describe("hashPassword / verifyPassword", () => {
  it("nunca guarda la contraseña en texto plano", async () => {
    const hash = await hashPassword("mi-clave-secreta");
    expect(hash).not.toBe("mi-clave-secreta");
    expect(hash).toContain(":");
  });

  it("verifica correctamente la contraseña correcta", async () => {
    const hash = await hashPassword("mi-clave-secreta");
    expect(await verifyPassword("mi-clave-secreta", hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword("mi-clave-secreta");
    expect(await verifyPassword("otra-clave", hash)).toBe(false);
  });

  it("dos hashes de la misma contraseña son distintos (salt aleatorio)", async () => {
    const a = await hashPassword("misma-clave");
    const b = await hashPassword("misma-clave");
    expect(a).not.toBe(b);
    expect(await verifyPassword("misma-clave", a)).toBe(true);
    expect(await verifyPassword("misma-clave", b)).toBe(true);
  });

  it("sigue aceptando hashes creados con la versión síncrona anterior (specs/024)", async () => {
    const salt = randomBytes(16).toString("hex");
    const antiguo = `${salt}:${scryptSync("clave-de-antes", salt, 64).toString("hex")}`;
    expect(await verifyPassword("clave-de-antes", antiguo)).toBe(true);
    expect(await verifyPassword("otra", antiguo)).toBe(false);
  });
});
