import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../prisma.js";

// Prueba de integración real contra Postgres local (prisma dev).
// Todos los datos son ficticios y se limpian al final.

describe("Consentimiento obligatorio antes de crear un perfil infantil (HU2)", () => {
  const email = `ficticio.test.${Date.now()}@example.test`;
  let adultId: string;

  beforeAll(async () => {
    const adult = await prisma.adultUser.create({
      data: { email, passwordHash: "placeholder-hash-not-real" },
    });
    adultId = adult.id;
  });

  afterAll(async () => {
    await prisma.childProfile.deleteMany({ where: { adultUserId: adultId } });
    await prisma.consent.deleteMany({ where: { adultUserId: adultId } });
    await prisma.adultUser.delete({ where: { id: adultId } });
  });

  it("rechaza crear un perfil infantil sin un consentimiento válido", async () => {
    await expect(
      prisma.childProfile.create({
        data: {
          adultUserId: adultId,
          consentId: "no-existe",
          displayName: "Niño ficticio",
          grade: 1,
        },
      }),
    ).rejects.toThrow();
  });

  it("permite crear el perfil una vez que existe consentimiento", async () => {
    const consent = await prisma.consent.create({
      data: { adultUserId: adultId, scope: "MVP v1 — datos mínimos, ficticio de prueba" },
    });

    const child = await prisma.childProfile.create({
      data: { adultUserId: adultId, consentId: consent.id, displayName: "Niño ficticio", grade: 1 },
    });

    expect(child.consentId).toBe(consent.id);
    expect(child.grade).toBe(1);
  });
});
