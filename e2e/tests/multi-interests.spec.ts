import { test, expect } from "@playwright/test";

/**
 * Recorrido real de la elección múltiple de intereses (specs/007): un niño
 * puede elegir hasta 3 intereses, la 4ª tarjeta queda deshabilitada, puede
 * cambiarlos después desde Inicio, y en la práctica llegan preguntas
 * temáticas de su interés.
 *
 * Localmente, si Chromium de Playwright no está disponible: PW_CHANNEL=chrome.
 */
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL });

// Vocabulario propio de las variantes de fútbol, cocina y espacio (ver
// server/prisma/seed/themes/{futbol,cocina,espacio}.ts) — los 3 intereses
// que elige el niño en este test. Si aparece alguna palabra, la pregunta es
// temática y no del banco neutro. Ampliada (specs/014): con la lista
// original, 1 de cada 3 preguntas temáticas de 4° no se reconocía y el test
// fallaba al azar aunque sí llegaran preguntas temáticas.
const THEMED_WORDS =
  /cancha|\bgol(es)?\b|\barco\b|equipo|partido|jugador|penal|campeonato|balón|camiseta|receta|cupcake|torta|hornear|horno|pastelería|panadería|alfajor|queque|harina|glaseado|bandeja|molde|galleta|repostería|marraqueta|empanada|tartaleta|dona|nave|cohete|astronauta|planeta|estación espacial|cápsula|misión espacial|galaxia|cuenta regresiva|fútbol|\bclub\b|socios|banderín|pelota|deportiv|entrenamiento|torneo|\bmasa\b|cocin|ingrediente|pastel|observatorio|misi[oó]n|espacial|telescopio|robot explorador|estrella|órbita|satélite/i;

test("elegir hasta 3 intereses, la 4ª tarjeta se deshabilita, y llegan preguntas temáticas en la práctica", async ({
  page,
}) => {
  const email = `e2e.interests.${Date.now()}@example.test`;
  const password = "clave-de-prueba-e2e-1234";

  await page.goto("/");
  await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await page.getByRole("checkbox", { name: /doy mi consentimiento/ }).check();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByLabel("Nombre").fill("Niño Intereses E2E");
  await page.getByRole("button", { name: "4° básico" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: /Zorro/ }).click();
  await page.getByRole("button", { name: "¡Listo, empezar!" }).click();

  // Elección de intereses: parte sin nada elegido.
  await page.getByRole("heading", { name: "¿Qué te gusta más?" }).waitFor();
  const continueBtn = page.getByRole("button", { name: "¡Listo!" });
  await expect(continueBtn).toBeDisabled();

  await page.getByRole("button", { name: /Fútbol/ }).click();
  await page.getByRole("button", { name: /Cocina/ }).click();
  await page.getByRole("button", { name: /Espacio/ }).click();
  await expect(continueBtn).toBeEnabled();

  // Con 3 elegidos, una tarjeta no elegida queda deshabilitada.
  const vehiculos = page.getByRole("button", { name: /Vehículos/ });
  await expect(vehiculos).toBeDisabled();
  // Una ya elegida sigue habilitada (se puede desmarcar).
  await expect(page.getByRole("button", { name: /Cocina/ })).toBeEnabled();

  await continueBtn.click();

  // Evaluación inicial y práctica.
  // Antes de la evaluación: ofrece un momento de respiración (siempre se puede saltar).
  await page.getByRole("heading", { name: "Antes de empezar" }).waitFor();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  await page.getByRole("heading", { name: "Vamos a conocernos" }).waitFor();
  await page.getByRole("button", { name: "Empezar" }).click();
  const doneAssessment = page.getByRole("heading", { name: "¡Listo!" });
  // Ubicación adaptativa (specs/020): hasta 15 preguntas.
  for (let i = 0; i < 20; i++) {
    if (await doneAssessment.isVisible()) break;
    const option = page.locator(".option-btn:not([disabled])").first();
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

  // Una sesión completa son 6 preguntas (QUESTIONS_PER_SESSION), pero una
  // pausa ofrecida no cuenta como pregunta — el tope de pasos es holgado
  // para no fallar por eso. Con ~70% de preguntas temáticas, la
  // probabilidad de no ver ninguna en 6 preguntas es de ~0,3^6 ≈ 0,07%.
  let sawThemed = false;
  const sessionDone = page.getByRole("heading", { name: "¡Práctica terminada!" });
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
      // La pantalla de pausa sigue visible mientras carga la siguiente
      // pregunta: sin esperar a que desaparezca, la próxima vuelta la
      // vuelve a pulsar justo cuando se desmonta y el click se cuelga.
      await pauseDecline.waitFor({ state: "hidden" });
      continue;
    }

    const text = (await page.locator("main").innerText()).toLowerCase();
    if (THEMED_WORDS.test(text)) sawThemed = true;
    await option.click();

    const continueFeedback = page.getByRole("button", { name: "Continuar" });
    await continueFeedback.waitFor({ state: "visible" });
    await continueFeedback.click();
  }
  expect(sawThemed).toBe(true);

  await sessionDone.waitFor();
  await page.getByRole("button", { name: "Volver al inicio" }).click();

  // "Cambiar mis intereses" desde Home: vuelve a la pantalla con lo elegido marcado.
  const changeInterests = page.getByRole("button", { name: "Cambiar mis intereses" });
  await changeInterests.waitFor();
  await changeInterests.click();

  await page.getByRole("heading", { name: "¿Qué te gusta más?" }).waitFor();
  await expect(page.getByRole("button", { name: /Fútbol/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Cocina/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Espacio/ })).toHaveAttribute("aria-pressed", "true");
});
