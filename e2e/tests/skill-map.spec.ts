import { test, expect } from "@playwright/test";

/**
 * Recorrido real del mapa de habilidades (estilo Duolingo, specs pendiente):
 * tras la evaluación inicial se llega al mapa en vez de directo a
 * practicar; solo el primer nodo está disponible (el resto, bloqueado);
 * elegir un nodo muestra su nombre en la práctica; al volver a Inicio se ve
 * el rango con estrellas.
 *
 * Localmente, si Chromium de Playwright no está disponible: PW_CHANNEL=chrome.
 */
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL });

test("mapa de habilidades: solo el primer nodo está disponible, elegirlo muestra su nombre en la práctica, y el rango se ve en Inicio", async ({
  page,
}) => {
  const email = `e2e.map.${Date.now()}@example.test`;
  const password = "clave-de-prueba-e2e-1234";

  await page.goto("/");
  await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByLabel("Nombre").fill("Niño Mapa E2E");
  await page.getByRole("button", { name: "4° básico" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: /Zorro/ }).click();
  await page.getByRole("button", { name: "¡Listo, empezar!" }).click();
  await page.getByRole("button", { name: /Espacio/ }).click();
  await page.getByRole("button", { name: "¡Listo!" }).click();

  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  await page.getByRole("heading", { name: "Vamos a conocernos" }).waitFor();
  await page.getByRole("button", { name: "Empezar" }).click();
  const doneAssessment = page.getByRole("heading", { name: "¡Listo!" });
  for (let i = 0; i < 10; i++) {
    if (await doneAssessment.isVisible()) break;
    const option = page.locator(".option-btn:not([disabled])").first();
    await Promise.race([doneAssessment.waitFor({ state: "visible" }), option.waitFor({ state: "visible" })]);
    if (await doneAssessment.isVisible()) break;
    await option.click({ timeout: 3000 }).catch(() => {});
  }
  await page.getByRole("button", { name: "Vamos a practicar" }).click();

  // El mapa reemplaza al botón directo de practicar.
  await page.getByRole("heading", { name: "Mapa de aprendizaje" }).waitFor();
  const nodes = page.locator(".skill-node");
  await expect(nodes.first()).toBeEnabled();
  const nodeCount = await nodes.count();
  expect(nodeCount).toBeGreaterThan(1);
  // Todos los demás (perfil recién creado, sin aciertos previos) están bloqueados.
  for (let i = 1; i < nodeCount; i++) {
    await expect(nodes.nth(i)).toBeDisabled();
  }

  const firstSkillName = await page.locator(".skill-node-label p").first().innerText();
  await nodes.first().click();

  // Check-in de caritas al empezar la práctica: opcional, se salta.
  await page.getByRole("heading", { name: "¡Hola! Antes de empezar…" }).waitFor();
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  // La práctica muestra el nombre de la habilidad elegida.
  await expect(page.getByText(firstSkillName)).toBeVisible();

  // Termina la sesión (6 preguntas) sin asumir cuáles son correctas.
  const sessionDone = page.getByRole("heading", { name: "¡Sesión terminada!" });
  const pauseDecline = page.getByRole("button", { name: "Prefiero seguir" });
  for (let i = 0; i < 20; i++) {
    if (await sessionDone.isVisible()) break;
    const option = page.locator(".option-btn:not([disabled])").first();
    await Promise.race([
      sessionDone.waitFor({ state: "visible" }),
      pauseDecline.waitFor({ state: "visible" }),
      option.waitFor({ state: "visible" }),
    ]);
    if (await sessionDone.isVisible()) break;
    if (await pauseDecline.isVisible()) {
      await pauseDecline.click();
      await pauseDecline.waitFor({ state: "hidden" });
      continue;
    }
    await option.click();
    const continueBtn = page.getByRole("button", { name: "Continuar" });
    await continueBtn.waitFor({ state: "visible" });
    await continueBtn.click();
  }
  await sessionDone.waitFor();
  // Reporte de fin de sesión: cuenta de correctas sobre el total.
  await expect(page.getByText(/\d\/6/)).toBeVisible();

  await page.getByRole("button", { name: "Volver al inicio" }).click();
  await expect(page.getByText(/Rango \d/)).toBeVisible();
});
