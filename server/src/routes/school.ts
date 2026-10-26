import { Router } from "express";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../auth/session.js";
import { requireFamilyUnlock } from "./family.js";
import { getOwnedChild } from "./childAccess.js";
import { localDay } from "../domain/wellbeing.js";
import { topicProgress } from "../domain/feelings.js";
import {
  buildDirectorDashboard,
  buildTeacherDashboard,
  type AttemptRow,
  type Skill,
} from "../domain/schoolAnalytics.js";

/**
 * Paneles escolares (specs/014-paneles-escolares). Colegio → personal
 * (directiva/docente) → cursos con código → matrícula de cada niño, que
 * hace la FAMILIA con el código del curso (eso es su consentimiento para
 * compartir el progreso; las emociones individuales, aparte).
 */
export const schoolRouter = Router();
export const childClassroomRouter = Router({ mergeParams: true });

// Sin letras/números que se confunden al dictar un código (0/O, 1/I/L).
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const code = (n: number) => Array.from({ length: n }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");

async function uniqueCode(prefix: string, exists: (c: string) => Promise<boolean>): Promise<string> {
  for (;;) {
    const c = `${prefix}${code(5)}`;
    if (!(await exists(c))) return c;
  }
}

async function staffOf(adultUserId: string) {
  return prisma.schoolStaff.findMany({ where: { adultUserId }, include: { school: true } });
}

/// La docente del curso, o cualquier directiva de su colegio.
async function classroomAccess(classroomId: string, adultUserId: string) {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId }, include: { teacher: true } });
  if (!classroom) return null;
  const staff = await prisma.schoolStaff.findUnique({ where: { schoolId_adultUserId: { schoolId: classroom.schoolId, adultUserId } } });
  if (!staff) return null;
  if (staff.role !== "director" && classroom.teacherId !== staff.id) return null;
  return { classroom, staff };
}

const schoolSchema = z.object({ name: z.string().trim().min(2).max(120) }).strict();
schoolRouter.post("/", requireAuth, async (req, res) => {
  const parsed = schoolSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const staffCode = await uniqueCode("COL-", async (c) => !!(await prisma.school.findUnique({ where: { staffCode: c } })));
  const school = await prisma.school.create({
    data: { name: parsed.data.name, staffCode, staff: { create: { adultUserId: req.session.adultUserId!, role: "director" } } },
  });
  res.status(201).json({ id: school.id, name: school.name, staffCode });
});

const joinSchoolSchema = z.object({ staffCode: z.string().trim().min(4).max(20) }).strict();
schoolRouter.post("/join", requireAuth, async (req, res) => {
  const parsed = joinSchoolSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }
  const school = await prisma.school.findUnique({ where: { staffCode: parsed.data.staffCode.toUpperCase() } });
  if (!school) {
    res.status(404).json({ error: "school_not_found" });
    return;
  }
  await prisma.schoolStaff.upsert({
    where: { schoolId_adultUserId: { schoolId: school.id, adultUserId: req.session.adultUserId! } },
    create: { schoolId: school.id, adultUserId: req.session.adultUserId!, role: "teacher" },
    update: {},
  });
  res.status(201).json({ id: school.id, name: school.name });
});

/// Colegios del adulto, su rol y los cursos que puede ver.
schoolRouter.get("/mine", requireAuth, async (req, res) => {
  const staff = await staffOf(req.session.adultUserId!);
  const out = [];
  for (const s of staff) {
    const classrooms = await prisma.classroom.findMany({
      where: s.role === "director" ? { schoolId: s.schoolId } : { teacherId: s.id },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
      include: { _count: { select: { enrollments: { where: { leftAt: null } } } } },
    });
    out.push({
      schoolId: s.schoolId,
      schoolName: s.school.name,
      role: s.role,
      // Solo la directiva comparte el código del personal.
      staffCode: s.role === "director" ? s.school.staffCode : null,
      classrooms: classrooms.map((c) => ({ id: c.id, name: c.name, grade: c.grade, joinCode: c.joinCode, students: c._count.enrollments, mine: c.teacherId === s.id })),
    });
  }
  res.json({ schools: out });
});

