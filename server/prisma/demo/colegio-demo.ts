/**
 * Datos de DEMOSTRACIÓN para los paneles escolares (specs/014). Solo para
 * desarrollo local: crea un colegio ficticio con 3 cursos, estudiantes
 * ficticios y 8 semanas de práctica simulada (aciertos, errores, emociones,
 * ánimo, juegos en casa). Nunca corre en el seed ni en producción.
 *
 *   npm run demo:colegio                      (desde server/)
 *   npm run demo:colegio -- tu@correo.cl      (además te deja como directiva del colegio demo)
 *
 * Cuentas ficticias (clave: demo-colegio-1234):
 *   demo.directora@example.test · demo.profe3a@example.test · demo.profe3b@example.test · demo.profe4a@example.test
 * Es idempotente: si el colegio demo ya existe, lo borra y lo vuelve a crear.
 */
import "dotenv/config";
import { prisma } from "../../src/db/prisma.js";
import { hashPassword } from "../../src/auth/password.js";

if (process.env.NODE_ENV === "production") throw new Error("demo:colegio es solo para desarrollo.");

const SCHOOL_NAME = "Colegio Demo Los Aromos (ficticio)";
const PASSWORD = "demo-colegio-1234";
const DAY = 86400000;
const NOW = Date.now();

// Generador determinista: los mismos datos en cada corrida.
let seed = 20261023;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]!;

const NAMES = ["Agustina", "Benjamín", "Catalina", "Diego", "Emilia", "Felipe", "Florencia", "Gaspar", "Isidora", "Joaquín", "Josefa", "León", "Martina", "Matías", "Antonia", "Tomás", "Sofía", "Vicente", "Amanda", "Lucas", "Julieta", "Maximiliano", "Renata", "Bastián", "Trinidad", "Cristóbal", "Valentina", "Alonso"];
const INITIALS = "ABCDEFGHIJKLMNOPRSTUV";

async function adult(email: string) {
  return prisma.adultUser.upsert({ where: { email }, create: { email, passwordHash: hashPassword(PASSWORD) }, update: {} });
}

async function wipe() {
  const school = await prisma.school.findFirst({ where: { name: SCHOOL_NAME } });
  const family = await prisma.adultUser.findUnique({ where: { email: "demo.familias@example.test" } });
  if (family) {
    const kids = (await prisma.childProfile.findMany({ where: { adultUserId: family.id }, select: { id: true, consentId: true } }));
    const ids = kids.map((k) => k.id);
    await prisma.teacherNote.deleteMany({ where: { childProfileId: { in: ids } } });
    await prisma.classEnrollment.deleteMany({ where: { childProfileId: { in: ids } } });
    await prisma.homeGamePlay.deleteMany({ where: { childProfileId: { in: ids } } });
    await prisma.sessionReflection.deleteMany({ where: { childProfileId: { in: ids } } });
    await prisma.wellbeingCheckIn.deleteMany({ where: { childProfileId: { in: ids } } });
    await prisma.attempt.deleteMany({ where: { session: { childProfileId: { in: ids } } } });
    await prisma.starEvent.deleteMany({ where: { childProfileId: { in: ids } } });
    await prisma.adaptiveDecision.deleteMany({ where: { session: { childProfileId: { in: ids } } } });
    await prisma.pauseEvent.deleteMany({ where: { session: { childProfileId: { in: ids } } } });
    await prisma.session.deleteMany({ where: { childProfileId: { in: ids } } });
    await prisma.childProfile.deleteMany({ where: { id: { in: ids } } });
    await prisma.consent.deleteMany({ where: { id: { in: kids.map((k) => k.consentId) } } });
  }
  if (school) {
    await prisma.teacherNote.deleteMany({ where: { classroom: { schoolId: school.id } } });
    await prisma.classEnrollment.deleteMany({ where: { classroom: { schoolId: school.id } } });
    await prisma.classroom.deleteMany({ where: { schoolId: school.id } });
    await prisma.schoolStaff.deleteMany({ where: { schoolId: school.id } });
    await prisma.school.delete({ where: { id: school.id } });
  }
}

