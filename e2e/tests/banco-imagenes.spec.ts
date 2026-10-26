import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Ilustraciones SVG del banco de imágenes por curso, en la interfaz real:
 * un ejercicio ilustrado por curso (1° a 6°) en la evaluación inicial y otro
 * en la práctica, en español y en inglés, más un caso con alternativas
 * textuales traducidas.
 *
 * El recorrido (registro, perfil, evaluación, mapa, práctica) es real; solo
 * se fija QUÉ ejercicio llega primero, interceptando una vez la respuesta de
 * la API con el registro real de la BD (fixtures/banco-imagenes.json, mismo
 * formato que envía el servidor) — el motor adaptativo elige al azar, y la
 * prueba necesita un ejercicio con imagen de cada curso. Que el servidor
 * envíe `image`/`labelEn` lo cubre next-exercise.integration.test.ts.
 *
 * Localmente, si Chromium de Playwright no está disponible: PW_CHANNEL=chrome.
 * Con SHOTS=1 guarda capturas en e2e/screenshots/.
 */
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL });

type Lang = "es" | "en";
interface Payload {
  id: string;
  prompt: string;
  promptEn: string | null;
  options: Array<{ id: string; label: string; labelEn: string | null }>;
  image: {
    src: Record<Lang, string>;
    alt: Record<Lang, string>;
    legend?:
      | { type: "none" }
      | { type: "generic"; text: Record<Lang, string> }
      | { type: "named"; items: Array<{ key: string; label: Record<Lang, string>; optionId?: string }> };
  };
}
const FIXTURES = JSON.parse(readFileSync(new URL("../fixtures/banco-imagenes.json", import.meta.url), "utf8")) as Record<
  string,
  { assessment: Payload; practice: Payload }
> & { textual: Payload; optionBindings: Payload; emojiPictograph: Payload & { image: { rows: Array<{ emoji: string; count: number; label: Record<Lang, string> | null }> } } };

async function serveOnce(page: Page, pattern: string, body: unknown) {
  let served = false;
  await page.route(pattern, async (route) => {
    if (served || route.request().method() !== "GET") return route.fallback();
    served = true;
    await route.fulfill({ json: body });
  });
}

/** La evaluación inicial real (3 preguntas del curso), con la primera reemplazada por `first`. */
async function serveAssessmentWithFirst(page: Page, first: Payload) {
  await page.route("**/api/children/*/initial-assessment", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const response = await route.fetch();
    const body = (await response.json()) as { exercises: Payload[] };
    body.exercises[0] = first;
    await route.fulfill({ response, json: body });
  });
}

async function finishAssessment(page: Page) {
  const done = page.getByRole("heading", { name: "¡Listo!" });
  for (let i = 0; i < 10; i++) {
    const option = page.locator(".option-btn:not([disabled])").first();
    const outcome = await Promise.race([
      done.waitFor({ state: "visible" }).then(() => "done" as const),
      option.waitFor({ state: "visible" }).then(() => "option" as const),
    ]);
    if (outcome === "done") return;
    await option.click({ timeout: 3000 }).catch(() => {});
  }
}