const classroomSchema = z.object({ name: z.string().trim().min(1).max(40), grade: z.number().int().min(1).max(6) }).strict();
schoolRouter.post("/:schoolId/classrooms", requireAuth, async (req, res) => {
  const staff = await prisma.schoolStaff.findUnique({ where: { schoolId_adultUserId: { schoolId: String(req.params.schoolId), adultUserId: req.session.adultUserId! } } });
  if (!staff) {
    res.status(404).json({ error: "school_not_found" });
    return;
  }
  const parsed = classroomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    return;
  }
  const joinCode = await uniqueCode(`${parsed.data.grade}B-`, async (c) => !!(await prisma.classroom.findUnique({ where: { joinCode: c } })));
  const c = await prisma.classroom.create({ data: { schoolId: staff.schoolId, teacherId: staff.id, ...parsed.data, joinCode } });
  res.status(201).json({ id: c.id, name: c.name, grade: c.grade, joinCode });
});

// ---------- Datos de un conjunto de niños (para ambos paneles) ----------

async function loadData(childIds: string[]) {
  const [attempts, sessions, reflections, checkIns, plays] = await Promise.all([
    prisma.attempt.findMany({
      where: { session: { childProfileId: { in: childIds } }, isSpotError: false },
      select: {
        isCorrect: true,
        createdAt: true,
        hintsUsed: true,
        responseTimeMs: true,
        errorType: { select: { code: true } },
        exercise: { select: { mathSkillId: true } },
        session: { select: { childProfileId: true } },
      },
    }),
    prisma.session.findMany({
      where: { childProfileId: { in: childIds } },
      select: { childProfileId: true, startedAt: true, endedAt: true, attempts: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.sessionReflection.findMany({ where: { childProfileId: { in: childIds } }, select: { childProfileId: true, mathSkillId: true, emotion: true, createdAt: true } }),
    prisma.wellbeingCheckIn.findMany({ where: { childProfileId: { in: childIds } }, select: { childProfileId: true, mood: true, createdAt: true } }),
    prisma.homeGamePlay.findMany({ where: { childProfileId: { in: childIds } }, select: { childProfileId: true, playedAt: true } }),
  ]);
  return {
    attempts: attempts.map<AttemptRow>((a) => ({
      childId: a.session.childProfileId,
      skillId: a.exercise.mathSkillId,
      isCorrect: a.isCorrect,
      createdAt: a.createdAt,
      errorCode: a.errorType?.code ?? null,
      hintsUsed: a.hintsUsed,
      responseTimeMs: a.responseTimeMs,
    })),
    sessions: sessions.map((s) => ({ childId: s.childProfileId, startedAt: s.startedAt, endedAt: s.endedAt, lastAttemptAt: s.attempts[0]?.createdAt ?? null })),
    reflections: reflections.map((r) => ({ childId: r.childProfileId, skillId: r.mathSkillId, emotion: r.emotion, createdAt: r.createdAt })),
    checkIns: checkIns.map((c) => ({ childId: c.childProfileId, mood: c.mood, createdAt: c.createdAt })),
    plays: plays.map((p) => ({ childId: p.childProfileId, playedAt: p.playedAt })),
  };
}

async function skillsOf(grades: number[]): Promise<Skill[]> {
  return prisma.mathSkill.findMany({
    where: { grade: { in: grades } },
    select: { id: true, name: true, nameEn: true, oaCode: true, axis: true, axisEn: true, order: true, grade: true },
  });
}

async function enrolled(classroomId: string) {
  return prisma.classEnrollment.findMany({
    where: { classroomId, leftAt: null },
    include: { childProfile: { select: { id: true, displayName: true } } },
    orderBy: { childProfile: { displayName: "asc" } },
  });
}

schoolRouter.get("/classrooms/:classroomId/dashboard", requireAuth, async (req, res) => {
  const access = await classroomAccess(String(req.params.classroomId), req.session.adultUserId!);
  if (!access) {
    res.status(404).json({ error: "classroom_not_found" });
    return;
  }
  await prisma.schoolStaff.update({ where: { id: access.staff.id }, data: { lastPanelAt: new Date() } });
  const list = await enrolled(access.classroom.id);
  const students = list.map((e) => ({ id: e.childProfile.id, name: e.childProfile.displayName, shareEmotions: e.shareEmotions }));
  const data = await loadData(students.map((s) => s.id));
  const dashboard = buildTeacherDashboard({ students, skills: await skillsOf([access.classroom.grade]), ...data, localDay: (d) => localDay(d) });
  res.json({ classroom: { id: access.classroom.id, name: access.classroom.name, grade: access.classroom.grade, joinCode: access.classroom.joinCode }, ...dashboard });
});

schoolRouter.get("/classrooms/:classroomId/students/:childId", requireAuth, async (req, res) => {
  const access = await classroomAccess(String(req.params.classroomId), req.session.adultUserId!);
  const enrollment = access
    ? await prisma.classEnrollment.findFirst({ where: { classroomId: access.classroom.id, childProfileId: String(req.params.childId), leftAt: null }, include: { childProfile: true } })
    : null;
  if (!access || !enrollment) {
    res.status(404).json({ error: "student_not_found" });
    return;
  }
  const childId = enrollment.childProfileId;
  const data = await loadData([childId]);
  const skills = await skillsOf([access.classroom.grade]);
  const byId = new Map(skills.map((s) => [s.id, s]));
  const dash = buildTeacherDashboard({
    students: [{ id: childId, name: enrollment.childProfile.displayName, shareEmotions: enrollment.shareEmotions }],
    skills,
    ...data,
    localDay: (d) => localDay(d),
  });
  const topics = topicProgress(
    data.attempts.flatMap((a) => {
      const s = byId.get(a.skillId);
      return s ? [{ createdAt: a.createdAt, isCorrect: a.isCorrect, skill: { id: s.id, grade: s.grade, name: s.name, nameEn: s.nameEn } }] : [];
    }),
    [],
    (d) => localDay(d),
  );
  const errorBreakdown: Record<string, number> = {};
  for (const a of data.attempts) if (!a.isCorrect && a.errorCode) errorBreakdown[a.errorCode] = (errorBreakdown[a.errorCode] ?? 0) + 1;
  const notes = await prisma.teacherNote.findMany({ where: { classroomId: access.classroom.id, childProfileId: childId }, orderBy: { createdAt: "desc" }, include: { author: { select: { email: true } } } });
  res.json({
    student: { id: childId, name: enrollment.childProfile.displayName, shareEmotions: enrollment.shareEmotions },
    skills: dash.skills,
    cells: dash.heatmap[childId],
    trends: Object.fromEntries(topics.map((t) => [t.skillId, t.trend])),
    errorBreakdown,
    participation: dash.participation[0],
    // Emociones individuales SOLO con el consentimiento aparte de la familia.
    emotions: enrollment.shareEmotions
      ? data.reflections
          .filter((r) => r.emotion)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10)
          .map((r) => ({ date: localDay(r.createdAt), emotion: r.emotion, skillId: r.skillId }))
      : null,
    notes: notes.map((n) => ({ id: n.id, text: n.text, createdAt: n.createdAt, author: n.author.email })),
  });
});

const noteSchema = z.object({ text: z.string().trim().min(1).max(2000) }).strict();
schoolRouter.post("/classrooms/:classroomId/students/:childId/notes", requireAuth, async (req, res) => {
  const access = await classroomAccess(String(req.params.classroomId), req.session.adultUserId!);
  const enrollment = access ? await prisma.classEnrollment.findFirst({ where: { classroomId: access.classroom.id, childProfileId: String(req.params.childId), leftAt: null } }) : null;
  if (!access || !enrollment) {
    res.status(404).json({ error: "student_not_found" });
    return;
  }
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }
  const n = await prisma.teacherNote.create({ data: { classroomId: access.classroom.id, childProfileId: enrollment.childProfileId, authorId: req.session.adultUserId!, text: parsed.data.text } });
  res.status(201).json({ id: n.id, text: n.text, createdAt: n.createdAt });
});

schoolRouter.get("/:schoolId/director", requireAuth, async (req, res) => {
  const staff = await prisma.schoolStaff.findUnique({ where: { schoolId_adultUserId: { schoolId: String(req.params.schoolId), adultUserId: req.session.adultUserId! } }, include: { school: true } });
  if (!staff || staff.role !== "director") {
    res.status(404).json({ error: "school_not_found" });
    return;
  }
  await prisma.schoolStaff.update({ where: { id: staff.id }, data: { lastPanelAt: new Date() } });
  const classrooms = await prisma.classroom.findMany({
    where: { schoolId: staff.schoolId },
    include: { teacher: { include: { adultUser: { select: { email: true } } } }, enrollments: { where: { leftAt: null }, select: { childProfileId: true } } },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });
  const classes = classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    teacherEmail: c.teacher.adultUser.email,
    teacherLastPanelAt: c.teacher.lastPanelAt,
    studentIds: c.enrollments.map((e) => e.childProfileId),
  }));
  const data = await loadData(classes.flatMap((c) => c.studentIds));
  const skills = await skillsOf([...new Set(classes.map((c) => c.grade))]);
  const dash = buildDirectorDashboard({ classes, skills, attempts: data.attempts, sessions: data.sessions, reflections: data.reflections, plays: data.plays });
  res.json({ school: { id: staff.schoolId, name: staff.school.name, staffCode: staff.school.staffCode }, skills, ...dash });
});

