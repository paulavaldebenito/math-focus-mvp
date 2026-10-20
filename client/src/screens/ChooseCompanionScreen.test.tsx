import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChooseCompanionScreen } from "./ChooseCompanionScreen.js";

const mocks = vi.hoisted(() => ({ setCompanion: vi.fn(), setMascotName: vi.fn() }));
vi.mock("../api/endpoints.js", () => ({ setCompanion: mocks.setCompanion, setMascotName: mocks.setMascotName }));

describe("ChooseCompanionScreen", () => {
  it("no permite continuar sin elegir un compañero", () => {
    render(<ChooseCompanionScreen childId="child-1" onDone={vi.fn()} />);
    expect(screen.getByRole("button", { name: "¡Listo, empezar!" })).toBeDisabled();
  });

  it("guarda el compañero elegido y llama onDone", async () => {
    mocks.setCompanion.mockResolvedValue({ id: "child-1", companion: "zorro" });
    mocks.setMascotName.mockResolvedValue({ id: "child-1", mascotName: "Zorro" });
    const onDone = vi.fn();

    render(<ChooseCompanionScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Zorro/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    expect(mocks.setCompanion).toHaveBeenCalledWith("child-1", "zorro");
    expect(onDone).toHaveBeenCalled();
  });

  it("avanza igual si falla el guardado — elegir compañero nunca bloquea", async () => {
    mocks.setCompanion.mockRejectedValue(new Error("network"));
    const onDone = vi.fn();

    render(<ChooseCompanionScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Capi/ }));
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    expect(onDone).toHaveBeenCalled();
  });

  it("al elegir un compañero, sugiere su nombre por defecto en el campo de nombre", async () => {
    render(<ChooseCompanionScreen childId="child-1" onDone={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Conejo/ }));

    expect(screen.getByLabelText("¿Cómo se llama?")).toHaveValue("Conejo");
  });

  it("si el niño escribe un nombre propio, se guarda ese nombre (no el default)", async () => {
    mocks.setCompanion.mockResolvedValue({ id: "child-1", companion: "buho" });
    mocks.setMascotName.mockResolvedValue({ id: "child-1", mascotName: "Sabio" });
    const onDone = vi.fn();

    render(<ChooseCompanionScreen childId="child-1" onDone={onDone} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Búho/ }));
    const nameField = screen.getByLabelText("¿Cómo se llama?");
    await user.clear(nameField);
    await user.type(nameField, "Sabio");
    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));

    expect(mocks.setMascotName).toHaveBeenCalledWith("child-1", "Sabio");
    expect(onDone).toHaveBeenCalled();
  });

  it("no deja continuar si borra el nombre por completo", async () => {
    render(<ChooseCompanionScreen childId="child-1" onDone={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Capi/ }));
    await user.clear(screen.getByLabelText("¿Cómo se llama?"));

    expect(screen.getByRole("button", { name: "¡Listo, empezar!" })).toBeDisabled();
  });

  it("en modo edición, precarga el compañero y el nombre que ya tenía", async () => {
    mocks.setCompanion.mockResolvedValue({ id: "child-1", companion: "conejo" });
    mocks.setMascotName.mockResolvedValue({ id: "child-1", mascotName: "Nube" });

    render(
      <ChooseCompanionScreen
        childId="child-1"
        onDone={vi.fn()}
        initialCompanion="conejo"
        initialMascotName="Nube"
      />,
    );

    expect(screen.getByLabelText("¿Cómo se llama?")).toHaveValue("Nube");
    await userEvent.setup().click(screen.getByRole("button", { name: "¡Listo, empezar!" }));
    expect(mocks.setMascotName).toHaveBeenCalledWith("child-1", "Nube");
  });
  it("cada mascota recuerda su propio nombre: al elegir otra aparece el que ya tenía, y al volver no se pierde lo escrito", async () => {
    mocks.setCompanion.mockResolvedValue({});
    mocks.setMascotName.mockResolvedValue({});
    render(
      <ChooseCompanionScreen
        childId="child-1"
        onDone={vi.fn()}
        initialCompanion="zorro"
        initialMascotName="Pelusa"
        initialMascotNames={{ zorro: "Pelusa", buho: "Sabio" }}
      />,
    );
    const user = userEvent.setup();
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Pelusa");

    // Búho ya tenía nombre propio.
    await user.click(screen.getByRole("button", { name: /Búho/ }));
    expect(input).toHaveValue("Sabio");

    // Capi nunca tuvo: parte con el nombre del personaje; se le escribe uno.
    await user.click(screen.getByRole("button", { name: /Capi/ }));
    expect(input).toHaveValue("Capi");
    await user.clear(input);
    await user.type(input, "Nube");

    // Ir y volver no pierde lo escrito para cada una.
    await user.click(screen.getByRole("button", { name: /Zorro/ }));
    expect(input).toHaveValue("Pelusa");
    await user.click(screen.getByRole("button", { name: /Capi/ }));
    expect(input).toHaveValue("Nube");

    await user.click(screen.getByRole("button", { name: "¡Listo, empezar!" }));
    expect(mocks.setCompanion).toHaveBeenLastCalledWith("child-1", "capi");
    expect(mocks.setMascotName).toHaveBeenLastCalledWith("child-1", "Nube");
  });
});
