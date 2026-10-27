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
    body: JSON.stringify({ consentId, displayName: "Niño ficticio", grade: 5 }),
  });
  const child = (await childRes.json()) as { id: string };

  return { cookie, childId: child.id };
}

describe("Evaluación de ubicación adaptativa (specs/020)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let otherCookie: string;
  const email = `ficticio.assess.${Date.now()}@example.test`;
  const otherEmail = `ficticio.assess.other.${Date.now()}@example.test`;
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
    await prisma.skillPlacement.deleteMany({ where: { childProfileId: { in: childIdsToClean } } });
    await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: { in: childIdsToClean } } } });
    await prisma.attempt.deleteMany({ where: { session: { childProfileId: { in: childIdsToClean } } } });
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

  type Exercise = { id: string; options: Array<Record<string, unknown> & { id: string }> };
  type Step = { done: boolean; exercise?: Exercise; sessionId?: string; reviewCount?: number; correctCount?: number; total?: number; initialLevel?: number };

  const oaOf = async (exerciseId: string) =>
    (await prisma.exercise.findUnique({ where: { id: exerciseId }, select: { mathSkill: { select: { oaCode: true } } } }))!.mathSkill.oaCode!;

  async function answer(sessionId: string, ex: Exercise, correct: boolean, as = cookie) {
    const full = await prisma.exercise.findUnique({ where: { id: ex.id }, include: { options: true } });
    const option = full!.options.find((o) => o.isCorrect === correct)!;
    return fetch(`${baseUrl}/api/children/${childId}/initial-assessment/${sessionId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: as },
      body: JSON.stringify({ exerciseId: ex.id, selectedOptionId: option.id, responseTimeMs: 8000 }),
    });
  }

  async function start(as = cookie) {
    return fetch(`${baseUrl}/api/children/${childId}/initial-assessment`, { method: "POST", headers: { Cookie: as } });
  }

  it("empieza por su curso y no filtra cuál alternativa es correcta", async () => {
    await prisma.childProfile.update({ where: { id: childId }, data: { interests: [] } });
    const res = await start();
    expect(res.status).toBe(201);
    const body = (await res.json()) as Step;
    expect(body.done).toBe(false);
    expect((await oaOf(body.exercise!.id)).startsWith("MA05")).toBe(true);
    for (const opt of body.exercise!.options) {
      expect(opt).not.toHaveProperty("isCorrect");
      expect(opt).not.toHaveProperty("errorTypeId");
    }
  });

  it("un adulto no puede evaluar a un niño que no es suyo (404)", async () => {
    expect((await start(otherCookie)).status).toBe(404);
    const mine = (await (await start()).json()) as Step;
    expect((await answer(mine.sessionId!, mine.exercise!, true, otherCookie)).status).toBe(404);
  });

  it("niño de 5° que no sabe las tablas: baja de curso, arma su repaso y puede practicarlo", async () => {
    // Falla todo lo que depende de multiplicar y dividir; acierta lo demás.
    const weak = new Set(["MA05 OA04", "MA04 OA06", "MA04 OA05", "MA03 OA09", "MA03 OA08", "MA02 OA11"]);
    let step = (await (await start()).json()) as Step;
    const sessionId = step.sessionId!;
    const asked: string[] = [];
    for (let i = 0; i < 20 && !step.done; i++) {
      const oa = await oaOf(step.exercise!.id);
      asked.push(oa);
      const res = await answer(sessionId, step.exercise!, !weak.has(oa));
      expect(res.status).toBe(200);
      step = (await res.json()) as Step;
    }
    expect(step.done).toBe(true);
    expect(step.total).toBeLessThanOrEqual(15);
    expect(asked).toContain("MA03 OA08"); // bajó hasta las tablas
    expect(step.reviewCount).toBeGreaterThanOrEqual(3);

    const decision = await prisma.adaptiveDecision.findFirst({ where: { sessionId } });
    expect(decision?.ruleCode).toBe("INITIAL_ASSESSMENT");

    // El mapa trae el repaso, de la base más baja a la más alta, y la primera está abierta.
    const path = (await (await fetch(`${baseUrl}/api/children/${childId}/skill-path`, { headers: { Cookie: cookie } })).json()) as {
      review: Array<{ id: string; oaCode: string; status: string }>;
      skills: Array<{ oaCode: string; afterReview: boolean }>;
    };
    expect(path.review[0]!.status).toBe("available");
    expect(path.review.map((r) => r.oaCode)).toContain("MA03 OA08");
    expect(path.skills.find((s) => s.oaCode === "MA05 OA04")!.afterReview).toBe(true);
    expect(path.skills.find((s) => s.oaCode === "MA05 OA01")!.afterReview).toBe(false);

    // Puede practicar una habilidad de su repaso, pero no una de otro curso que no está en él.
    const first = path.review[0]!;
    const practice = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ mathSkillId: first.id }),
    });
    expect(practice.status).toBe(201);
    const { sessionId: practiceId } = (await practice.json()) as { sessionId: string };
    const next = (await (await fetch(`${baseUrl}/api/children/${childId}/next-exercise?sessionId=${practiceId}`, { headers: { Cookie: cookie } })).json()) as { id: string };
    expect(await oaOf(next.id)).toBe(first.oaCode);

    const other = await prisma.mathSkill.findFirst({ where: { oaCode: "MA01 OA20" } });
    const refused = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ mathSkillId: other!.id }),
    });
    expect(refused.status).toBe(400);

    // Una evaluación terminada no acepta más respuestas.
    expect((await answer(sessionId, step.exercise ?? { id: next.id, options: [] }, true)).status).toBe(409);
  });

  it("no acepta respuestas a otra habilidad que la que tocaba, ni intentos de práctica", async () => {
    const step = (await (await start()).json()) as Step;
    const wrongSkill = await prisma.exercise.findFirst({ where: { mathSkill: { oaCode: "MA01 OA20" } }, include: { options: true } });
    const res = await answer(step.sessionId!, { id: wrongSkill!.id, options: [] }, true);
    expect(res.status).toBe(409);
    const practiceRoute = await fetch(`${baseUrl}/api/sessions/${step.sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: step.exercise!.id, selectedOptionId: step.exercise!.options[0]!.id }),
    });
    expect(practiceRoute.status).toBe(404);
  });

  // En serie: la BD local de desarrollo (prisma dev) no tolera consultas simultáneas. La carrera real
  // la resuelve el reclamo atómico de pendingExerciseId (un updateMany condicionado en Postgres).
  it("un reenvío de la misma respuesta (doble toque, reintento) cuenta una sola vez", async () => {
    const step = (await (await start()).json()) as Step;
    const a = await answer(step.sessionId!, step.exercise!, true);
    const b = await answer(step.sessionId!, step.exercise!, true);
    expect([a.status, b.status]).toEqual([200, 409]);
    expect(await prisma.attempt.count({ where: { sessionId: step.sessionId! } })).toBe(1);
  });

  it("rechaza una opción que no es de la pregunta, sin gastar la pregunta", async () => {
    const step = (await (await start()).json()) as Step;
    const other = await prisma.exerciseOption.findFirst({ where: { exerciseId: { not: step.exercise!.id } } });
    const res = await fetch(`${baseUrl}/api/children/${childId}/initial-assessment/${step.sessionId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: step.exercise!.id, selectedOptionId: other!.id }),
    });
    expect(res.status).toBe(400);
    expect((await answer(step.sessionId!, step.exercise!, true)).status).toBe(200);
  });

  it("las rutas de práctica no aceptan una sesión de ubicación (ni cerrarla)", async () => {
    const step = (await (await start()).json()) as Step;
    const complete = await fetch(`${baseUrl}/api/sessions/${step.sessionId}/complete`, { method: "POST", headers: { Cookie: cookie } });
    expect(complete.status).toBe(404);
    const row = await prisma.session.findUnique({ where: { id: step.sessionId! } });
    expect(row?.endedAt).toBeNull();
  });

  it("«todavía no lo sé» cuenta como no dominada, sin elegir alternativa", async () => {
    const step = (await (await start()).json()) as Step;
    const res = await fetch(`${baseUrl}/api/children/${childId}/initial-assessment/${step.sessionId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: step.exercise!.id, dontKnow: true }),
    });
    expect(res.status).toBe(200);
    const row = await prisma.attempt.findFirst({ where: { sessionId: step.sessionId! } });
    expect(row?.isCorrect).toBe(false);
    expect(row?.selectedOptionId).toBeNull();
  });
});