async function main() {
  await wipe();
  const director = await adult("demo.directora@example.test");
  const school = await prisma.school.create({ data: { name: SCHOOL_NAME, staffCode: "COL-DEMO1", staff: { create: { adultUserId: director.id, role: "director", lastPanelAt: new Date(NOW - 2 * DAY) } } } });
  const extraDirector = process.argv[2];
  if (extraDirector) {
    const me = await prisma.adultUser.findUnique({ where: { email: extraDirector } });
    if (me) await prisma.schoolStaff.create({ data: { schoolId: school.id, adultUserId: me.id, role: "director" } });
    else console.warn(`No existe una cuenta con ${extraDirector}: créala en la app y vuelve a correr el script.`);
  }
  const family = await adult("demo.familias@example.test");

  const plan = [
    { name: "3° A", grade: 3, teacher: "demo.profe3a@example.test", size: 28, code: "3B-DEMOA", panelDaysAgo: 1 },
    { name: "3° B", grade: 3, teacher: "demo.profe3b@example.test", size: 26, code: "3B-DEMOB", panelDaysAgo: 12 },
    { name: "4° A", grade: 4, teacher: "demo.profe4a@example.test", size: 20, code: "4B-DEMOA", panelDaysAgo: 3 },
  ];
  let kidsCreated = 0;
  let attemptsCreated = 0;
  for (const [ci, p] of plan.entries()) {
    const t = await adult(p.teacher);
    const staff = await prisma.schoolStaff.create({ data: { schoolId: school.id, adultUserId: t.id, role: "teacher", lastPanelAt: new Date(NOW - p.panelDaysAgo * DAY) } });
    const classroom = await prisma.classroom.create({ data: { schoolId: school.id, teacherId: staff.id, name: p.name, grade: p.grade, joinCode: p.code } });
    const skills = await prisma.mathSkill.findMany({ where: { grade: p.grade }, orderBy: { order: "asc" }, include: { exercises: { where: { theme: null }, include: { options: true } } } });
    // El curso avanza por el mapa: las primeras habilidades se practicaron más.
    const taught = skills.slice(0, Math.min(skills.length, 6));
    // Dificultad del curso por habilidad (3° B tiene más problemas con fracciones, a propósito).
    const hardness = taught.map((s, i) => 0.02 + 0.03 * i + (ci === 1 && s.name.startsWith("Fracciones") ? 0.2 : 0));

    for (let k = 0; k < p.size; k++) {
      const consent = await prisma.consent.create({ data: { adultUserId: family.id, scope: "Datos ficticios de demostración" } });
      const child = await prisma.childProfile.create({
        data: { adultUserId: family.id, consentId: consent.id, displayName: `${NAMES[(k + ci * 7) % NAMES.length]} ${INITIALS[(k * 3 + ci) % INITIALS.length]}.`, grade: p.grade, companion: "zorro", interests: ["animales"] },
      });
      kidsCreated++;
      await prisma.classEnrollment.create({ data: { classroomId: classroom.id, childProfileId: child.id, shareEmotions: rnd() < 0.7, consentedAt: new Date(NOW - 60 * DAY) } });
      const ability = 0.5 + rnd() * 0.45; // 0.5 a 0.95
      const growth = 0.05 + rnd() * 0.2;
      const inactive = k % 9 === 4; // ~3 por curso dejaron de practicar
      const anxious = rnd() < 0.18;
      const weeks = 8;
      for (let w = weeks; w >= 1; w--) {
        if (inactive && w <= 2) continue;
        const sessionsThisWeek = 1 + Math.floor(rnd() * 3);
        for (let sIdx = 0; sIdx < sessionsThisWeek; sIdx++) {
          const start = new Date(NOW - (w * 7 - sIdx * 2) * DAY + Math.floor(rnd() * 8) * 3600000);
          const skillIdx = Math.min(taught.length - 1, Math.floor(((weeks - w) / weeks) * taught.length + rnd() * 2));
          const skill = taught[skillIdx]!;
          if (skill.exercises.length === 0) continue;
          const session = await prisma.session.create({ data: { childProfileId: child.id, mathSkillId: skill.id, startedAt: start, endedAt: new Date(start.getTime() + (6 + rnd() * 10) * 60000) } });
          const pCorrect = Math.max(0.1, Math.min(0.97, ability - hardness[skillIdx]! + growth * ((weeks - w) / weeks)));
          const rows = [];
          let correct = 0;
          for (let q = 0; q < 6; q++) {
            const ex = pick(skill.exercises);
            const ok = rnd() < pCorrect;
            const opt = ok ? ex.options.find((o) => o.isCorrect)! : pick(ex.options.filter((o) => !o.isCorrect));
            if (ok) correct++;
            rows.push({
              sessionId: session.id,
              exerciseId: ex.id,
              selectedOptionId: opt.id,
              isCorrect: ok,
              errorTypeId: ok ? null : (opt.errorTypeId ?? null),
              responseTimeMs: Math.floor(rnd() < 0.08 ? 1500 + rnd() * 1000 : 6000 + rnd() * 30000),
              hintsUsed: rnd() < (1 - pCorrect) * 0.6 ? 1 : 0,
              createdAt: new Date(start.getTime() + q * 70000),
            });
          }
          await prisma.attempt.createMany({ data: rows });
          attemptsCreated += rows.length;
          // Reflexión al cerrar (85 % responde): la emoción acompaña al rendimiento y al perfil.
          if (rnd() < 0.85) {
            const acc = correct / 6;
            const emotion = anxious && acc < 0.7 ? pick(["nervios", "nervios", "rabia", "calma"]) : acc >= 0.83 ? pick(["orgullo", "alegria", "alegria", "calma"]) : acc >= 0.5 ? pick(["calma", "alegria", "aburrimiento"]) : pick(["rabia", "nervios", "aburrimiento", "calma"]);
            await prisma.sessionReflection.create({ data: { childProfileId: child.id, sessionId: session.id, mathSkillId: skill.id, emotion, weather: 1 + Math.min(3, Math.floor(acc * 4)), createdAt: new Date(start.getTime() + 8 * 60000) } });
          }
          if (sIdx === 0) await prisma.wellbeingCheckIn.create({ data: { childProfileId: child.id, sessionId: session.id, mood: anxious ? pick([2, 3, 3]) : pick([3, 4, 4, 5]), mathFeeling: anxious ? pick([1, 2, 3]) : pick([3, 4, 5]), createdAt: start } });
        }
        if (rnd() < 0.15) await prisma.homeGamePlay.create({ data: { childProfileId: child.id, mathSkillId: pick(taught).id, playedAt: new Date(NOW - w * 7 * DAY) } });
      }
    }
  }
  console.log(`Colegio demo listo: ${kidsCreated} estudiantes ficticios, ${attemptsCreated} respuestas simuladas.`);
  console.log(`Directiva: demo.directora@example.test · Docentes: ${plan.map((p) => p.teacher).join(", ")} · Clave: ${PASSWORD}`);
  console.log(`Códigos de curso: ${plan.map((p) => `${p.name} ${p.code}`).join(" · ")} · Código del colegio: COL-DEMO1`);
  await prisma.$disconnect();
}

await main();
