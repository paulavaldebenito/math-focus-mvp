import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("paneles escolares (specs/014)", () => {
  let server: Server;
  let baseUrl: string;
  const stamp = Date.now();
  const emails = { dir: `ficticia.dir.${stamp}@example.test`, prof: `ficticia.prof.${stamp}@example.test`, otra: `ficticia.otraprof.${stamp}@example.test`, fam: `ficticia.fam.${stamp}@example.test` };
  const cookies: Record<string, string> = {};
  const password = "clave-de-prueba-segura";
  let schoolId = "";
  let staffCode = "";
  let classroomId = "";
  let joinCode = "";
  let childId = "";

  const call = (who: string, method: string, path: string, body?: unknown) =>
    fetch(`${baseUrl}${path}`, { method, headers: { "Content-Type": "application/json", Cookie: cookies[who]! }, body: body === undefined ? undefined : JSON.stringify(body) });

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    baseUrl = `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
    for (const [k, email] of Object.entries(emails)) {
      await fetch(`${baseUrl}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const r = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      cookies[k] = r.headers.get("set-cookie")!.split(";")[0]!;
    }
    const { id: consentId } = (await (await call("fam", "POST", "/api/consent", { scope: "MVP v1 — datos mínimos, ficticio de prueba" })).json()) as { id: string };
    const created = await call("fam", "POST", "/api/children", { consentId, displayName: "Niño ficticio", grade: 3 });
    const createdBody = (await created.json()) as { id: string };
    if (created.status !== 201) throw new Error(`hijo no creado: ${created.status} ${JSON.stringify(createdBody)} consent=${consentId}`);
    childId = createdBody.id;
  });

  afterAll(async () => {
    const adults = await prisma.adultUser.findMany({ where: { email: { in: Object.values(emails) } }, select: { id: true } });
    const adultIds = adults.map((a) => a.id);
    await prisma.teacherNote.deleteMany({ where: { authorId: { in: adultIds } } });
    await prisma.classEnrollment.deleteMany({ where: { childProfileId: childId } });
    await prisma.sessionReflection.deleteMany({ where: { childProfileId: childId } });
    await prisma.attempt.deleteMany({ where: { session: { childProfileId: childId } } });
    await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: childId } } });
    await prisma.starEvent.deleteMany({ where: { childProfileId: childId } });
    await prisma.session.deleteMany({ where: { childProfileId: childId } });
    const child = await prisma.childProfile.findUnique({ where: { id: childId } });
    if (child) {
      await prisma.childProfile.delete({ where: { id: childId } });
      await prisma.consent.delete({ where: { id: child.consentId } });
    }
    if (schoolId) {
      await prisma.classroom.deleteMany({ where: { schoolId } });
      await prisma.schoolStaff.deleteMany({ where: { schoolId } });
      await prisma.school.delete({ where: { id: schoolId } });
    }
    await prisma.adultUser.deleteMany({ where: { id: { in: adultIds } } });
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("la directiva crea el colegio, la docente se une con el código y crea su curso", async () => {
    const s = (await (await call("dir", "POST", "/api/school", { name: "Colegio Ficticio" })).json()) as { id: string; staffCode: string };
    schoolId = s.id;
    staffCode = s.staffCode;
    expect(staffCode).toMatch(/^COL-/);
    expect(((await (await call("dir", "GET", "/api/auth/me")).json()) as { isStaff: boolean }).isStaff).toBe(true);
    expect((await call("prof", "POST", "/api/school/join", { staffCode: "COL-NOPE1" })).status).toBe(404);
    expect((await call("prof", "POST", "/api/school/join", { staffCode: staffCode.toLowerCase() })).status).toBe(201);
    expect((await call("otra", "POST", "/api/school/join", { staffCode })).status).toBe(201);
    const c = (await (await call("prof", "POST", `/api/school/${schoolId}/classrooms`, { name: "3° B", grade: 3 })).json()) as { id: string; joinCode: string };
    classroomId = c.id;
    joinCode = c.joinCode;
    expect(joinCode).toMatch(/^3B-/);
    const mine = (await (await call("prof", "GET", "/api/school/mine")).json()) as { schools: Array<{ role: string; staffCode: string | null; classrooms: unknown[] }> };
    expect(mine.schools[0]).toMatchObject({ role: "teacher", staffCode: null });
    expect(mine.schools[0]!.classrooms).toHaveLength(1);
    expect(((await (await call("otra", "GET", "/api/school/mine")).json()) as { schools: Array<{ classrooms: unknown[] }> }).schools[0]!.classrooms).toHaveLength(0);
  });

  it("la familia vincula a su hijo con el código del curso (mismo curso escolar) y decide sobre las emociones", async () => {
    expect((await call("fam", "POST", `/api/children/${childId}/classroom`, { joinCode: "3B-XXXXX", shareEmotions: false })).status).toBe(404);
    const wrongGrade = await prisma.classroom.create({ data: { schoolId, teacherId: (await prisma.schoolStaff.findFirstOrThrow({ where: { schoolId, role: "teacher" } })).id, name: "5° A", grade: 5, joinCode: `5B-T${stamp % 100000}` } });
    expect((await call("fam", "POST", `/api/children/${childId}/classroom`, { joinCode: wrongGrade.joinCode, shareEmotions: false })).status).toBe(409);
    const r = await call("fam", "POST", `/api/children/${childId}/classroom`, { joinCode, shareEmotions: false });
    expect(r.status).toBe(201);
    expect(await r.json()).toMatchObject({ classroomName: "3° B", schoolName: "Colegio Ficticio", shareEmotions: false });
    expect((await call("prof", "POST", `/api/children/${childId}/classroom`, { joinCode, shareEmotions: true })).status).toBe(404);
  });

  it("solo la docente del curso y la directiva ven el panel del curso; la ficha muestra emociones solo con consentimiento", async () => {
    const skill = await prisma.mathSkill.findFirstOrThrow({ where: { grade: 3, oaCode: "MA03 OA11" } });
    const session = await prisma.session.create({ data: { childProfileId: childId, mathSkillId: skill.id } });
    const ex = await prisma.exercise.findFirstOrThrow({ where: { mathSkillId: skill.id }, include: { options: true } });
    for (let i = 0; i < 4; i++) await prisma.attempt.create({ data: { sessionId: session.id, exerciseId: ex.id, selectedOptionId: ex.options.find((o) => !o.isCorrect)!.id, isCorrect: false } });
    await prisma.sessionReflection.create({ data: { childProfileId: childId, sessionId: session.id, mathSkillId: skill.id, emotion: "nervios" } });

    for (const who of ["otra", "fam"]) expect((await call(who, "GET", `/api/school/classrooms/${classroomId}/dashboard`)).status).toBe(404);
    const dash = (await (await call("prof", "GET", `/api/school/classrooms/${classroomId}/dashboard`)).json()) as {
      students: Array<{ id: string }>;
      heatmap: Record<string, Record<string, { level: string }>>;
      climate: { emotionCounts: Record<string, number>; alerts: unknown[] };
    };
    expect(dash.students.map((s) => s.id)).toEqual([childId]);
    expect(dash.heatmap[childId]![skill.id]!.level).toBe("inicial");
    expect(dash.climate.emotionCounts.nervios).toBe(1);
    expect((await call("dir", "GET", `/api/school/classrooms/${classroomId}/dashboard`)).status).toBe(200);

    const file = async () => (await (await call("prof", "GET", `/api/school/classrooms/${classroomId}/students/${childId}`)).json()) as { emotions: unknown[] | null; cells: Record<string, { level: string }> };
    expect((await file()).emotions).toBeNull();
    expect((await call("fam", "PATCH", `/api/children/${childId}/classroom`, { shareEmotions: true })).status).toBe(200);
    expect((await file()).emotions).toHaveLength(1);

    expect((await call("prof", "POST", `/api/school/classrooms/${classroomId}/students/${childId}/notes`, { text: "Trabajar fracciones con material concreto." })).status).toBe(201);
    expect(((await (await call("prof", "GET", `/api/school/classrooms/${classroomId}/students/${childId}`)).json()) as { notes: unknown[] }).notes).toHaveLength(1);
  });

  it("el panel directivo es solo para directivas y nunca muestra grupos de menos de 5", async () => {
    expect((await call("prof", "GET", `/api/school/${schoolId}/director`)).status).toBe(404);
    const d = (await (await call("dir", "GET", `/api/school/${schoolId}/director`)).json()) as {
      totals: { students: number; teachers: number };
      classes: Array<{ name: string; logrado: { ok: boolean } }>;
    };
    expect(d.totals.students).toBe(1);
    expect(d.classes.find((c) => c.name === "3° B")!.logrado).toEqual({ ok: false, students: 1 });
    expect(JSON.stringify(d)).not.toContain("Niño ficticio");
  });

  it("si la familia desvincula al niño, deja de aparecer en el curso", async () => {
    expect((await call("fam", "DELETE", `/api/children/${childId}/classroom`)).status).toBe(204);
    const dash = (await (await call("prof", "GET", `/api/school/classrooms/${classroomId}/dashboard`)).json()) as { students: unknown[] };
    expect(dash.students).toHaveLength(0);
    expect(((await (await call("fam", "GET", `/api/children/${childId}/classroom`)).json()) as { enrollment: unknown }).enrollment).toBeNull();
  });
});
