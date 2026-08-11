import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthScreen } from "./AuthScreen.js";
import { AuthProvider } from "../context/AuthContext.js";
import { ApiError } from "../api/client.js";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock("../api/endpoints.js", () => ({
  me: mocks.me,
  login: mocks.login,
  register: mocks.register,
}));

function renderScreen() {
  return render(
    <AuthProvider>
      <AuthScreen />
    </AuthProvider>,
  );
}

describe("AuthScreen", () => {
  it("muestra un mensaje claro cuando el login falla por credenciales inválidas", async () => {
    mocks.me.mockRejectedValue(new Error("not authenticated"));
    mocks.login.mockRejectedValue(new ApiError(401, { error: "invalid_credentials" }));

    renderScreen();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Correo electrónico"), "ficticio@example.test");
    await user.type(screen.getByLabelText("Contraseña"), "clave-incorrecta");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
  });

  it("cambia a modo registro y muestra el requisito de contraseña", async () => {
    mocks.me.mockRejectedValue(new Error("not authenticated"));

    renderScreen();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }));

    expect(screen.getByRole("heading", { name: "Crea tu cuenta" })).toBeInTheDocument();
    expect(screen.getByText("Al menos 8 caracteres.")).toBeInTheDocument();
  });

  it("un registro exitoso llama a register y luego a login", async () => {
    mocks.me.mockRejectedValue(new Error("not authenticated"));
    mocks.register.mockResolvedValue({ id: "1", email: "ficticio@example.test" });
    mocks.login.mockResolvedValue({ id: "1", email: "ficticio@example.test" });

    renderScreen();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }));
    await user.type(screen.getByLabelText("Correo electrónico"), "ficticio@example.test");
    await user.type(screen.getByLabelText("Contraseña"), "clave-de-prueba-123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(mocks.register).toHaveBeenCalledWith("ficticio@example.test", "clave-de-prueba-123");
    expect(mocks.login).toHaveBeenCalledWith("ficticio@example.test", "clave-de-prueba-123");
  });
});