// ---------- Familia: vincular a su hijo/a con el código del curso ----------

const enrollSchema = z.object({ joinCode: z.string().trim().min(4).max(20), shareEmotions: z.boolean() }).strict();

childClassroomRouter.get("/", requireAuth, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  const e = await prisma.classEnrollment.findFirst({ where: { childProfileId: child.id, leftAt: null }, include: { classroom: { include: { school: true } } } });
  res.json({ enrollment: e ? { classroomName: e.classroom.name, schoolName: e.classroom.school.name, grade: e.classroom.grade, shareEmotions: e.shareEmotions } : null });
});

childClassroomRouter.post("/", requireAuth, requireFamilyUnlock, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  const parsed = enrollSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_payload" });
    return;
  }
  const classroom = await prisma.classroom.findUnique({ where: { joinCode: parsed.data.joinCode.toUpperCase() }, include: { school: true } });
  if (!classroom) {
    res.status(404).json({ error: "classroom_not_found" });
    return;
  }
  if (classroom.grade !== child.grade) {
    res.status(409).json({ error: "grade_mismatch", classroomGrade: classroom.grade });
    return;
  }
  // Un curso a la vez: unirse a otro deja el anterior.
  await prisma.classEnrollment.updateMany({ where: { childProfileId: child.id, leftAt: null, NOT: { classroomId: classroom.id } }, data: { leftAt: new Date() } });
  await prisma.classEnrollment.upsert({
    where: { classroomId_childProfileId: { classroomId: classroom.id, childProfileId: child.id } },
    create: { classroomId: classroom.id, childProfileId: child.id, shareEmotions: parsed.data.shareEmotions },
    update: { shareEmotions: parsed.data.shareEmotions, leftAt: null, consentedAt: new Date() },
  });
  res.status(201).json({ classroomName: classroom.name, schoolName: classroom.school.name, grade: classroom.grade, shareEmotions: parsed.data.shareEmotions });
});

childClassroomRouter.patch("/", requireAuth, requireFamilyUnlock, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  const parsed = z.object({ shareEmotions: z.boolean() }).strict().safeParse(req.body);
  if (!child || !parsed.success) {
    res.status(child ? 400 : 404).json({ error: child ? "invalid_payload" : "child_not_found" });
    return;
  }
  const r = await prisma.classEnrollment.updateMany({ where: { childProfileId: child.id, leftAt: null }, data: { shareEmotions: parsed.data.shareEmotions } });
  res.status(r.count ? 200 : 404).json({ shareEmotions: parsed.data.shareEmotions });
});

childClassroomRouter.delete("/", requireAuth, requireFamilyUnlock, async (req, res) => {
  const child = await getOwnedChild(String(req.params.childId), req.session.adultUserId!);
  if (!child) {
    res.status(404).json({ error: "child_not_found" });
    return;
  }
  await prisma.classEnrollment.updateMany({ where: { childProfileId: child.id, leftAt: null }, data: { leftAt: new Date() } });
  res.status(204).send();
});
