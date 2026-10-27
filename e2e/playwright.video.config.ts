import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

/**
 * Grabación del video de demostración para colegios (specs/019). No es una prueba: navega la app
 * con la cuenta demo (npm run demo:colegio en server/) y graba cada escena en video.
 *
 *   PW_CHANNEL=chrome npx playwright test -c playwright.video.config.ts
 *
 * Los videos quedan en test-results/; el script ../specs/019-video-colegios/exportar.sh los pasa a
 * MP4 con nombres de escena.
 */
export default defineConfig({
  ...base,
  testDir: "./demo",
  timeout: 240_000,
  workers: 1,
  retries: 0,
  use: {
    ...base.use,
    channel: process.env.PW_CHANNEL,
    launchOptions: { slowMo: 120 },
  },
  projects: [
    {
      name: "celular",
      grep: /escena [24] /,
      use: { viewport: { width: 390, height: 844 }, video: { mode: "on", size: { width: 780, height: 1688 } }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
    {
      // Tomas de «Cómo funciona»: el video graba en píxeles CSS, así que se graba un celular de
      // 390 px al doble con zoom (ver video-como-funciona.spec.ts) para que el texto se lea nítido.
      name: "celular-hd",
      grep: /toma [12] /,
      use: { viewport: { width: 780, height: 1688 }, video: { mode: "on", size: { width: 780, height: 1688 } }, isMobile: true, hasTouch: true },
    },
    {
      name: "computador",
      grep: /escena [35] |toma [34] /,
      use: { viewport: { width: 1366, height: 820 }, video: { mode: "on", size: { width: 1366, height: 820 } } },
    },
  ],
});
