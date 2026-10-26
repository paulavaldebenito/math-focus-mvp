import { test, type Page } from "@playwright/test";

// Script de una sola vez — crea una cuenta por mascota y captura Home real.

test.use({ channel: "chrome" });

function enabledOption(page: Page) {
  return page.locator(".option-btn:not([disabled])").first();
}

const COMPANIONS = ["Capi", "Búho", "Zorro", "Conejo"];

for (const companion of COMPANIONS) {
  test(`home real con ${companion}`, async ({ page }) => {
    // Sin tildes en el correo ni en el nombre de archivo ("Búho" → "buho").
    const slug = companion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const email = `mascota.${slug}.${Date.now()}@example.test`;
    const password = "clave-de-prueba-e2e-1234";

    await page.goto("/");
    await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("Nombre").fill("Niño Demo");
    await page.getByRole("button", { name: "1° básico" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("button", { name: new RegExp(companion) }).click();
    await page.getByRole("button", { name: "¡Listo, empezar!" }).click();

    await page.getByRole("button", { name: /Animales/ }).click();
    await page.getByRole("button", { name: "¡Listo!" }).click();

    // Antes de la evaluación: ofrece un momento de respiración (siempre se puede saltar).
  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  await page.getByRole("heading", { name: "Vamos a conocernos" }).waitFor();
    await page.getByRole("button", { name: "Empezar" }).click();

    const doneAssessment = page.getByRole("heading", { name: "¡Listo!" });
    for (let i = 0; i < 10; i++) {
      if (await doneAssessment.isVisible()) break;
      const option = enabledOption(page);
      await Promise.race([doneAssessment.waitFor({ state: "visible" }), option.waitFor({ state: "visible" })]);
      if (await doneAssessment.isVisible()) break;
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

    const doneSession = page.getByRole("heading", { name: "¡Práctica terminada!" });
    const pauseDecline = page.getByRole("button", { name: "Prefiero seguir" });
    for (let i = 0; i < 20; i++) {
      if (await doneSession.isVisible()) break;
      const option = enabledOption(page);
      await Promise.race([
        doneSession.waitFor({ state: "visible" }),
        pauseDecline.waitFor({ state: "visible" }),
        option.waitFor({ state: "visible" }),
      ]);
      if (await doneSession.isVisible()) break;
      if (await pauseDecline.isVisible().catch(() => false)) {
        await pauseDecline.click({ timeout: 3000 }).catch(() => {});
        continue;
      }
      await option.click({ timeout: 3000 }).catch(() => {});
      const continueBtn = page.getByRole("button", { name: "Continuar" });
      await continueBtn.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
      if (!(await continueBtn.isVisible())) continue;
      await continueBtn.click();
    }
    await page.getByRole("button", { name: "Volver al inicio" }).click();

    await page.getByRole("heading").first().waitFor();
    await page.locator(".brick-companion-img").first().evaluate((img: HTMLImageElement) =>
      img.complete ? Promise.resolve() : new Promise((resolve) => img.addEventListener("load", resolve)),
    );
    await page.waitForTimeout(600); // deja terminar la animación de entrada del regalo (0.4s)
    await page.screenshot({ path: `screenshots/home-${slug}.png` });
  });
}
