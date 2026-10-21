import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("modo revisión /api/review (specs/011)", () => {
  let server: Server;
  let baseUrl: string;
  let reviewerCookie: string;
  let familyCookie: string;
  const stamp = Date.now();
  const reviewer = `ficticia.revisora.${stamp}@example.test`;
  const family = `ficticia.familia.${stamp}@example.test`;
  const password = "clave-de-prueba-segura";
  const previousEnv = process.env.REVIEWER_EMAILS;

  async function loginAs(email: string) {
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return { cookie: res.headers.get("set-cookie")!.split(";")[0]!, body: (await res.json()) as { isReviewer: boolean } };
  }
  const get = (path: string, cookie = reviewerCookie) => fetch(`${baseUrl}${path}`, { headers: { Cookie: cookie } });
  const post = (path: string, body: unknown, cookie = reviewerCookie) =>
    fetch(`${baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(body) });

  beforeAll(async () => {
    process.env.REVIEWER_EMAILS = ` ${reviewer.toUpperCase()} , otra@example.test`;
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    baseUrl = `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
    const r = await loginAs(reviewer);
    reviewerCookie = r.cookie;
    expect(r.body.isReviewer).toBe(true);
    const f = await loginAs(family);
    familyCookie = f.cookie;
    expect(f.body.isReviewer).toBe(false);
  });

  afterAll(async () => {
    process.env.REVIEWER_EMAILS = previousEnv;
    await prisma.reviewComment.deleteMany({ where: { adultUser: { email: { in: [reviewer, family] } } } });
    await prisma.adultUser.deleteMany({ where: { email: { in: [reviewer, family] } } });
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("sin sesión es 401 y una cuenta de familia es 403", async () => {
    expect((await fetch(`${baseUrl}/api/review/skills?grade=1`)).status).toBe(401);
    expect((await get("/api/review/skills?grade=1", familyCookie)).status).toBe(403);
    expect((await get("/api/review/comments", familyCookie)).status).toBe(403);
  });

  it("/me dice si la cuenta es revisora", async () => {
    const me = (await (await get("/api/auth/me")).json()) as { isReviewer: boolean };
    expect(me.isReviewer).toBe(true);
  });

  it("lista habilidades de cualquier curso 1-6 y rechaza otros", async () => {
    for (const grade of [1, 6]) {
      const res = await get(`/api/review/skills?grade=${grade}`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { skills: Array<{ exerciseCount: number }> };
      expect(body.skills.length).toBeGreaterThan(0);
      expect(body.skills.every((s) => s.exerciseCount > 0)).toBe(true);
    }
    expect((await get("/api/review/skills?grade=7")).status).toBe(400);
  });

  it("muestra el ejercicio como a un niño, responde sin guardar intentos y revela la correcta", async () => {
    const skill = await prisma.mathSkill.findFirstOrThrow({ where: { grade: 6, oaCode: "MA06 OA04" } });
    const list = (await (await get(`/api/review/skills/${skill.id}/exercises`)).json()) as {
      exercises: Array<{ id: string; groupKey: string; theme: string | null }>;
    };
    expect(list.exercises.length).toBe(await prisma.exercise.count({ where: { mathSkillId: skill.id } }));
    // Las variantes de un problema quedan seguidas, con la neutra primero.
    const keys = list.exercises.map((e) => e.groupKey);
    expect(new Set(keys).size).toBe(keys.filter((k, i) => i === 0 || keys[i - 1] !== k).length);

    const exerciseId = list.exercises[0]!.id;
    const ex = (await (await get(`/api/review/exercises/${exerciseId}`)).json()) as Record<string, unknown> & {
      options: Array<Record<string, unknown>>;
    };
    expect(ex.mode).toBe("solve");
    expect(ex.options.length).toBeGreaterThan(1);
    for (const o of ex.options) expect(Object.keys(o).sort()).toEqual(["id", "label", "labelEn"]);

    const attemptsBefore = await prisma.attempt.count();
    const correct = await prisma.exerciseOption.findFirstOrThrow({ where: { exerciseId, isCorrect: true } });
    const wrong = await prisma.exerciseOption.findFirstOrThrow({ where: { exerciseId, isCorrect: false } });
    const ok = (await (await post(`/api/review/exercises/${exerciseId}/answer`, { selectedOptionId: correct.id })).json()) as Record<string, unknown>;
    expect(ok).toMatchObject({ isCorrect: true, errorCode: null, correctOptionId: correct.id, feedback: correct.feedback });
    const bad = (await (await post(`/api/review/exercises/${exerciseId}/answer`, { selectedOptionId: wrong.id })).json()) as Record<string, unknown>;
    expect(bad).toMatchObject({ isCorrect: false, correctOptionId: correct.id, feedback: wrong.feedback });
    expect(await prisma.attempt.count()).toBe(attemptsBefore);

    const foreign = await prisma.exerciseOption.findFirstOrThrow({ where: { exerciseId: { not: exerciseId } } });
    expect((await post(`/api/review/exercises/${exerciseId}/answer`, { selectedOptionId: foreign.id })).status).toBe(400);
  });

  it("guarda, lista y borra comentarios; solo la autora puede borrar", async () => {
    const exercise = await prisma.exercise.findFirstOrThrow({ where: { mathSkill: { grade: 1 } } });
    expect((await post(`/api/review/exercises/${exercise.id}/comments`, { text: "   " })).status).toBe(400);
    const res = await post(`/api/review/exercises/${exercise.id}/comments`, { text: "La imagen no calza con el enunciado." });
    expect(res.status).toBe(201);
    const c = (await res.json()) as { id: string; author: string };
    expect(c.author).toBe(reviewer);

    const detail = (await (await get(`/api/review/exercises/${exercise.id}`)).json()) as { comments: Array<{ id: string }> };
    expect(detail.comments.map((x) => x.id)).toContain(c.id);
    const all = (await (await get("/api/review/comments")).json()) as { comments: Array<{ id: string; exercise: { id: string } }> };
    expect(all.comments.find((x) => x.id === c.id)?.exercise.id).toBe(exercise.id);

    const other = await prisma.adultUser.create({ data: { email: `ficticia.otra.${stamp}@example.test`, passwordHash: "x" } });
    const foreign = await prisma.reviewComment.create({ data: { exerciseId: exercise.id, adultUserId: other.id, text: "ajeno" } });
    expect((await fetch(`${baseUrl}/api/review/comments/${foreign.id}`, { method: "DELETE", headers: { Cookie: reviewerCookie } })).status).toBe(404);
    await prisma.reviewComment.delete({ where: { id: foreign.id } });
    await prisma.adultUser.delete({ where: { id: other.id } });

    expect((await fetch(`${baseUrl}/api/review/comments/${c.id}`, { method: "DELETE", headers: { Cookie: reviewerCookie } })).status).toBe(204);
    expect(await prisma.reviewComment.findUnique({ where: { id: c.id } })).toBeNull();
  });
});
