import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: { NODE_ENV: "test" },
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["dist/**", "node_modules/**"],
    // Las pruebas de integración usan la misma base Postgres local (prisma dev) —
    // correrlas en serie evita condiciones de carrera sobre las mismas tablas.
    fileParallelism: false,
  },
});
