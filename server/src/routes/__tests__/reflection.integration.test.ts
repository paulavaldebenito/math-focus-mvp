import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("reflexión al cerrar la práctica y juegos para la casa (specs/013)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let skillId: string;
  const email = `ficticia.reflexion.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";
  const json = (method: string, path: string, body?: unknown) =>
    fetch(`${baseUrl}${path}`, { method, headers: { "Content-Type": "application/json", Cookie: cookie }, body: body === undefined ? undefined : JSON.stringify(body) });

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    baseUrl = `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
    await fetch(`${baseUrl}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const login = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    cookie = login.headers.get("set-cookie")!.split(";")[0]!;
    const { id: consentId } = (await (await json("POST", "/api/consent", { scope: "ficticio de prueba" })).json()) as { id: string };
    childId = ((await (await json("POST", "/api/children", { consentId, displayName: "Niña ficticia", grade: 3 })).json()) as { id: string }).id;
    skillId = (await prisma.mathSkill.findFirstOrThrow({ where: { grade: 3, oaCode: "MA03 OA11" } })).id;
  });

  afterAll(async () => {
    const child = await prisma.childProfile.findUnique({ where: { id: childId } });
    if (child) {
      await prisma.sessionReflection.deleteMany({ where: { childProfileId: childId } });
      await prisma.homeGamePlay.deleteMany({ where: { childProfileId: childId } });
      await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: childId } } });
      await prisma.attempt.deleteMany({ where: { session: { childProfileId: childId } } });
      await prisma.starEvent.deleteMany({ where: { childProfileId: childId } });
      await prisma.session.deleteMany({ where: { childProfileId: childId } });
      await prisma.childProfile.delete({ where: { id: childId } });
      await prisma.consent.delete({ where: { id: child.consentId } });
    }
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  async function practiceWrong(times: number) {
    const start = (await (await json("POST", `/api/children/${childId}/sessions`, { mathSkillId: skillId })).json()) as { sessionId: string; reflectionQuestion: string };
    const exercises = await prisma.exercise.findMany({ where: { mathSkillId: skillId }, include: { options: true }, take: times });
    for (const ex of exercises) {
      const wrong = ex.options.find((o) => !o.isCorrect)!;
      await json("POST", `/api/sessions/${start.sessionId}/attempts`, { exerciseId: ex.id, selectedOptionId: wrong.id });
    }
    return start;
  }

  it("la pregunta lúdica rota, la reflexión se guarda una vez por sesión ligada al tema, y el panel guía y propone el juego", async () => {
    const s1 = await practiceWrong(5);
    expect(s1.reflectionQuestion).toBe("weather");
    expect((await json("POST", `/api/sessions/${s1.sessionId}/reflection`, { emotion: "enojo" })).status).toBe(400);
    expect((await json("POST", `/api/sessions/${s1.sessionId}/reflection`, { emotion: "nervios", weather: 2 })).status).toBe(201);
    expect((await json("POST", `/api/sessions/${s1.sessionId}/reflection`, {})).status).toBe(409);
    const saved = await prisma.sessionReflection.findUniqueOrThrow({ where: { sessionId: s1.sessionId } });
    expect(saved.mathSkillId).toBe(skillId);

    const s2 = await practiceWrong(1);
    expect(s2.reflectionQuestion).toBe("energy");
    expect((await json("POST", `/api/sessions/${s2.sessionId}/reflection`, {})).status).toBe(201); // saltada

    const progress = (await (await json("GET", `/api/children/${childId}/progress`)).json()) as {
      feelings: { answered: number; focus: string[]; guidance: Array<{ emotion: string; say: { es: string[] } }> };
      topics: Array<{ skillId: string; needsHelp: string[]; lastEmotion: string; game: { name: { es: string } }; timesPlayed: number }>;
      skillsToReview: Array<{ game: unknown }>;
    };
    expect(progress.feelings.answered).toBe(1);
    expect(progress.feelings.focus[0]).toBe("nervios");
    expect(progress.feelings.guidance[0]!.say.es.length).toBeGreaterThan(0);
    const topic = progress.topics.find((t) => t.skillId === skillId)!;
    expect(topic).toMatchObject({ lastEmotion: "nervios", needsHelp: ["aciertos", "emocion"], timesPlayed: 0 });
    expect(topic.game.name.es.length).toBeGreaterThan(3);
    expect(progress.skillsToReview[0]!.game).toBeTruthy();

    const played = await json("POST", `/api/children/${childId}/home-games`, { mathSkillId: skillId });
    expect(played.status).toBe(201);
    expect(await played.json()).toEqual({ timesPlayed: 1 });
    expect((await json("POST", `/api/children/${childId}/home-games`, { mathSkillId: "no-existe" })).status).toBe(400);
  });

  it("otra familia no puede escribir la reflexión ni registrar juegos de este niño", async () => {
    const otherEmail = `ficticia.otra.${Date.now()}@example.test`;
    await fetch(`${baseUrl}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: otherEmail, password }) });
    const login = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: otherEmail, password }) });
    const other = login.headers.get("set-cookie")!.split(";")[0]!;
    const session = await prisma.session.findFirstOrThrow({ where: { childProfileId: childId } });
    const post = (path: string, body: unknown) => fetch(`${baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: other }, body: JSON.stringify(body) });
    expect((await post(`/api/sessions/${session.id}/reflection`, { emotion: "calma" })).status).toBe(404);
    expect((await post(`/api/children/${childId}/home-games`, { mathSkillId: skillId })).status).toBe(404);
    await prisma.adultUser.deleteMany({ where: { email: otherEmail } });
  });
});
