import { defineConfig, devices } from "@playwright/test";

// Cubre el recorrido completo (specs/001-mvp-regulado/spec.md) contra el
// cliente y el servidor reales, sin mocks — a diferencia de los tests de
// integración por endpoint (server/) o por componente (client/), esto
// ejercita la app tal como la usaría un adulto real en un navegador.
// Puertos configurables para el ambiente de test aislado (scripts/ambiente-test.sh, specs/023):
// así corre al lado de un `npm run dev` abierto sin reutilizarlo ni tocar la base de desarrollo.
const SERVER_PORT = Number(process.env.E2E_SERVER_PORT ?? 4100);
const CLIENT_PORT = Number(process.env.E2E_CLIENT_PORT ?? 5173);
// En CI o en el ambiente aislado se levantan siempre servidores nuevos; en local se reutiliza
// el `npm run dev` que ya esté corriendo.
const reuseExistingServer = !process.env.CI && !process.env.E2E_AISLADO;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${CLIENT_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Arranca cliente y servidor reales. Las variables de entorno del
  // servidor (DATABASE_URL, SESSION_SECRET, etc.) se toman de server/.env
  // en local, o del entorno del job en CI — no se redeclaran acá.
  webServer: [
    {
      command: "npm run dev",
      cwd: "../server",
      port: SERVER_PORT,
      timeout: 60_000,
      reuseExistingServer,
      env: { PORT: String(SERVER_PORT), CLIENT_ORIGIN: `http://localhost:${CLIENT_PORT}` },
    },
    {
      command: `npm run dev -- --port ${CLIENT_PORT} --strictPort`,
      cwd: "../client",
      port: CLIENT_PORT,
      timeout: 60_000,
      reuseExistingServer,
      env: { VITE_API_URL: `http://localhost:${SERVER_PORT}` },
    },
  ],
});
