import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";
import { SKILL_COMPLETE_THRESHOLD } from "../../skillPath/skillPath.js";

describe("Mapa de habilidades (GET skill-path, sesión y ejercicios por habilidad)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let otherCookie: string;
  let childId: string;
  const email = `ficticio.skillpath.${Date.now()}@example.test`;
  const otherEmail = `ficticio.skillpath.other.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";

  async function registerAndLogin(mail: string) {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: mail, password }),
    });
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: mail, password }),
    });
    return loginRes.headers.get("set-cookie")!.split(";")[0]!;
  }

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;

    cookie = await registerAndLogin(email);
    otherCookie = await registerAndLogin(otherEmail);

    const consentRes = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba" }),
    });
    const { id: consentId } = (await consentRes.json()) as { id: string };

    const childRes = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ consentId, displayName: "Niño mapa", grade: 4 }),
    });
    const child = (await childRes.json()) as { id: string };
    childId = child.id;
  });

  afterAll(async () => {
    const child = await prisma.childProfile.findUnique({ where: { id: childId } });
    if (child) {
      await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: childId } } });
      await prisma.attempt.deleteMany({ where: { session: { childProfileId: childId } } });
      await prisma.starEvent.deleteMany({ where: { childProfileId: childId } });
      await prisma.session.deleteMany({ where: { childProfileId: childId } });
      await prisma.childProfile.delete({ where: { id: childId } });
      await prisma.consent.delete({ where: { id: child.consentId } });
    }
    await prisma.adultUser.deleteMany({ where: { email: { in: [email, otherEmail] } } });
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("trae las habilidades del curso del niño ordenadas, con la primera siempre disponible", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/skill-path`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      grade: number;
      skills: Array<{ id: string; order: number; status: string; grade: number }>;
    };
    expect(body.grade).toBe(4);
    expect(body.skills.length).toBeGreaterThan(0);
    expect(body.skills.every((s) => s.grade === 4)).toBe(true);
    // Vienen ordenadas por `order` ascendente.
    const orders = body.skills.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(body.skills[0]!.status).not.toBe("locked");
  });

  it("un adulto que no es dueño del niño no puede ver su mapa (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/skill-path`, { headers: { Cookie: otherCookie } });
    expect(res.status).toBe(404);
  });

  it("rechaza crear una sesión con un mathSkillId de otro curso", async () => {
    const otherGradeSkill = await prisma.mathSkill.findFirstOrThrow({ where: { grade: 5 } });
    const res = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ mathSkillId: otherGradeSkill.id }),
    });
    expect(res.status).toBe(400);
  });

  it("una sesión de un nodo del mapa solo entrega ejercicios de esa habilidad, nunca de otra del mismo curso", async () => {
    const skills = await prisma.mathSkill.findMany({ where: { grade: 4 }, orderBy: { order: "asc" }, take: 2 });
    const [target, other] = skills;
    expect(target).toBeDefined();
    expect(other).toBeDefined();

    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ mathSkillId: target!.id }),
    });
    expect(sessionRes.status).toBe(201);
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    for (let i = 0; i < 10; i++) {
      const exRes = await fetch(`${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`, {
        headers: { Cookie: cookie },
      });
      expect(exRes.status).toBe(200);
      const { id } = (await exRes.json()) as { id: string };
      const exercise = await prisma.exercise.findUnique({ where: { id } });
      expect(exercise?.mathSkillId).toBe(target!.id);
      expect(exercise?.mathSkillId).not.toBe(other!.id);
    }
  });

  it("responder correctamente el umbral de aciertos de la primera habilidad la marca completada y desbloquea la segunda", async () => {
    const skills = await prisma.mathSkill.findMany({ where: { grade: 4 }, orderBy: { order: "asc" }, take: 2 });
    const [first, second] = skills;

    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ mathSkillId: first!.id }),
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    let answered = 0;
    while (answered < SKILL_COMPLETE_THRESHOLD) {
      const exRes = await fetch(`${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`, {
        headers: { Cookie: cookie },
      });
      const exercise = (await exRes.json()) as { id: string; options: Array<{ id: string }> };
      const full = await prisma.exercise.findUnique({ where: { id: exercise.id }, include: { options: true } });
      const correctOption = full!.options.find((o) => o.isCorrect)!;
      await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ exerciseId: exercise.id, selectedOptionId: correctOption.id }),
      });
      answered += 1;
    }

    const pathRes = await fetch(`${baseUrl}/api/children/${childId}/skill-path`, { headers: { Cookie: cookie } });
    const body = (await pathRes.json()) as { skills: Array<{ id: string; status: string }> };
    const firstNode = body.skills.find((s) => s.id === first!.id)!;
    const secondNode = body.skills.find((s) => s.id === second!.id)!;
    expect(firstNode.status).toBe("completed");
    expect(secondNode.status).not.toBe("locked");
  });
});
