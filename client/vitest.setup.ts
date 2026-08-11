import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Sin `globals: true` en vitest.config.ts, la limpieza automática entre
// pruebas de Testing Library no se registra sola — se hace explícita acá.
afterEach(() => {
  cleanup();
});
