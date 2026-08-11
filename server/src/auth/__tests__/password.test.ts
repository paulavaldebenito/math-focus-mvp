import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password.js";

// Prueba unitaria pura — sin base de datos.

describe("hashPassword / verifyPassword", () => {
  it("nunca guarda la contraseña en texto plano", () => {
    const hash = hashPassword("mi-clave-secreta");
    expect(hash).not.toBe("mi-clave-secreta");
    expect(hash).toContain(":");
  });

  it("verifica correctamente la contraseña correcta", () => {
    const hash = hashPassword("mi-clave-secreta");
    expect(verifyPassword("mi-clave-secreta", hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", () => {
    const hash = hashPassword("mi-clave-secreta");
    expect(verifyPassword("otra-clave", hash)).toBe(false);
  });

  it("dos hashes de la misma contraseña son distintos (salt aleatorio)", () => {
    const a = hashPassword("misma-clave");
    const b = hashPassword("misma-clave");
    expect(a).not.toBe(b);
    expect(verifyPassword("misma-clave", a)).toBe(true);
    expect(verifyPassword("misma-clave", b)).toBe(true);
  });
});