/** Imagen, enunciado y alternativas en `lang`, y la imagen se puede ampliar. */
async function checkExercise(page: Page, ex: Payload, lang: Lang, shot: string) {
  const img = page.locator(".exercise-image-open img");
  await expect(img).toHaveAttribute("src", ex.image.src[lang]);
  await expect(img).toHaveAttribute("alt", ex.image.alt[lang]);
  // El SVG se sirvió de verdad (no un 404 con ícono roto) y conserva su proporción.
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  // Proporción del área de la imagen (sin el margen blanco del marco):
  // completa y sin deformar (object-fit: contain).
  const ratio = await img.evaluate((el: HTMLImageElement) => {
    const cs = getComputedStyle(el);
    const px = (v: string) => parseFloat(v) || 0;
    const w = el.clientWidth - px(cs.paddingLeft) - px(cs.paddingRight);
    const h = el.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom);
    return [w / h, el.naturalWidth / el.naturalHeight, cs.objectFit === "contain" ? 1 : 0];
  });
  expect(Math.abs(ratio[0]! - ratio[1]!)).toBeLessThan(0.02);
  expect(ratio[2]).toBe(1);

  // Leyenda de las letras: texto de interfaz en el idioma activo, fuera de la imagen.
  const legend = ex.image.legend;
  if (legend?.type === "named") {
    const rows = page.locator(".exercise-image-legend li");
    await expect(rows).toHaveCount(legend.items.length);
    for (const [i, item] of legend.items.entries()) {
      const option = item.optionId ? ex.options.find((o) => o.id === item.optionId) : undefined;
      const label = option ? (lang === "en" && option.labelEn ? option.labelEn : option.label) : item.label[lang];
      await expect(rows.nth(i)).toHaveText(`${item.key} ${label}`);
    }
    await expect(page.locator(".exercise-image-open .exercise-image-legend")).toHaveCount(0);
  } else if (legend?.type === "generic") {
    await expect(page.locator(".exercise-image-legend-note")).toHaveText(legend.text[lang]);
  } else {
    await expect(page.locator(".exercise-image-legend, .exercise-image-legend-note")).toHaveCount(0);
  }

  // El enunciado sigue como texto junto a la imagen.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(lang === "en" && ex.promptEn ? ex.promptEn : ex.prompt);
  for (const o of ex.options) {
    const label = lang === "en" && o.labelEn ? o.labelEn : o.label;
    await expect(page.locator(".option-btn", { hasText: label }).first()).toBeVisible();
  }
  if (process.env.SHOTS) {
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/banco-imagenes-${shot}-${lang}.png` });
  }

  await page.locator(".exercise-image-open").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img")).toHaveAttribute("src", ex.image.src[lang]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

async function checkBothLanguages(page: Page, ex: Payload, shot: string) {
  await checkExercise(page, ex, "es", shot);
  await page.locator(".lang-toggle").click();
  await checkExercise(page, ex, "en", shot);
  await page.locator(".lang-toggle").click();
  await expect(page.locator(".exercise-image-open img")).toHaveAttribute("src", ex.image.src.es);
}

async function reachAssessment(page: Page, grade: number) {
  await page.goto("/");
  await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
  await page.getByLabel("Correo electrónico").fill(`e2e.imagenes.g${grade}.${Date.now()}@example.test`);
  await page.getByLabel("Contraseña").fill("clave-de-prueba-e2e-1234");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.getByRole("checkbox", { name: /doy mi consentimiento/ }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Nombre").fill(`Niño ${grade}° imágenes`);
  await page.getByRole("button", { name: `${grade}° básico` }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: /Zorro/ }).click();
  await page.getByRole("button", { name: "¡Listo, empezar!" }).click();
  await page.getByRole("button", { name: /Animales/ }).click();
  await page.getByRole("button", { name: "¡Listo!" }).click();
  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();
  await page.getByRole("heading", { name: "Vamos a conocernos" }).waitFor();
  await page.getByRole("button", { name: "Empezar" }).click();
}

async function reachPractice(page: Page) {
  await page.getByRole("heading", { name: "¡Listo!" }).waitFor();
  await page.getByRole("button", { name: "Vamos a practicar" }).click();
  await page.getByRole("heading", { name: "Mapa de aprendizaje" }).waitFor();
  await page.locator(".skill-node:not([disabled])").first().click();
  // Check-in de caritas al empezar la práctica: opcional, se salta.
  await page.getByRole("heading", { name: "¡Hola! Antes de empezar…" }).waitFor();
  await page.getByRole("button", { name: "Saltar" }).click();
  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();
}

for (const grade of [1, 2, 3, 4, 5, 6]) {
  test(`${grade}° básico: imagen por idioma en evaluación inicial y práctica`, async ({ page }) => {
    const { assessment, practice } = FIXTURES[grade]!;
    await serveAssessmentWithFirst(page, assessment);
    await serveOnce(page, "**/api/children/*/next-exercise*", { ...practice, mode: "solve" });

    await reachAssessment(page, grade);
    await checkBothLanguages(page, assessment, `g${grade}-evaluacion`);
    await finishAssessment(page);

    await reachPractice(page);
    await checkBothLanguages(page, practice, `g${grade}-practica`);
  });
}

test("alternativas textuales: se traducen al cambiar de idioma, sin cambiar orden ni cantidad", async ({ page }) => {
  const ex = FIXTURES.textual;
  await serveOnce(page, "**/api/children/*/next-exercise*", { ...ex, mode: "solve" });

  await reachAssessment(page, 1);
  await finishAssessment(page);
  await reachPractice(page);

  const buttons = page.locator(".option-btn");
  await expect(buttons).toHaveCount(ex.options.length);
  const orderEs = await buttons.allTextContents();
  await page.locator(".lang-toggle").click();
  const orderEn = await buttons.allTextContents();

  const byEs = new Map(ex.options.map((o) => [o.label, o.labelEn ?? o.label]));
  expect(orderEn).toEqual(orderEs.map((l) => byEs.get(l)));
  expect(orderEn.some((l, i) => l !== orderEs[i])).toBe(true);
  if (process.env.SHOTS) await page.screenshot({ path: "screenshots/banco-imagenes-alternativas-en.png" });
});

test("en un teléfono la imagen cabe en pantalla y al ampliarla se ve más grande", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  const ex = FIXTURES[1]!.assessment;
  await serveAssessmentWithFirst(page, ex);
  await reachAssessment(page, 1);

  const img = page.locator(".exercise-image-open img");
  await expect(img).toHaveAttribute("src", ex.image.src.es);
  const inline = await img.boundingBox();
  expect(inline!.width).toBeLessThanOrEqual(375);
  expect(inline!.height).toBeLessThanOrEqual(740 / 2 + 1);
  // Sin scroll horizontal de la página.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  if (process.env.SHOTS) await page.screenshot({ path: "screenshots/banco-imagenes-movil.png" });

  await page.locator(".exercise-image-open").click();
  const big = await page.getByRole("dialog").locator("img").boundingBox();
  expect(big!.width).toBeGreaterThan(inline!.width * 1.5);
  await expect(page.getByRole("button", { name: /Cerrar imagen/ })).toBeInViewport();
  if (process.env.SHOTS) await page.screenshot({ path: "screenshots/banco-imagenes-movil-ampliada.png" });
});

test("optionBindings: cada letra sigue ligada a su alternativa por ID aunque las opciones lleguen mezcladas", async ({ page }) => {
  const ex = FIXTURES.optionBindings;
  // Se sirven las alternativas en orden inverso: la leyenda NO debe reasignarse por posición.
  await serveOnce(page, "**/api/children/*/next-exercise*", { ...ex, options: [...ex.options].reverse(), mode: "solve" });
  await reachAssessment(page, 1);
  await finishAssessment(page);
  await reachPractice(page);
  await checkBothLanguages(page, { ...ex, options: [...ex.options].reverse() }, "option-bindings");
  const legend = ex.image.legend as { type: "named"; items: Array<{ key: string; optionId?: string }> };
  const firstKey = legend.items[0]!;
  const expected = ex.options.find((o) => o.id === firstKey.optionId)!.label;
  await expect(page.locator(".exercise-image-legend li").first()).toHaveText(`${firstKey.key} ${expected}`);
});

test("1.° básico: pictograma con emojis — filas con su nombre, sin letras y sin la palabra «pictograma»", async ({ page }) => {
  const ex = FIXTURES.emojiPictograph;
  await serveOnce(page, "**/api/children/*/next-exercise*", { ...ex, mode: "solve" });
  await reachAssessment(page, 1);
  await finishAssessment(page);
  await reachPractice(page);

  for (const lang of ["es", "en"] as const) {
    if (lang === "en") await page.locator(".lang-toggle").click();
    const prompt = page.getByRole("heading", { level: 1 });
    await expect(prompt).toHaveText(lang === "en" && ex.promptEn ? ex.promptEn : ex.prompt);
    await expect(prompt).not.toContainText(/pictogra/i);
    const fig = page.locator("figure.emoji-pictograph");
    await expect(fig).toBeVisible();
    const rows = fig.locator(".emoji-pictograph-row");
    await expect(rows).toHaveCount(ex.image.rows.length);
    for (const [i, row] of ex.image.rows.entries()) {
      if (row.label) await expect(rows.nth(i).locator(".emoji-pictograph-label")).toHaveText(row.label[lang]);
      await expect(rows.nth(i).locator(".pictorial-icon")).toHaveCount(row.count);
    }
    await expect(fig).toContainText(lang === "es" ? "Cada dibujo vale 1" : "Each picture stands for 1");
    await expect(page.locator("figure.exercise-image, .exercise-image-legend")).toHaveCount(0);
    if (process.env.SHOTS) await page.screenshot({ path: `screenshots/banco-imagenes-pictograma-emojis-${lang}.png` });
  }
});
