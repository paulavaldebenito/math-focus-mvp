import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { app } from "../../index.js";
import { prisma } from "../../db/prisma.js";

describe("GET /api/children/:childId/next-exercise (T4.3)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  const email = `ficticio.nextex.${Date.now()}@example.test`;
  const password = "clave-de-prueba-segura";

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;

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
    cookie = loginRes.headers.get("set-cookie")!.split(";")[0]!;

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
    await prisma.adultUser.deleteMany({ where: { email } });
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("devuelve un ejercicio del nivel neutro (2) sin filtrar la respuesta correcta", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/next-exercise`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { difficultyLevel: number; options: Array<Record<string, unknown>> };
    expect(body.difficultyLevel).toBe(2);
    for (const opt of body.options) {
      expect(opt).not.toHaveProperty("isCorrect");
    }
  });

  it("envía la ilustración SVG por idioma (image) y labelEn de cada alternativa, nunca isCorrect", async () => {
    // El motor elige al azar; en 1° básico cerca de la mitad del banco tiene
    // imagen, así que en pocas vueltas llega uno ilustrado.
    let withImage: { id: string; image: unknown; options: Array<Record<string, unknown>> } | null = null;
    for (let i = 0; i < 40 && !withImage; i++) {
      const res = await fetch(`${baseUrl}/api/children/${childId}/next-exercise`, { headers: { Cookie: cookie } });
      const body = (await res.json()) as { id: string; mode: string; image?: unknown; options: Array<Record<string, unknown>> };
      if (body.mode !== "solve") continue;
      for (const opt of body.options) {
        expect(opt).toHaveProperty("labelEn");
        expect(opt).not.toHaveProperty("isCorrect");
        // El feedback por alternativa delataría cuáles son incorrectas: solo
        // llega en la respuesta al intento.
        expect(opt).not.toHaveProperty("feedback");
      }
      if (body.image) withImage = { id: body.id, image: body.image, options: body.options };
    }
    expect(withImage).not.toBeNull();
    const stored = await prisma.exercise.findUnique({ where: { id: withImage!.id }, select: { image: true } });
    expect(withImage!.image).toEqual(stored!.image);
    // Los pictogramas de 1.° (1 dibujo = 1) no traen archivo: se dibujan con
    // filas de emojis (specs/010). El motor elige al azar, así que puede
    // tocar uno de esos.
    if ((withImage!.image as { source?: string }).source === "emoji_pictograph") {
      expect(withImage!.image).toMatchObject({
        kind: "pictograph",
        rows: expect.arrayContaining([expect.objectContaining({ emoji: expect.any(String), count: expect.any(Number) })]),
        alt: { es: expect.any(String), en: expect.any(String) },
      });
      return;
    }
    expect(withImage!.image).toMatchObject({
      // Banco visual completo (misma imagen sin palabras para ambos idiomas)
      // o, si un ejercicio no está en él, la ilustración anterior por idioma.
      src: {
        es: expect.stringMatching(/^\/(exercise-images\/1b__|banco-imagenes\/1_basico\/es\/)/),
        en: expect.stringMatching(/^\/(exercise-images\/1b__|banco-imagenes\/1_basico\/en\/)/),
      },
      alt: { es: expect.any(String), en: expect.any(String) },
    });
  });

  it("no repite un ejercicio ya usado en la misma sesión mientras haya otros disponibles", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const seen = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const res = await fetch(
        `${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`,
        { headers: { Cookie: cookie } },
      );
      const body = (await res.json()) as { id: string; options: Array<{ id: string }> };
      expect(seen.has(body.id)).toBe(false);
      seen.add(body.id);

      // Simula que el niño responde (para que el próximo GET lo excluya).
      await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ exerciseId: body.id, selectedOptionId: body.options[0]!.id }),
      });
    }
  });

  it("un niño de 2° básico recibe ejercicios de 2° básico, no del banco de 1°", async () => {
    const consentRes = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba (2° básico)" }),
    });
    const { id: consentId2 } = (await consentRes.json()) as { id: string };

    const childRes = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ consentId: consentId2, displayName: "Niño ficticio 2° básico", grade: 2 }),
    });
    const { id: childId2 } = (await childRes.json()) as { id: string };

    const res = await fetch(`${baseUrl}/api/children/${childId2}/next-exercise`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };

    const exercise = await prisma.exercise.findUnique({
      where: { id: body.id },
      include: { mathSkill: true },
    });
    expect(exercise?.mathSkill.grade).toBe(2);

    await prisma.childProfile.delete({ where: { id: childId2 } });
    await prisma.consent.delete({ where: { id: consentId2 } });
  });

  it("un niño de 3° a 6° básico recibe ejercicios de su propio curso", async () => {
    for (const grade of [3, 4, 5, 6]) {
      const consentRes = await fetch(`${baseUrl}/api/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ scope: `MVP v1 — datos mínimos, ficticio de prueba (${grade}° básico)` }),
      });
      const { id: consentIdG } = (await consentRes.json()) as { id: string };

      const childRes = await fetch(`${baseUrl}/api/children`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ consentId: consentIdG, displayName: `Niño ficticio ${grade}° básico`, grade }),
      });
      expect(childRes.status, `crear niño de ${grade}°`).toBe(201);
      const { id: childIdG } = (await childRes.json()) as { id: string };

      const res = await fetch(`${baseUrl}/api/children/${childIdG}/next-exercise`, {
        headers: { Cookie: cookie },
      });
      expect(res.status, `${grade}° next-exercise`).toBe(200);
      const body = (await res.json()) as { id: string; options: unknown[] };
      expect(body.options).toHaveLength(4);

      const exercise = await prisma.exercise.findUnique({
        where: { id: body.id },
        include: { mathSkill: true },
      });
      expect(exercise?.mathSkill.grade).toBe(grade);

      await prisma.childProfile.delete({ where: { id: childIdG } });
      await prisma.consent.delete({ where: { id: consentIdG } });
    }
  });

  it("con intereses futbol y animales recibe temáticos de esos temas, nunca de uno ajeno", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/interests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ interests: ["futbol", "animales"] }),
    });
    expect(res.status).toBe(200);

    const themes: Array<string | null> = [];
    for (let i = 0; i < 25; i++) {
      const exRes = await fetch(`${baseUrl}/api/children/${childId}/next-exercise`, {
        headers: { Cookie: cookie },
      });
      expect(exRes.status).toBe(200);
      const { id } = (await exRes.json()) as { id: string };
      const exercise = await prisma.exercise.findUnique({ where: { id } });
      themes.push(exercise?.theme ?? null);
    }

    // Solo neutro o de SUS intereses (musica u otros existen en el banco).
    for (const theme of themes) expect([null, "futbol", "animales"]).toContain(theme);
    // Con ~70% de temáticos, 25 pedidos sin ninguno tendrían probabilidad ~1e-13.
    expect(themes.some((t) => t !== null)).toBe(true);

    await prisma.childProfile.update({ where: { id: childId }, data: { interests: [] } });
  });

  it("sin intereses solo recibe contenido neutro", async () => {
    await prisma.childProfile.update({ where: { id: childId }, data: { interests: [] } });
    for (let i = 0; i < 15; i++) {
      const exRes = await fetch(`${baseUrl}/api/children/${childId}/next-exercise`, {
        headers: { Cookie: cookie },
      });
      const { id } = (await exRes.json()) as { id: string };
      const exercise = await prisma.exercise.findUnique({ where: { id } });
      expect(exercise?.theme).toBeNull();
    }
  });

  it("en una sesión no se sirve el problema base y su variante temática (mismo baseKey)", async () => {
    const skill = await prisma.mathSkill.findFirstOrThrow({ where: { grade: 1 } });
    const baseKey = `test-basekey-${Date.now()}`;
    const mk = (prompt: string, theme: string | null) =>
      prisma.exercise.create({
        data: {
          mathSkillId: skill.id,
          prompt,
          promptEn: prompt,
          difficultyLevel: 2,
          theme,
          baseKey,
          procedureNote: "n",
          procedureNoteEn: "n",
          options: { create: [{ label: "1", isCorrect: true }, { label: "2", isCorrect: false }] },
        },
      });
    const base = await mk(`Base ${baseKey}`, null);
    const variant = await mk(`Variante ${baseKey}`, "cocina");

    try {
      await prisma.childProfile.update({ where: { id: childId }, data: { interests: ["cocina"] } });
      const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
        method: "POST",
        headers: { Cookie: cookie },
      });
      const { sessionId } = (await sessionRes.json()) as { sessionId: string };

      // Simula que el niño ya respondió una de las dos versiones.
      const first = await prisma.exerciseOption.findFirstOrThrow({ where: { exerciseId: variant.id } });
      await prisma.attempt.create({
        data: { sessionId, exerciseId: variant.id, selectedOptionId: first.id, isCorrect: true },
      });

      for (let i = 0; i < 30; i++) {
        const exRes = await fetch(
          `${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`,
          { headers: { Cookie: cookie } },
        );
        const { id } = (await exRes.json()) as { id: string };
        expect(id).not.toBe(base.id);
        expect(id).not.toBe(variant.id);
      }
    } finally {
      await prisma.attempt.deleteMany({ where: { exerciseId: { in: [base.id, variant.id] } } });
      await prisma.exerciseOption.deleteMany({ where: { exerciseId: { in: [base.id, variant.id] } } });
      await prisma.exercise.deleteMany({ where: { baseKey } });
      await prisma.childProfile.update({ where: { id: childId }, data: { interests: [] } });
    }
  });

  it("un interés sin contenido temático en ese grado/nivel igual responde 200 (nunca bloquea la sesión)", async () => {
    const consentRes = await fetch(`${baseUrl}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ scope: "MVP v1 — datos mínimos, ficticio de prueba (fallback tema)" }),
    });
    const { id: consentId3 } = (await consentRes.json()) as { id: string };

    const childRes = await fetch(`${baseUrl}/api/children`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ consentId: consentId3, displayName: "Niño ficticio fallback", grade: 2 }),
    });
    const { id: childId3 } = (await childRes.json()) as { id: string };

    await fetch(`${baseUrl}/api/children/${childId3}/interests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ interests: ["musica"] }),
    });

    const res = await fetch(`${baseUrl}/api/children/${childId3}/next-exercise`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; options: unknown[] };
    expect(Array.isArray(body.options)).toBe(true);
    expect(body.options.length).toBeGreaterThan(0);

    await prisma.childProfile.delete({ where: { id: childId3 } });
    await prisma.consent.delete({ where: { id: consentId3 } });
  });
});
