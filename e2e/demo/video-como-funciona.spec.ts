import { test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";

/**
 * Tomas del video «Cómo funciona Eureka» (~1:30, specs/019-video-colegios/como-funciona.md). Cada
 * toma anota en marcas.json el segundo en que empieza cada momento; montar.sh usa esas marcas para
 * cortar y armar un solo video.
 *
 *   PW_CHANNEL=chrome npx playwright test -c playwright.video.config.ts demo/video-como-funciona.spec.ts
 */
const PASSWORD = "demo-colegio-1234";
const pause = (page: Page, ms = 1200) => page.waitForTimeout(ms);

function marker() {
  const t0 = Date.now();
  const marks: Record<string, number> = {};
  return {
    mark: (name: string) => {
      marks[name] = Math.round((Date.now() - t0) / 100) / 10;
    },
    save: () => writeFileSync(test.info().outputPath("marcas.json"), JSON.stringify(marks, null, 2)),
  };
}

async function login(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

async function toHome(page: Page) {
  const home = page.getByRole("button", { name: "¡A practicar!" });
  const back = page.getByRole("button", { name: "← Inicio" });
  await Promise.race([home.waitFor(), back.waitFor()]);
  if (await back.isVisible().catch(() => false)) await back.click();
  await home.waitFor();
}

async function slowScroll(page: Page, steps: number, dy: number, wait: number) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(wait);
  }
}

