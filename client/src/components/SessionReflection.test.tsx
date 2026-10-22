import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionReflection } from "./SessionReflection.js";

describe("SessionReflection", () => {
  it("pregunta qué sintió y la pregunta lúdica que toca, y agradece según la emoción", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ id: "r1" });
    const user = userEvent.setup();
    render(<SessionReflection lang="es" question="weather" onSubmit={onSubmit} />);

    expect(screen.getByText("¿Qué sentiste hoy practicando?")).toBeInTheDocument();
    expect(screen.getByText("Si la práctica de hoy fuera un clima, ¿cuál sería?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Listo" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Nervios/ }));
    await user.click(screen.getByRole("radio", { name: /Lluvia/ }));
    expect(screen.getByRole("radio", { name: /Nervios/ })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSubmit).toHaveBeenCalledWith({ emotion: "nervios", weather: 2 });
    expect(await screen.findByRole("status")).toHaveTextContent("Equivocarse está permitido");
  });

  it("rota a energía o lo más difícil, y «Saltar» registra vacío sin mostrar nada más", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ id: "r1" });
    const user = userEvent.setup();
    const { rerender } = render(<SessionReflection lang="en" question="hardest" onSubmit={onSubmit} />);
    expect(screen.getByText("What was the hardest part?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Doing the math/ })).toBeInTheDocument();

    rerender(<SessionReflection lang="es" question="energy" onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Saltar" }));
    expect(onSubmit).toHaveBeenCalledWith({});
    expect(screen.queryByText("¿Qué sentiste hoy practicando?")).not.toBeInTheDocument();
  });

  it("si falla el guardado, igual agradece (nunca bloquea al niño)", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("red"));
    const user = userEvent.setup();
    render(<SessionReflection lang="es" question="energy" onSubmit={onSubmit} />);
    await user.click(screen.getByRole("radio", { name: /Mucha/ }));
    await user.click(screen.getByRole("button", { name: "Listo" }));
    expect(await screen.findByRole("status")).toHaveTextContent("¡Gracias por contarme!");
  });
});
