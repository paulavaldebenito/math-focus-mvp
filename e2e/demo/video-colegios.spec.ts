import { test, type Page } from "@playwright/test";

/**
 * Escenas del video para colegios (specs/019-video-colegios/guion.md). Cada test es una escena y
 * produce su propio video. Ritmo pausado a propósito: la voz se graba encima.
 */
const PASSWORD = "demo-colegio-1234";
// Tamaños de pantalla y video: proyectos «celular» y «computador» en playwright.video.config.ts.

const pause = (page: Page, ms = 1200) => page.waitForTimeout(ms);

async function login(page: Page, email: string) {
  await page.goto("/");
  await pause(page, 1500);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await pause(page, 500);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

/// La cuenta de Sofía puede abrir en el mapa (retoma donde quedó): vuelve al inicio.
async function toHome(page: Page) {
  const home = page.getByRole("button", { name: "¡A practicar!" });
  const back = page.getByRole("button", { name: "← Inicio" });
  await Promise.race([home.waitFor(), back.waitFor()]);
  if (await back.isVisible().catch(() => false)) {
    await pause(page, 1500);
    await back.click();
  }
  await home.waitFor();
}

async function slowScroll(page: Page, steps = 8, dy = 260, wait = 900) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(wait);
  }
}

test.describe("Video para colegios", () => {

  test.describe("celular", () => {

    test("escena 2 · el niño practica", async ({ page }) => {
      await login(page, "demo.sofia@example.test");
      await toHome(page);
      await pause(page, 2500);
      await page.getByRole("button", { name: "¡A practicar!" }).click();
      await page.getByRole("heading", { name: "Mapa de aprendizaje" }).waitFor();
      await pause(page, 2000);
      // El nodo se nombra por su aria-label («Fracciones — …»); el texto visible está al lado.
      const fractions = page.getByRole("button", { name: /^Fracciones —/ });
      await fractions.scrollIntoViewIfNeeded();
      await pause(page, 1500);
      await fractions.click();
      const checkIn = page.getByRole("heading", { name: "¡Hola! Antes de empezar…" });
      if (await checkIn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pause(page, 1500);
        await page.getByRole("button", { name: "Saltar" }).click();
      }
      await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
      await pause(page, 1500);
      await page.getByRole("button", { name: "Empezar ahora" }).click();
      // Responde con calma; algunas alternativas no son la correcta, para mostrar el mensaje y el
      // desarrollo paso a paso. Misma lógica que answerPracticeUntil (tests/full-journey.spec.ts).
      const done = page.getByRole("heading", { name: "¡Práctica terminada!" });
      const pauseDecline = page.getByRole("button", { name: "Prefiero seguir" });
      for (let i = 0; i < 24; i++) {
        if (await done.isVisible()) break;
        const option = page.locator(".option-btn:not([disabled])");
        await Promise.race([done.waitFor({ state: "visible" }), pauseDecline.waitFor({ state: "visible" }), option.first().waitFor({ state: "visible" })]);
        if (await done.isVisible()) break;
        if (await pauseDecline.isVisible()) {
          await pause(page, 1500);
          await pauseDecline.click();
          await pauseDecline.waitFor({ state: "hidden" });
          continue;
        }
        // Ritmo de un niño que lee: así la app no muestra «respondiste muy rápido».
        await pause(page, 6500);
        await option.nth(i % 3 === 1 ? 1 : 0).click();
        const continueBtn = page.getByRole("button", { name: "Continuar" });
        await continueBtn.waitFor({ state: "visible" });
        await pause(page, 2500);
        await slowScroll(page, 3, 220, 1100);
        await pause(page, 1500);
        await continueBtn.click();
      }
      await done.waitFor();
      await pause(page, 2500);
      await slowScroll(page, 3, 260, 1000);
      const happy = page.getByRole("radio", { name: /Alegría/ });
      if (await happy.isVisible().catch(() => false)) {
        await happy.click();
        await pause(page, 1500);
      }
      await pause(page, 2500);
    });

    test("escena 4 · el espacio familia", async ({ page }) => {
      await login(page, "demo.sofia@example.test");
      await toHome(page);
      await pause(page, 2000);
      await page.getByRole("button", { name: /Para la familia/ }).click();
      await page.getByLabel("PIN (4 dígitos)").waitFor();
      await pause(page, 1200);
      await page.getByLabel("PIN (4 dígitos)").pressSequentially("2468", { delay: 250 });
      await page.getByRole("button", { name: "Entrar" }).click();
      await page.getByRole("heading", { name: /La semana de/ }).waitFor();
      await pause(page, 3500);
      await slowScroll(page, 14, 260, 1300);
      await pause(page, 2000);
    });
  });

  test.describe("computador", () => {

    test("escena 3 · el panel docente", async ({ page }) => {
      await login(page, "demo.profe3a@example.test");
      await page.getByRole("button", { name: "🏫 Colegio" }).click();
      await pause(page, 2000);
      await page.getByRole("button", { name: /3° A/ }).first().click();
      await page.getByRole("heading", { name: "3° A" }).waitFor();
      await pause(page, 3500);
      await slowScroll(page, 10, 300, 1400);
      const student = page.locator(".heatmap-name, .student-link, button", { hasText: "Sofía" }).first();
      if (await student.isVisible().catch(() => false)) {
        await student.click();
        await pause(page, 3000);
        await slowScroll(page, 6, 300, 1300);
      }
      await pause(page, 2000);
    });

    test("escena 5 · el panel directivo", async ({ page }) => {
      await login(page, "demo.directora@example.test");
      await page.getByRole("button", { name: "🏫 Colegio" }).click();
      await pause(page, 2000);
      await page.getByRole("button", { name: "📊 Panel directivo" }).click();
      await page.getByRole("heading", { name: /Colegio Demo/ }).waitFor();
      await pause(page, 3500);
      await slowScroll(page, 10, 300, 1400);
      await pause(page, 2000);
    });
  });
});
