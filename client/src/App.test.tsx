import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.js";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  listChildren: vi.fn(),
  createConsent: vi.fn(),
  createChild: vi.fn(),
  setCompanion: vi.fn(),
  setInterests: vi.fn(),
  getInitialAssessment: vi.fn(),
  startSession: vi.fn(),
  getNextExercise: vi.fn(),
  getHomeSummary: vi.fn(),
  getSkillPath: vi.fn(),
}));

vi.mock("./api/endpoints.js", () => mocks);

mocks.getHomeSummary.mockResolvedValue({ companion: "capi", totalStars: 0, starsToday: 0, streak: 0 });

describe("App", () => {
  it("muestra la pantalla de inicio de sesión cuando /me falla", async () => {
    mocks.me.mockRejectedValue(new Error("not authenticated"));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Inicia sesión" })).toBeInTheDocument();
    });
  });

  it("recorrido completo de onboarding: login → sin hijos → consentimiento → crear perfil → listo", async () => {
    mocks.me.mockRejectedValue(new Error("not authenticated"));
    mocks.login.mockResolvedValue({ id: "adult-1", email: "ficticio@example.test" });
    mocks.listChildren.mockResolvedValue([]);
    mocks.createConsent.mockResolvedValue({ id: "consent-1", scope: "x", grantedAt: "now" });
    mocks.createChild.mockResolvedValue({ id: "child-1", displayName: "Ana", grade: 1, language: "es" });
    mocks.setCompanion.mockResolvedValue({ id: "child-1", companion: "capi" });
    mocks.setInterests.mockResolvedValue({ id: "child-1", interests: ["futbol"] });
    mocks.getInitialAssessment.mockResolvedValue({
      exercises: [{ id: "ex1", prompt: "¿Cuánto es 6 + 7?", options: [{ id: "a1", label: "13" }] }],
    });

    render(<App />);
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Inicia sesión" });
    await user.type(screen.getByLabelText("Correo electrónico"), "ficticio@example.test");
    await user.type(screen.getByLabelText("Contraseña"), "clave-de-prueba-123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await screen.findByRole("heading", { name: "Antes de continuar" });
    await user.click(screen.getByRole("checkbox", { name: /doy mi consentimiento/ }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await screen.findByRole("heading", { name: "Crea el perfil de tu hijo/a" });
    await user.type(screen.getByLabelText("Nombre"), "Ana");
    await user.click(screen.getByRole("button", { name: "1° básico" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    // Un perfil recién creado elige compañero antes de la evaluación inicial.
    await screen.findByRole("heading", { name: "Elige tu mascota" });
    await user.click(screen.getByRole("button", { name: /Capi/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    // Luego elige un interés, también antes de la evaluación inicial.
    await screen.findByRole("heading", { name: "¿Qué te gusta más?" });
    await user.click(screen.getByRole("button", { name: /Fútbol/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo!" }));

    // Antes del control, ofrece un momento de respiración (siempre saltable).
    await user.click(await screen.findByRole("button", { name: "Empezar ahora" }));

    await user.click(await screen.findByRole("button", { name: "Empezar" }));
    expect(await screen.findByText("¿Cuánto es 6 + 7?")).toBeInTheDocument();
  });

  it("un adulto que ya tiene un hijo salta la evaluación inicial y va directo a practicar", async () => {
    mocks.me.mockResolvedValue({ id: "adult-1", email: "ficticio@example.test" });
    mocks.listChildren.mockResolvedValue([
      { id: "child-2", displayName: "Beto", grade: 1, language: "es", interests: ["animales"] },
    ]);
    mocks.getSkillPath.mockReturnValue(new Promise(() => {})); // se queda "cargando" a propósito

    render(<App />);

    // Con interés ya elegido, salta la evaluación inicial y va directo al
    // mapa de habilidades (no directo a practicar: primero elige un nodo).
    await waitFor(() => {
      expect(screen.getByText("Cargando…")).toBeInTheDocument();
    });
  });

  it("un perfil existente sin interés guardado lo elige y salta directo a práctica (sin evaluación inicial)", async () => {
    mocks.me.mockResolvedValue({ id: "adult-1", email: "ficticio@example.test" });
    mocks.listChildren.mockResolvedValue([
      { id: "child-3", displayName: "Cata", grade: 1, language: "es", interests: [] },
    ]);
    mocks.setInterests.mockResolvedValue({ id: "child-3", interests: ["musica"] });
    mocks.getSkillPath.mockReturnValue(new Promise(() => {})); // se queda "cargando" a propósito

    render(<App />);
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "¿Qué te gusta más?" });
    await user.click(screen.getByRole("button", { name: /Música/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo!" }));

    // Va directo al mapa de habilidades, no a practicar (elige un nodo primero).
    await waitFor(() => {
      expect(screen.getByText("Cargando…")).toBeInTheDocument();
    });
  });
});
