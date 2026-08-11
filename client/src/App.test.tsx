import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App.js";

vi.mock("./api/endpoints.js", () => ({
  me: vi.fn().mockRejectedValue(new Error("not authenticated")),
}));

describe("App", () => {
  it("muestra la pantalla de inicio de sesión cuando /me falla", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Inicia sesión" })).toBeInTheDocument();
    });
  });
});
