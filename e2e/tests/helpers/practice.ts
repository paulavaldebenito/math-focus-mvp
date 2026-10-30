import type { Page } from "@playwright/test";

function enabledOption(page: Page) {
  return page.locator(".option-btn:not([disabled])").first();
}

/**
 * Responde una sesión de práctica ya empezada hasta «¡Práctica terminada!»: preguntas normales,
 * la pausa a mitad de sesión («Prefiero seguir») y la ronda «detecta el error» (cada 3
 * preguntas, si el banco tiene una alternativa clasificada — en una base local con muchos
 * intentos aparece casi siempre).
 *
 * Mismo patrón que spot-error.spec.ts: se actúa sobre el resultado YA RESUELTO de la carrera y,
 * antes de volver a mirar, se espera a que la pantalla anterior desaparezca. Un `isVisible()`
 * suelto después de la carrera, o tragarse errores con `.catch(() => {})`, hacía que el bucle
 * gastara sus vueltas mirando una pantalla a medio cambiar y nunca terminara la sesión.
 */
export async function finishPracticeSession(page: Page, maxSteps = 30): Promise<void> {
  const sessionDone = page.getByRole("heading", { name: "¡Práctica terminada!" });
  const pauseDecline = page.getByRole("button", { name: "Prefiero seguir" });
  const spotErrorLead = page.getByText("Tu amigo resolvió este problema:");
  const continueBtn = page.getByRole("button", { name: "Continuar" });

  for (let i = 0; i < maxSteps; i++) {
    const option = enabledOption(page);
    const outcome = await Promise.race([
      sessionDone.waitFor({ state: "visible" }).then(() => "done" as const),
      pauseDecline.waitFor({ state: "visible" }).then(() => "pause" as const),
      spotErrorLead.waitFor({ state: "visible" }).then(() => "spot" as const),
      option.waitFor({ state: "visible" }).then(() => "option" as const),
    ]);

    if (outcome === "done") return;

    if (outcome === "pause") {
      await pauseDecline.click();
      await pauseDecline.waitFor({ state: "hidden" });
      continue;
    }

    if (outcome === "spot") {
      // Cualquiera de los 3 diagnósticos sirve; el texto sigue visible durante el feedback.
      await page.locator(".form .option-btn").first().click();
      await continueBtn.click();
      await spotErrorLead.waitFor({ state: "hidden" });
      continue;
    }

    await option.click();
    await continueBtn.click();
  }
  // Si no terminó, que falle aquí con un mensaje claro y no 90 s después en otro paso.
  await sessionDone.waitFor({ timeout: 5000 });
}

/**
 * Responde la evaluación de ubicación hasta «¡Listo!». Desde specs/020 puede tener hasta 15
 * preguntas (antes eran 3): un tope de 10 vueltas la dejaba a medias según lo que se respondiera.
 */
export async function finishPlacementAssessment(page: Page, maxSteps = 20): Promise<void> {
  const done = page.getByRole("heading", { name: "¡Listo!" });
  for (let i = 0; i < maxSteps; i++) {
    const option = enabledOption(page);
    const outcome = await Promise.race([
      done.waitFor({ state: "visible" }).then(() => "done" as const),
      option.waitFor({ state: "visible" }).then(() => "option" as const),
    ]);
    if (outcome === "done") return;
    await option.click();
  }
  await done.waitFor({ timeout: 5000 });
}
