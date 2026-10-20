import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

async function registerLoginAndChild(baseUrl: string, email: string, password: string) {
  await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;

  const consentRes = await fetch(`${baseUrl}/api/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba" }),
  });
  const { id: consentId } = (await consentRes.json()) as { id: string };

  const childRes = await fetch(`${baseUrl}/api/children`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ consentId, displayName: "Niño ficticio", grade: 1 }),
  });
  const child = (await childRes.json()) as { id: string };

  return { cookie, childId: child.id };
}

describe("Estrellas, compañero y resumen de inicio (T7)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let otherCookie: string;
  const email = `ficticio.stars.${Date.now()}@example.test`;
  const otherEmail = `ficticio.stars.other.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";
  const childIdsToClean: string[] = [];
  const emailsToClean: string[] = [];

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;

    const created = await registerLoginAndChild(baseUrl, email, password);
    cookie = created.cookie;
    childId = created.childId;
    childIdsToClean.push(childId);
    emailsToClean.push(email);

    const other = await registerLoginAndChild(baseUrl, otherEmail, password);
    otherCookie = other.cookie;
    childIdsToClean.push(other.childId);
    emailsToClean.push(otherEmail);
  });

  afterAll(async () => {
    await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: { in: childIdsToClean } } } });
    await prisma.attempt.deleteMany({ where: { session: { childProfileId: { in: childIdsToClean } } } });
    await prisma.pauseEvent.deleteMany({ where: { session: { childProfileId: { in: childIdsToClean } } } });
    await prisma.starEvent.deleteMany({ where: { childProfileId: { in: childIdsToClean } } });
    await prisma.session.deleteMany({ where: { childProfileId: { in: childIdsToClean } } });
    for (const cid of childIdsToClean) {
      const child = await prisma.childProfile.findUnique({ where: { id: cid } });
      if (child) {
        await prisma.childProfile.delete({ where: { id: cid } });
        await prisma.consent.delete({ where: { id: child.consentId } });
      }
    }
    for (const e of emailsToClean) {
      await prisma.adultUser.deleteMany({ where: { email: e } });
    }
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("PATCH /companion guarda un compañero válido", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/companion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ companion: "buho" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { companion: string };
    expect(body.companion).toBe("buho");
  });

  it("PATCH /companion rechaza una clave que no está en el catálogo", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/companion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ companion: "dragon" }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /companion no funciona para un niño que no es del adulto autenticado (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/companion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: otherCookie },
      body: JSON.stringify({ companion: "zorro" }),
    });
    expect(res.status).toBe(404);
  });

  const patchMascotName = (body: unknown, withCookie = cookie) =>
    fetch(`${baseUrl}/api/children/${childId}/mascot-name`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: withCookie },
      body: JSON.stringify(body),
    });

  it("PATCH /mascot-name guarda un nombre propio y le quita espacios de sobra", async () => {
    const res = await patchMascotName({ mascotName: "  Pelusa  " });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { mascotName: string }).mascotName).toBe("Pelusa");
  });

  it("PATCH /mascot-name rechaza vacío, solo espacios, y más de 20 caracteres", async () => {
    expect((await patchMascotName({ mascotName: "" })).status).toBe(400);
    expect((await patchMascotName({ mascotName: "   " })).status).toBe(400);
    expect((await patchMascotName({ mascotName: "a".repeat(21) })).status).toBe(400);
  });

  it("PATCH /mascot-name no funciona para un niño que no es del adulto autenticado (404)", async () => {
    expect((await patchMascotName({ mascotName: "Firu" }, otherCookie)).status).toBe(404);
  });

  it("cada mascota recuerda su propio nombre al cambiar de mascota y volver", async () => {
    const patchCompanion = async (companion: string) =>
      (await (
        await fetch(`${baseUrl}/api/children/${childId}/companion`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ companion }),
        })
      ).json()) as { mascotName: string | null; mascotNames: Record<string, string> };

    const getHome = async () =>
      (await (await fetch(`${baseUrl}/api/children/${childId}/home`, { headers: { Cookie: cookie } })).json()) as {
        companion: string;
        mascotName: string | null;
        mascotNames: Record<string, string>;
      };
    const before = await getHome();

    await patchCompanion("conejo");
    await patchMascotName({ mascotName: "Orejas" });
    await patchCompanion("capi");
    await patchMascotName({ mascotName: "Nube" });

    // Volver al conejo recupera "Orejas", y el capi sigue llamándose "Nube".
    const backToConejo = await patchCompanion("conejo");
    expect(backToConejo.mascotName).toBe("Orejas");
    expect(backToConejo.mascotNames).toMatchObject({ conejo: "Orejas", capi: "Nube" });
    expect((await patchCompanion("capi")).mascotName).toBe("Nube");

    expect(await getHome()).toMatchObject({ companion: "capi", mascotName: "Nube", mascotNames: { conejo: "Orejas", capi: "Nube" } });

    // Vuelve a la mascota del principio: recupera también su nombre (y deja el
    // perfil como lo esperan las pruebas siguientes).
    const restored = await patchCompanion(before.companion);
    expect(restored.mascotName).toBe(before.mascotName);
  });

  const patchInterests = (body: unknown, withCookie = cookie) =>
    fetch(`${baseUrl}/api/children/${childId}/interests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: withCookie },
      body: JSON.stringify(body),
    });

  it("PATCH /interests guarda de 1 a 3 intereses válidos", async () => {
    for (const interests of [["dinosaurios"], ["futbol", "cocina"], ["espacio", "vehiculos", "naturaleza"]]) {
      const res = await patchInterests({ interests });
      expect(res.status).toBe(200);
      expect(((await res.json()) as { interests: string[] }).interests).toEqual(interests);
    }
    await patchInterests({ interests: ["futbol"] });
  });

  it("PATCH /interests rechaza lista vacía, más de 3, repetidos y claves fuera del catálogo", async () => {
    expect((await patchInterests({ interests: [] })).status).toBe(400);
    expect((await patchInterests({ interests: ["futbol", "musica", "cocina", "espacio"] })).status).toBe(400);
    expect((await patchInterests({ interests: ["futbol", "futbol"] })).status).toBe(400);
    expect((await patchInterests({ interests: ["unicornios"] })).status).toBe(400);
    expect((await patchInterests({ interest: "futbol" })).status).toBe(400);
  });

  it("PATCH /interests no funciona para un niño que no es del adulto autenticado (404)", async () => {
    expect((await patchInterests({ interests: ["musica"] }, otherCookie)).status).toBe(404);
  });

  it("una respuesta correcta otorga una estrella; una incorrecta no otorga ninguna", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercise = await prisma.exercise.findFirst({ include: { options: true } });
    const correctOption = exercise!.options.find((o) => o.isCorrect)!;
    const wrongOption = exercise!.options.find((o) => !o.isCorrect)!;

    const before = await prisma.starEvent.count({ where: { childProfileId: childId } });

    await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: exercise!.id, selectedOptionId: wrongOption.id }),
    });
    const afterWrong = await prisma.starEvent.count({ where: { childProfileId: childId } });
    expect(afterWrong).toBe(before);

    await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: exercise!.id, selectedOptionId: correctOption.id }),
    });
    const afterCorrect = await prisma.starEvent.count({ where: { childProfileId: childId } });
    expect(afterCorrect).toBe(before + 1);

    const event = await prisma.starEvent.findFirst({
      where: { childProfileId: childId, reason: "correct_answer" },
      orderBy: { createdAt: "desc" },
    });
    expect(event?.sessionId).toBe(sessionId);
  });

  it("aceptar una pausa otorga una estrella; rechazarla no otorga ninguna", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const before = await prisma.starEvent.count({ where: { childProfileId: childId } });

    await fetch(`${baseUrl}/api/sessions/${sessionId}/pause-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ kind: "respiracion", accepted: false }),
    });
    expect(await prisma.starEvent.count({ where: { childProfileId: childId } })).toBe(before);

    await fetch(`${baseUrl}/api/sessions/${sessionId}/pause-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ kind: "movimiento", accepted: true }),
    });
    expect(await prisma.starEvent.count({ where: { childProfileId: childId } })).toBe(before + 1);
  });

  it("completar una sesión otorga una estrella una sola vez (idempotente)", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const before = await prisma.starEvent.count({ where: { childProfileId: childId } });

    const first = await fetch(`${baseUrl}/api/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(first.status).toBe(200);
    expect(((await first.json()) as { starAwarded: boolean }).starAwarded).toBe(true);
    expect(await prisma.starEvent.count({ where: { childProfileId: childId } })).toBe(before + 1);

    const second = await fetch(`${baseUrl}/api/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(((await second.json()) as { starAwarded: boolean }).starAwarded).toBe(false);
    expect(await prisma.starEvent.count({ where: { childProfileId: childId } })).toBe(before + 1);

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    expect(session?.endedAt).not.toBeNull();
  });

  it("GET /home devuelve compañero, estrellas totales, estrellas de hoy y racha ≥ 1", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/home`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      companion: string | null;
      mascotName: string | null;
      interests: string[];
      totalStars: number;
      starsToday: number;
      streak: number;
      rank: number;
      starsIntoRank: number;
      starsToNextRank: number;
    };
    expect(body.companion).toBe("buho");
    expect(body.mascotName).toBe("Pelusa");
    expect(body.interests).toEqual(["futbol"]);
    expect(body.totalStars).toBeGreaterThan(0);
    expect(body.starsToday).toBeGreaterThan(0);
    expect(body.streak).toBeGreaterThanOrEqual(1);
    // Rango 1 con las pocas estrellas que otorgan estas pruebas — nunca 0.
    expect(body.rank).toBeGreaterThanOrEqual(1);
    expect(body.starsIntoRank + body.starsToNextRank).toBe(10);
  });

  it("GET /home no funciona para un niño que no es del adulto autenticado (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/home`, { headers: { Cookie: otherCookie } });
    expect(res.status).toBe(404);
  });
});
