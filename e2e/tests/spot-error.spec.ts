import { test, expect, type Page } from "@playwright/test";

/**
 * Mecánica "detecta el error": cada 3 preguntas, si el banco tiene un
 * ejercicio con una alternativa ya clasificada, en vez de resolver desde
 * cero se le muestra al niño una respuesta ajena ya errada y elige qué le
 * pasó. 1° básico (Adición y sustracción dentro de 20, el primer nodo del
 * mapa) tiene la clasificación más completa del banco — se usa ese curso
 * para que la ronda aparezca de forma confiable dentro de una sesión.
 *
 * Localmente, si Chromium de Playwright no está disponible: PW_CHANNEL=chrome.
 */
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL });

function enabledOption(page: Page) {
  return page.locator(".option-btn:not([disabled])").first();
}

async function answerAssessmentUntil(page: Page, doneHeading: string, maxSteps: number) {
  const done = page.getByRole("heading", { name: doneHeading });
  for (let i = 0; i < maxSteps; i++) {
    if (await done.isVisible()) return;
    const option = enabledOption(page);
    await Promise.race([done.waitFor({ state: "visible" }), option.waitFor({ state: "visible" })]);
    if (await done.isVisible()) return;
    await option.click();
  }
  throw new Error(`No se llegó a "${doneHeading}" tras ${maxSteps} pasos.`);
}

test("detecta el error: aparece dentro de la sesión, muestra la respuesta ajena y diagnosticarla no rompe el flujo", async ({
  page,
}) => {
  const email = `e2e.spoterror.${Date.now()}@example.test`;
  const password = "clave-de-prueba-e2e-1234";

  await page.goto("/");
  await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await page.getByRole("checkbox", { name: /doy mi consentimiento/ }).check();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByLabel("Nombre").fill("Niño Detecta Error E2E");
  await page.getByRole("button", { name: "1° básico" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: /Zorro/ }).click();
  await page.getByRole("button", { name: "¡Listo, empezar!" }).click();
  await page.getByRole("button", { name: /Animales/ }).click();
  await page.getByRole("button", { name: "¡Listo!" }).click();

  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  await page.getByRole("heading", { name: "Vamos a conocernos" }).waitFor();
  await page.getByRole("button", { name: "Empezar" }).click();
  await answerAssessmentUntil(page, "¡Listo!", 20);
  await page.getByRole("button", { name: "Vamos a practicar" }).click();

  // Primer nodo del mapa: "Adición y sustracción dentro de 20", el que
  // concentra la mayor parte de las alternativas ya clasificadas.
  await page.getByRole("heading", { name: "Mapa de aprendizaje" }).waitFor();
  await page.locator(".skill-node:not([disabled])").first().click();

  // Check-in de caritas al empezar la práctica: opcional, se salta.
  await page.getByRole("heading", { name: "¡Hola! Antes de empezar…" }).waitFor();
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  const sessionDone = page.getByRole("heading", { name: "¡Práctica terminada!" });
  const pauseDecline = page.getByRole("button", { name: "Prefiero seguir" });
  const spotErrorLead = page.getByText("Tu amigo resolvió este problema:");
  let sawSpotError = false;

  // Importante: se actúa sobre el resultado YA RESUELTO de la carrera, nunca
  // con un `isVisible()` suelto después — volver a preguntar por separado
  // deja una ventana en la que la página ya pudo avanzar a la siguiente
  // pregunta (remount por `key={exercise.id}`), y ese reintento independiente
  // terminaría mirando un DOM distinto al que ganó la carrera.
  for (let i = 0; i < 20; i++) {
    if (await sessionDone.isVisible()) break;

    const option = enabledOption(page);
    const outcome = await Promise.race([
      sessionDone.waitFor({ state: "visible" }).then(() => "done" as const),
      pauseDecline.waitFor({ state: "visible" }).then(() => "pause" as const),
      spotErrorLead.waitFor({ state: "visible" }).then(() => "spot" as const),
      option.waitFor({ state: "visible" }).then(() => "option" as const),
    ]);

    if (outcome === "done") break;

    if (outcome === "pause") {
      await pauseDecline.click();
      await pauseDecline.waitFor({ state: "hidden" });
      continue;
    }

    if (outcome === "spot") {
      sawSpotError = true;
      // Respuesta del personaje visible, y las 3 alternativas de diagnóstico.
      await expect(page.locator(".spot-error-answer")).toBeVisible();
      await expect(page.getByText("¿Qué crees que le pasó?")).toBeVisible();
      const chips = page.locator(".form .option-btn");
      await expect(chips).toHaveCount(3);

      await chips.first().click();
      // Feedback: confirma o corrige, y de cualquier forma revela la
      // respuesta correcta — nunca dos veces la misma alternativa "ganadora".
      await expect(page.getByText(/¡Exacto!|Buen intento, pero fue otra cosa./)).toBeVisible();
      await expect(page.getByText("La respuesta correcta era:")).toBeVisible();

      const continueBtn = page.getByRole("button", { name: "Continuar" });
      await continueBtn.waitFor({ state: "visible" });
      await continueBtn.click();
      // "Tu amigo resolvió..." sigue en el DOM durante el feedback de ESTA
      // misma ronda (a propósito, para que el niño lo siga viendo) — sin
      // esperar a que desaparezca, la vuelta de arriba del loop la vuelve a
      // detectar como si fuera una ronda nueva, justo mientras la página ya
      // está cambiando a la siguiente pregunta (normal, nunca dos rondas de
      // esta mecánica seguidas). Mismo cuidado que ya se toma con la pausa.
      await spotErrorLead.waitFor({ state: "hidden" });
      continue;
    }

    await option.click();
    const continueBtn = page.getByRole("button", { name: "Continuar" });
    await continueBtn.waitFor({ state: "visible" });
    await continueBtn.click();
  }

  await sessionDone.waitFor();
  expect(sawSpotError).toBe(true);
  await expect(page.getByText(/\d\/6/)).toBeVisible();
});
