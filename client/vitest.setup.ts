import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Sin `globals: true` en vitest.config.ts, la limpieza automática entre
// pruebas de Testing Library no se registra sola — se hace explícita acá.
afterEach(() => {
  cleanup();
});

// jsdom no implementa matchMedia — lo usan Confetti (prefers-reduced-motion)
// y cualquier otro componente que consulte una media query. Sin esto, un
// test que llega a renderizarlos lanza "matchMedia is not a function".
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
