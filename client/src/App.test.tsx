import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App.js";

vi.mock("./api/endpoints.js", () => ({
  me: vi.fn().mockRejectedValue(new Error("not authenticated")),
}));

describe("App", () => {
  it("muestra el estado de sesión no iniciada cuando /me falla", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("logged-out-marker")).toBeInTheDocument();
    });
  });
});
