import { test, expect, type Page } from "@playwright/test";

/**
 * Recorrido completo de specs/001-mvp-regulado/spec.md: registro del adulto
 * → consentimiento → perfil infantil → mascota → evaluación inicial →
 * sesión de práctica → panel familiar. Cubre lo que los tests de
 * integración (por endpoint) y de componente (por pantalla) no prueban:
 * que las pantallas reales se encadenan correctamente en un navegador real.
 *
 * El número de ejercicios de la evaluación inicial y la posibilidad de que
 * el motor adaptativo ofrezca una pausa durante la práctica dependen de
 * datos/reglas del servidor — este test no asume un conteo fijo, avanza
 * mientras haya una pregunta o pausa visible, con un tope de iteraciones
 * para no colgarse si algo queda mal encadenado.
 */

// Localmente, si Chromium de Playwright no está disponible: PW_CHANNEL=chrome.
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL });

// Nunca .option-btn a secas: mientras carga el siguiente ejercicio hay una
// llamada de red de por medio, y los botones de la pregunta anterior siguen
// un instante en el DOM pero deshabilitados — engancharse a esos hace que
// el click espere para siempre a que se habiliten, cuando en realidad van a
// ser reemplazados por completo.
function enabledOption(page: Page) {
  return page.locator(".option-btn:not([disabled])").first();
}

// Evaluación inicial (InitialAssessmentScreen): cada respuesta avanza
// directo a la siguiente pregunta, sin pantalla de feedback intermedia.
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

// Sesión de práctica (PracticeScreen): cada respuesta muestra una pantalla
// de feedback con un botón "Continuar" antes de pasar a la siguiente
// pregunta, y el motor adaptativo puede ofrecer una pausa en el camino.
async function answerPracticeUntil(page: Page, doneHeading: string, maxSteps: number) {
  const done = page.getByRole("heading", { name: doneHeading });
  const pauseDecline = page.getByRole("button", { name: "Prefiero seguir" });
  for (let i = 0; i < maxSteps; i++) {
    if (await done.isVisible()) return;

    const option = enabledOption(page);
    await Promise.race([
      done.waitFor({ state: "visible" }),
      pauseDecline.waitFor({ state: "visible" }),
      option.waitFor({ state: "visible" }),
    ]);

    if (await done.isVisible()) return;

    if (await pauseDecline.isVisible()) {
      await pauseDecline.click();
      // La pantalla de pausa sigue visible mientras carga la siguiente
      // pregunta: sin esperar a que desaparezca, la próxima vuelta del bucle
      // la vuelve a pulsar justo cuando se desmonta y el click se cuelga.
      await pauseDecline.waitFor({ state: "hidden" });
      continue;
    }

    await option.click();

    const continueBtn = page.getByRole("button", { name: "Continuar" });
    await continueBtn.waitFor({ state: "visible" });
    await continueBtn.click();
  }
  throw new Error(`No se llegó a "${doneHeading}" tras ${maxSteps} pasos.`);
}

test("registro, consentimiento, perfil, mascota, evaluación inicial, práctica y panel familiar", async ({
  page,
}) => {
  const email = `e2e.${Date.now()}@example.test`;
  const password = "clave-de-prueba-e2e-1234";

  await page.goto("/");

  // Registro (auto-login al crear la cuenta — ver AuthContext.register).
  await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  // Consentimiento explícito — obligatorio antes de crear el perfil.
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Perfil infantil — el curso es obligatorio desde la expansión a 2° básico.
  await page.getByLabel("Nombre").fill("Niño E2E");
  await page.getByRole("button", { name: "1° básico" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Elegir compañero.
  await page.getByRole("button", { name: /Zorro/ }).click();
  await page.getByRole("button", { name: "¡Listo, empezar!" }).click();

  // Elegir interés (tematiza los ejercicios; no bloquea el resto del recorrido).
  await page.getByRole("button", { name: /Animales/ }).click();
  await page.getByRole("button", { name: "¡Listo, empezar!" }).click();

  // Antes de la evaluación: ofrece un momento de respiración (siempre se puede saltar).
  await expect(page.getByRole("heading", { name: "Antes de empezar" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar ahora" }).click();

  // Evaluación inicial breve.
  await expect(page.getByRole("heading", { name: "Vamos a conocernos" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar" }).click();
  await answerAssessmentUntil(page, "¡Perfecto!", 10);
  await page.getByRole("button", { name: "Vamos a practicar" }).click();

  // El mapa de habilidades reemplazó al botón directo de practicar: se elige
  // el primer nodo disponible (los demás arrancan bloqueados).
  await page.getByRole("heading", { name: "Mapa de aprendizaje" }).waitFor();
  await page.locator(".skill-node:not([disabled])").first().click();


  // Sesión de práctica adaptativa.
  // Check-in breve con caritas al empezar la práctica (opcional).
  await expect(page.getByRole("heading", { name: "¿Cómo estás hoy?" })).toBeVisible();
  await page.getByRole("radio", { name: "Bien", exact: true }).click();
  await page.getByRole("radio", { name: "Tranquilo/a", exact: true }).click();
  await page.getByRole("button", { name: "Listo" }).click();
  await expect(page.getByRole("heading", { name: "Antes de empezar" })).toBeVisible();
  await page.getByRole("button", { name: "Empezar ahora" }).click();
  await answerPracticeUntil(page, "¡Sesión terminada!", 20);
  await page.getByRole("button", { name: "Volver al inicio" }).click();

  // Panel familiar de progreso — accesible desde el inicio.
  await page.getByRole("button", { name: "Ver progreso" }).click();
  await expect(page.getByRole("button", { name: "Volver" })).toBeVisible();
});
