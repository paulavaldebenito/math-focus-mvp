import { test, expect, type Page } from "@playwright/test";

/**
 * Recorrido real de un niño de 3°, 4°, 5° y 6° básico: el adulto elige el curso,
 * la evaluación inicial y la práctica entregan ejercicios de ese curso (4
 * alternativas) y el flujo llega a la primera pregunta de práctica.
 *
 * Localmente, si Chromium de Playwright no está disponible: PW_CHANNEL=chrome.
 * Con SHOTS=1 guarda capturas en e2e/screenshots/.
 */
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL });

function enabledOption(page: Page) {
  return page.locator(".option-btn:not([disabled])").first();
}

for (const grade of [3, 4, 5, 6]) {
  test(`${grade}° básico: elegir curso, evaluación inicial y primera pregunta de práctica`, async ({ page }) => {
    const email = `e2e.grade${grade}.${Date.now()}@example.test`;
    const password = "clave-de-prueba-e2e-1234";

    await page.goto("/");
    await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    // Los seis cursos están disponibles.
    for (let g = 1; g <= 6; g++) {
      await expect(page.getByRole("button", { name: `${g}° básico` })).toBeVisible();
    }
    await page.getByLabel("Nombre").fill(`Niño ${grade}° E2E`);
    await page.getByRole("button", { name: `${grade}° básico` }).click();
    if (process.env.SHOTS) await page.screenshot({ path: `screenshots/grade-${grade}-1-curso.png` });
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("button", { name: /Zorro/ }).click();
    await page.getByRole("button", { name: "¡Listo, empezar!" }).click();
    await page.getByRole("button", { name: /Animales/ }).click();
    await page.getByRole("button", { name: "¡Listo!" }).click();

    // Evaluación inicial: cada pregunta trae 4 alternativas del curso.
    // Antes de la evaluación: ofrece un momento de respiración (siempre se puede saltar).
  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  await page.getByRole("heading", { name: "Vamos a conocernos" }).waitFor();
    await page.getByRole("button", { name: "Empezar" }).click();
    const doneAssessment = page.getByRole("heading", { name: "¡Listo!" });
    let firstShot = true;
    for (let i = 0; i < 10; i++) {
      if (await doneAssessment.isVisible()) break;
      const option = enabledOption(page);
      await Promise.race([doneAssessment.waitFor({ state: "visible" }), option.waitFor({ state: "visible" })]);
      if (await doneAssessment.isVisible()) break;
      await expect(page.locator(".option-btn")).toHaveCount(4);
      if (firstShot && process.env.SHOTS) {
        await page.screenshot({ path: `screenshots/grade-${grade}-2-evaluacion.png` });
        firstShot = false;
      }
      await option.click({ timeout: 3000 }).catch(() => {});
    }
    await page.getByRole("button", { name: "Vamos a practicar" }).click();

  // El mapa de habilidades reemplazó al botón directo de practicar: se elige
  // el primer nodo disponible (los demás arrancan bloqueados).
  await page.getByRole("heading", { name: "Mapa de aprendizaje" }).waitFor();
  await page.locator(".skill-node:not([disabled])").first().click();


    // Check-in de caritas al empezar la práctica: opcional, se salta.
    await page.getByRole("heading", { name: "¡Hola! Antes de empezar…" }).waitFor();
    await page.getByRole("button", { name: "Saltar" }).click();
    await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
    await page.getByRole("button", { name: "Empezar ahora" }).click();
    await expect(page.locator(".option-btn")).toHaveCount(4);
    if (process.env.SHOTS) {
      await page.waitForTimeout(600); // deja terminar la animación de entrada
      await page.screenshot({ path: `screenshots/grade-${grade}-3-practica.png` });
    }
  });
}
