import { defineConfig, devices } from "@playwright/test";

// Cubre el recorrido completo (specs/001-mvp-regulado/spec.md) contra el
// cliente y el servidor reales, sin mocks — a diferencia de los tests de
// integración por endpoint (server/) o por componente (client/), esto
// ejercita la app tal como la usaría un adulto real en un navegador.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  timeout: 90_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:5173",
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
      port: 4100,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev",
      cwd: "../client",
      port: 5173,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
