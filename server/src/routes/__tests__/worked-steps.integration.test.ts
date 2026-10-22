import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("desarrollo paso a paso y «encuentra el paso equivocado» (specs/015)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let skillId: string;
  const email = `ficticia.pasos.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";
  const call = (method: string, path: string, body?: unknown) =>
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
    const { id: consentId } = (await (await call("POST", "/api/consent", { scope: "MVP v1 — datos mínimos, ficticio de prueba" })).json()) as { id: string };
    childId = ((await (await call("POST", "/api/children", { consentId, displayName: "Niña ficticia", grade: 6 })).json()) as { id: string }).id;
    skillId = (await prisma.mathSkill.findFirstOrThrow({ where: { grade: 6, oaCode: "MA06 OA06" } })).id;
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
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("todo el piloto tiene desarrollo, y cada alternativa incorrecta su paso equivocado", async () => {
    const pilot = await prisma.exercise.findMany({
      where: { mathSkill: { oaCode: { in: ["MA03 OA11", "MA04 OA08", "MA05 OA07", "MA06 OA06", "MA06 OA04"] } } },
      include: { options: true },
    });
    expect(pilot.length).toBeGreaterThan(200);
    for (const e of pilot) {
      expect(Array.isArray(e.solution), e.id).toBe(true);
      for (const o of e.options.filter((x) => !x.isCorrect)) expect(o.wrongStep, `${e.id} ${o.label}`).not.toBeNull();
    }
  });

  it("el desarrollo llega solo después de responder, con el paso donde se desvió la alternativa elegida", async () => {
    const { sessionId } = (await (await call("POST", `/api/children/${childId}/sessions`, { mathSkillId: skillId })).json()) as { sessionId: string };
    const next = (await (await call("GET", `/api/children/${childId}/next-exercise?sessionId=${sessionId}`)).json()) as Record<string, unknown> & { id: string };
    expect(next.solution).toBeUndefined();
    expect(JSON.stringify(next)).not.toContain("wrongStep");
    const ex = await prisma.exercise.findUniqueOrThrow({ where: { id: next.id }, include: { options: true } });
    const wrong = ex.options.find((o) => !o.isCorrect)!;
    const res = (await (await call("POST", `/api/sessions/${sessionId}/attempts`, { exerciseId: ex.id, selectedOptionId: wrong.id })).json()) as {
      solution: Array<{ es: string }>;
      wrongStep: { step: number; es: string };
    };
    expect(res.solution).toEqual(ex.solution);
    expect(res.wrongStep).toEqual(wrong.wrongStep);
    const ok = ex.options.find((o) => o.isCorrect)!;
    const res2 = (await (await call("POST", `/api/sessions/${sessionId}/attempts`, { exerciseId: ex.id, selectedOptionId: ok.id })).json()) as { wrongStep: unknown; solution: unknown };
    expect(res2.wrongStep).toBeNull();
    expect(res2.solution).toEqual(ex.solution);
  });

  it("la ronda «encuentra el paso equivocado» aparece en su turno y premia encontrar la línea correcta", async () => {
    const { sessionId } = (await (await call("POST", `/api/children/${childId}/sessions`, { mathSkillId: skillId })).json()) as { sessionId: string };
    let round: { mode: string; id: string; lines: unknown[]; wrongOptionId: string } | null = null;
    for (let i = 0; i < 6 && !round; i++) {
      const next = (await (await call("GET", `/api/children/${childId}/next-exercise?sessionId=${sessionId}`)).json()) as { mode: string; id: string; lines: unknown[]; wrongOptionId: string };
      if (next.mode === "find_step") {
        round = next;
        break;
      }
      const ex = await prisma.exercise.findUniqueOrThrow({ where: { id: next.id }, include: { options: true } });
      await call("POST", `/api/sessions/${sessionId}/attempts`, { exerciseId: ex.id, selectedOptionId: ex.options.find((o) => o.isCorrect)!.id });
    }
    expect(round).not.toBeNull();
    expect(round!.lines.length).toBeGreaterThanOrEqual(2);
    const option = await prisma.exerciseOption.findUniqueOrThrow({ where: { id: round!.wrongOptionId } });
    const step = (option.wrongStep as { step: number }).step;
    expect(step).toBe(round!.lines.length - 1);

    const bad = (await (await call("POST", `/api/sessions/${sessionId}/find-step-attempts`, { exerciseId: round!.id, wrongOptionId: round!.wrongOptionId, chosenLine: 0 })).json()) as { isCorrect: boolean; correctLine: number; correctStep: unknown };
    expect(bad).toMatchObject({ isCorrect: false, correctLine: step });
    expect(bad.correctStep).toBeTruthy();
    const good = (await (await call("POST", `/api/sessions/${sessionId}/find-step-attempts`, { exerciseId: round!.id, wrongOptionId: round!.wrongOptionId, chosenLine: step })).json()) as { isCorrect: boolean };
    expect(good.isCorrect).toBe(true);
    const correct = await prisma.exerciseOption.findFirstOrThrow({ where: { exerciseId: round!.id, isCorrect: true } });
    expect((await call("POST", `/api/sessions/${sessionId}/find-step-attempts`, { exerciseId: round!.id, wrongOptionId: correct.id, chosenLine: 0 })).status).toBe(400);
  });
});
