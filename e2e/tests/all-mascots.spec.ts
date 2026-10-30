import { test } from "@playwright/test";
import { finishPlacementAssessment, finishPracticeSession } from "./helpers/practice.js";

// Script de una sola vez — crea una cuenta por mascota y captura Home real.

test.use({ channel: "chrome" });

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

    await page.getByRole("checkbox", { name: /doy mi consentimiento/ }).check();
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

    await finishPlacementAssessment(page);
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

    await finishPracticeSession(page);
    await page.getByRole("button", { name: "Volver al inicio" }).click();

    await page.getByRole("heading").first().waitFor();
    await page.locator(".brick-companion-img").first().evaluate((img: HTMLImageElement) =>
      img.complete ? Promise.resolve() : new Promise((resolve) => img.addEventListener("load", resolve)),
    );
    await page.waitForTimeout(600); // deja terminar la animación de entrada del regalo (0.4s)
    await page.screenshot({ path: `screenshots/home-${slug}.png` });
  });
}