test.describe("Cómo funciona Eureka", () => {
  test.describe("celular", () => {
    // Celular de 390 px dibujado al doble (proyecto celular-hd): mismo diseño, video nítido.
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        document.addEventListener("DOMContentLoaded", () => {
          const style = document.createElement("style");
          style.textContent = "html { zoom: 2; }";
          document.head.appendChild(style);
        });
      });
    });

    test("toma 1 · el niño", async ({ page }) => {
      const m = marker();
      await login(page, "demo.sofia@example.test");
      await toHome(page);
      m.mark("inicio");
      await pause(page, 2000);

      // Intereses: Sofía suma «Espacio y planetas» a animales y música.
      await page.getByRole("button", { name: "Cambiar mis intereses" }).click();
      await page.getByRole("heading", { name: "¿Qué te gusta más?" }).waitFor();
      m.mark("intereses");
      await pause(page, 1800);
      await page.getByRole("button", { name: /Espacio y planetas/ }).click();
      await pause(page, 1800);
      await page.getByRole("button", { name: "¡Listo!" }).click();
      await toHome(page);
      await pause(page, 1000);

      await page.getByRole("button", { name: "¡A practicar!" }).click();
      await page.getByRole("heading", { name: "Mapa de aprendizaje" }).waitFor();
      m.mark("mapa");
      await pause(page, 1500);
      const fractions = page.getByRole("button", { name: /^Fracciones —/ });
      await fractions.scrollIntoViewIfNeeded();
      await pause(page, 1200);
      await fractions.click();

      // ¿Cómo te sientes? (si toca hoy)
      const checkIn = page.getByRole("heading", { name: "¡Hola! Antes de empezar…" });
      if (await checkIn.isVisible({ timeout: 3000 }).catch(() => false)) {
        m.mark("animo");
        await pause(page, 2000);
        await page.getByRole("radio", { name: "¡Muy bien!" }).click();
        await pause(page, 1200);
        await page.getByRole("radio", { name: "Con calma", exact: true }).click();
        await pause(page, 1500);
        await page.getByRole("button", { name: "Listo" }).click();
      }

      // Pausa de respiración antes de empezar (termina sola).
      await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
      m.mark("oferta_pausa");
      await pause(page, 1800);
      await page.getByRole("button", { name: "Respiración" }).click();
      m.mark("respiracion");

      const done = page.getByRole("heading", { name: "¡Práctica terminada!" });
      const movement = page.getByRole("button", { name: "Movimiento" });
      let q = 0;
      for (let i = 0; i < 14; i++) {
        const option = page.locator(".option-btn:not([disabled])");
        await Promise.race([done.waitFor(), movement.waitFor(), option.first().waitFor({ timeout: 60_000 })]);
        if (await done.isVisible()) break;
        if (await movement.isVisible()) {
          // Recreo a mitad de sesión: pausa de movimiento.
          m.mark("oferta_movimiento");
          await pause(page, 1800);
          await movement.click();
          m.mark("movimiento");
          await pause(page, 7000);
          await page.getByRole("button", { name: "Listo" }).click();
          continue;
        }
        q++;
        m.mark(`p${q}`);
        await pause(page, 2500);
        // Que se vea la pregunta completa con todas sus alternativas antes de responder.
        await page.evaluate(() => {
          const opts = document.querySelectorAll(".option-btn");
          const last = opts[opts.length - 1];
          if (!last) return;
          last.scrollIntoView({ block: "end", behavior: "smooth" });
        });
        m.mark(`p${q}_completa`);
        await pause(page, 4000);
        // Segunda pregunta: alternativa distinta de la primera, para mostrar el error y el paso a paso.
        await option.nth(q % 2 === 0 ? 1 : 0).click();
        m.mark(`p${q}_respuesta`);
        const continueBtn = page.getByRole("button", { name: "Continuar" });
        await continueBtn.waitFor();
        const wrong = await page.locator(".worked-yours").first().isVisible().catch(() => false);
        m.mark(`p${q}_${wrong ? "error" : "bien"}`);
        await pause(page, 2500);
        await slowScroll(page, 3, 220, 1000);
        await pause(page, 1200);
        m.mark(`p${q}_fin`);
        await continueBtn.click();
      }
      await done.waitFor();
      m.mark("terminada");
      await pause(page, 2500);
      await slowScroll(page, 3, 260, 900);
      await pause(page, 2000);
      m.mark("fin");
      m.save();
    });

    test("toma 2 · la familia", async ({ page }) => {
      const m = marker();
      await login(page, "demo.sofia@example.test");
      await toHome(page);
      await pause(page, 1500);
      m.mark("inicio");
      await page.getByRole("button", { name: /Para la familia/ }).click();
      await page.getByLabel("PIN (4 dígitos)").waitFor();
      m.mark("pin");
      await pause(page, 800);
      await page.getByLabel("PIN (4 dígitos)").pressSequentially("2468", { delay: 200 });
      await page.getByRole("button", { name: "Entrar" }).click();
      await page.getByRole("heading", { name: /La semana de/ }).waitFor();
      m.mark("semana");
      await pause(page, 3000);
      await slowScroll(page, 14, 240, 1100);
      await pause(page, 1500);
      m.mark("fin");
      m.save();
    });
  });

  test.describe("computador", () => {
    test("toma 3 · la profesora", async ({ page }) => {
      const m = marker();
      await login(page, "demo.profe3a@example.test");
      await page.getByRole("button", { name: "🏫 Colegio" }).click();
      await pause(page, 1200);
      await page.getByRole("button", { name: /3° A/ }).first().click();
      await page.getByRole("heading", { name: "3° A" }).waitFor();
      m.mark("curso");
      await pause(page, 3000);
      await slowScroll(page, 8, 300, 1100);
      const student = page.locator(".heatmap-name, .student-link, button", { hasText: "Sofía" }).first();
      if (await student.isVisible().catch(() => false)) {
        await student.click();
        m.mark("ficha");
        await pause(page, 2500);
        await slowScroll(page, 5, 300, 1100);
      }
      await pause(page, 1500);
      m.mark("fin");
      m.save();
    });

    test("toma 4 · el equipo directivo", async ({ page }) => {
      const m = marker();
      await login(page, "demo.directora@example.test");
      await page.getByRole("button", { name: "🏫 Colegio" }).click();
      await pause(page, 1200);
      await page.getByRole("button", { name: "📊 Panel directivo" }).click();
      await page.getByRole("heading", { name: /Colegio Demo/ }).waitFor();
      m.mark("panel");
      await pause(page, 3000);
      await slowScroll(page, 9, 300, 1100);
      await pause(page, 1500);
      m.mark("fin");
      m.save();
    });
  });
});
