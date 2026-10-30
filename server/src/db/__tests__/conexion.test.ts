import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sslBaseDatos, tamanoPool, urlBaseDatos } from "../conexion.js";

describe("conexión a la base (specs/025)", () => {
  it("DATABASE_URL gana si está definida (local y CI)", () => {
    expect(urlBaseDatos({ DATABASE_URL: "postgres://a:b@localhost:5432/x", DB_HOST: "otro" })).toBe(
      "postgres://a:b@localhost:5432/x",
    );
  });

  it("en AWS se arma con piezas y codifica la clave", () => {
    const url = urlBaseDatos({
      DB_HOST: "eureka.abc.sa-east-1.rds.amazonaws.com",
      DB_NAME: "eureka",
      DB_USER: "eureka_app",
      DB_PASSWORD: "cl@ve/con:raros",
    });
    expect(url).toBe("postgres://eureka_app:cl%40ve%2Fcon%3Araros@eureka.abc.sa-east-1.rds.amazonaws.com:5432/eureka");
    expect(new URL(url).password).toBe("cl%40ve%2Fcon%3Araros");
  });

  it("sin datos suficientes falla con un mensaje claro", () => {
    expect(() => urlBaseDatos({ DB_HOST: "h", DB_NAME: "d", DB_USER: "u" })).toThrow(/DATABASE_URL no está definida/);
  });

  it("TLS: apagado en local, verificado contra la CA de RDS en AWS", () => {
    expect(sslBaseDatos({})).toBeUndefined();
    const dir = mkdtempSync(join(tmpdir(), "eureka-ca-"));
    const ca = join(dir, "ca.pem");
    writeFileSync(ca, "-----BEGIN CERTIFICATE-----\nfalso\n-----END CERTIFICATE-----\n");
    expect(sslBaseDatos({ DB_SSL: "verificar", DB_SSL_CA: ca })).toEqual({
      ca: expect.stringContaining("BEGIN CERTIFICATE"),
      rejectUnauthorized: true,
    });
    expect(() => sslBaseDatos({ DB_SSL: "require" })).toThrow(/DB_SSL/);
  });

  it("PG_POOL_MAX: entero positivo o el valor por defecto de pg", () => {
    expect(tamanoPool({})).toBeUndefined();
    expect(tamanoPool({ PG_POOL_MAX: "8" })).toBe(8);
    expect(() => tamanoPool({ PG_POOL_MAX: "0" })).toThrow(/PG_POOL_MAX/);
  });
});
