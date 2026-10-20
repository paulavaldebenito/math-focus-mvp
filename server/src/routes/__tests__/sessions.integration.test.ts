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

describe("Sesión de práctica + motor adaptativo (T4.2)", () => {
  let server: Server;
  let baseUrl: string;
  let cookie: string;
  let childId: string;
  let otherCookie: string;
  const email = `ficticio.practice.${Date.now()}@example.test`;
  const otherEmail = `ficticio.practice.other.${Date.now()}@example.test`;
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

  it("una sesión nueva sin historial previo arranca en el nivel neutro (2)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { currentLevel: number };
    expect(body.currentLevel).toBe(2);
  });

  it("un adulto no puede crear una sesión para un niño que no es suyo (404)", async () => {
    const res = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: otherCookie },
    });
    expect(res.status).toBe(404);
  });

  it("3 aciertos consecutivos sin pistas suben el nivel y quedan registrados como AdaptiveDecision", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercises = await prisma.exercise.findMany({ include: { options: true }, take: 3 });
    expect(exercises.length).toBe(3);

    let lastBody: { level: number; action: { ruleCode: string } } | null = null;
    for (const ex of exercises) {
      const correctOption = ex.options.find((o) => o.isCorrect)!;
      const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          exerciseId: ex.id,
          selectedOptionId: correctOption.id,
          hintsUsed: 0,
          responseTimeMs: 6000,
        }),
      });
      expect(res.status).toBe(201);
      lastBody = (await res.json()) as { level: number; action: { ruleCode: string } };
    }

    expect(lastBody?.action.ruleCode).toBe("THREE_CORRECT_NO_HELP");
    expect(lastBody?.level).toBe(3);

    const decision = await prisma.adaptiveDecision.findFirst({
      where: { sessionId, ruleCode: "THREE_CORRECT_NO_HELP" },
    });
    expect(decision).not.toBeNull();
    expect(decision?.previousLevel).toBe(2);
    expect(decision?.newLevel).toBe(3);
  });

  it("no se puede falsear la corrección: enviar un selectedOptionId incorrecto se registra como incorrecto igual", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercise = await prisma.exercise.findFirst({ include: { options: true } });
    const wrongOption = exercise!.options.find((o) => !o.isCorrect)!;

    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: exercise!.id, selectedOptionId: wrongOption.id }),
    });
    const body = (await res.json()) as { isCorrect: boolean };
    expect(body.isCorrect).toBe(false);
  });

  it("si la alternativa elegida tiene un tipo de error clasificado, la respuesta incluye su código (errorCode)", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const option = await prisma.exerciseOption.findFirst({
      where: { isCorrect: false, errorTypeId: { not: null } },
      include: { errorType: true },
    });
    expect(option).not.toBeNull();

    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: option!.exerciseId, selectedOptionId: option!.id }),
    });
    const body = (await res.json()) as { errorCode: string | null };
    expect(body.errorCode).toBe(option!.errorType!.code);
  });

  it("si la alternativa elegida tiene feedback propio, la respuesta lo incluye en ambos idiomas", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const option = await prisma.exerciseOption.findFirst({ where: { isCorrect: false, feedback: { not: null } } });
    expect(option).not.toBeNull();

    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: option!.exerciseId, selectedOptionId: option!.id }),
    });
    const body = (await res.json()) as { feedback: string | null; feedbackEn: string | null };
    expect(body.feedback).toBe(option!.feedback);
    expect(body.feedbackEn).toBe(option!.feedbackEn);
  });

  it("un acierto sin clasificación de error, o correcto, no trae errorCode", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercise = await prisma.exercise.findFirst({ include: { options: true } });
    const correctOption = exercise!.options.find((o) => o.isCorrect)!;

    const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: exercise!.id, selectedOptionId: correctOption.id }),
    });
    const body = (await res.json()) as { errorCode: string | null };
    expect(body.errorCode).toBeNull();
  });

  it("3 aciertos seguidos en una sesión otorgan además una estrella bonus, trazable y aditiva", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    const exercises = await prisma.exercise.findMany({ include: { options: true }, take: 3 });

    let lastBody: { bonusStarAwarded: boolean } | null = null;
    for (const [i, ex] of exercises.entries()) {
      const correctOption = ex.options.find((o) => o.isCorrect)!;
      const res = await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ exerciseId: ex.id, selectedOptionId: correctOption.id }),
      });
      const body = (await res.json()) as { bonusStarAwarded: boolean };
      // Solo el 3er acierto seguido activa el bono — nunca antes.
      expect(body.bonusStarAwarded).toBe(i === 2);
      lastBody = body;
    }

    expect(lastBody?.bonusStarAwarded).toBe(true);
    const bonusEvents = await prisma.starEvent.count({ where: { sessionId, reason: "streak_bonus" } });
    expect(bonusEvents).toBe(1);
    // Nunca reemplaza la estrella normal del acierto — son 3 correct_answer + 1 streak_bonus.
    const correctEvents = await prisma.starEvent.count({ where: { sessionId, reason: "correct_answer" } });
    expect(correctEvents).toBe(3);
  });

  it("cada 3 preguntas ofrece una ronda de 'detecta el error', y diagnosticarla no ajusta el nivel de dificultad", async () => {
    const sessionRes = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const { sessionId } = (await sessionRes.json()) as { sessionId: string };

    // 3 preguntas normales, respondidas bien, para llegar al turno de la 4ª.
    for (let i = 0; i < 3; i++) {
      const exRes = await fetch(`${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`, {
        headers: { Cookie: cookie },
      });
      const ex = (await exRes.json()) as { id: string };
      // /next-exercise ya mezcla las alternativas — se busca la correcta
      // directo en la base en vez de confiar en una posición del array.
      const fullExercise = await prisma.exercise.findUnique({ where: { id: ex.id }, include: { options: true } });
      const correctOption = fullExercise!.options.find((o) => o.isCorrect)!;
      await fetch(`${baseUrl}/api/sessions/${sessionId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ exerciseId: ex.id, selectedOptionId: correctOption.id }),
      });
    }

    const levelBefore = await fetch(`${baseUrl}/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { Cookie: cookie },
    }).then((r) => r.json() as Promise<{ currentLevel: number }>);
    // Las 3 respuestas correctas de arriba ya pueden haber disparado
    // THREE_CORRECT_NO_HELP — lo que importa es que la ronda de detectar el
    // error, que viene después, no agregue una AdaptiveDecision más.
    const decisionsBeforeSpotError = await prisma.adaptiveDecision.count({ where: { sessionId } });

    const spotRes = await fetch(`${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`, {
      headers: { Cookie: cookie },
    });
    const spot = (await spotRes.json()) as {
      mode: string;
      id: string;
      characterAnswerLabel: string;
      correctAnswerLabel: string;
      wrongOptionId: string;
      explanationOptions: string[];
    };
    expect(spot.mode).toBe("spot_error");
    expect(spot.wrongOptionId).toBeTruthy();
    expect(spot.characterAnswerLabel).toBeTruthy();
    expect(spot.correctAnswerLabel).toBeTruthy();
    expect(spot.explanationOptions).toHaveLength(3);
    expect(new Set(spot.explanationOptions).size).toBe(3);

    // Un diagnóstico deliberadamente equivocado — el código real nunca es
    // este string, así que siempre da isCorrect:false.
    const wrongGuessRes = await fetch(`${baseUrl}/api/sessions/${sessionId}/spot-error-attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: spot.id, wrongOptionId: spot.wrongOptionId, chosenCode: "NO_ES_UN_CODIGO_REAL" }),
    });
    const wrongGuess = (await wrongGuessRes.json()) as {
      isCorrect: boolean;
      correctCode: string;
      level: number;
      action: { type: string };
    };
    expect(wrongGuess.isCorrect).toBe(false);
    expect(wrongGuess.action.type).toBe("NO_CHANGE");
    expect(wrongGuess.level).toBe(levelBefore.currentLevel);

    const starsAfterWrongGuess = await prisma.starEvent.count({ where: { sessionId, reason: "spot_error_correct" } });
    expect(starsAfterWrongGuess).toBe(0);

    // Ahora con el código correcto (recién revelado en la respuesta anterior).
    const rightGuessRes = await fetch(`${baseUrl}/api/sessions/${sessionId}/spot-error-attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ exerciseId: spot.id, wrongOptionId: spot.wrongOptionId, chosenCode: wrongGuess.correctCode }),
    });
    const rightGuess = (await rightGuessRes.json()) as { isCorrect: boolean; level: number };
    expect(rightGuess.isCorrect).toBe(true);
    expect(rightGuess.level).toBe(levelBefore.currentLevel);

    const starsAfterRightGuess = await prisma.starEvent.count({ where: { sessionId, reason: "spot_error_correct" } });
    expect(starsAfterRightGuess).toBe(1);

    // No agrega una AdaptiveDecision nueva (nunca ajusta el nivel de dificultad).
    const decisionsAfterSpotError = await prisma.adaptiveDecision.count({ where: { sessionId } });
    expect(decisionsAfterSpotError).toBe(decisionsBeforeSpotError);

    // La siguiente pregunta (la 5ª) ya no es otra ronda de detectar el error
    // — la ronda ya cuenta como "respondida" (dedup) y el turno no vuelve a
    // calzar con el múltiplo de 3 hasta la 6ª.
    const nextRes = await fetch(`${baseUrl}/api/children/${childId}/next-exercise?sessionId=${sessionId}`, {
      headers: { Cookie: cookie },
    });
    const next = (await nextRes.json()) as { mode: string };
    expect(next.mode).toBe("solve");
  });
});
