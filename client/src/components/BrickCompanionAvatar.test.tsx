import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BrickCompanionAvatar } from "./BrickCompanionAvatar.js";
import { companionByKey } from "../lib/companions.js";

describe("BrickCompanionAvatar", () => {
  it("sin mood, muestra la foto neutra de la mascota", () => {
    const { container } = render(<BrickCompanionAvatar companion={companionByKey("zorro")} />);
    const img = container.querySelector("img")!;
    expect(img.src).toContain("/mascots/zorro-idle.jpg");
  });

  it("con mood 'happy', cambia a la foto feliz de esa mascota (no solo la animación)", () => {
    const { container } = render(<BrickCompanionAvatar companion={companionByKey("capi")} mood="happy" />);
    const img = container.querySelector("img")!;
    expect(img.src).toContain("/mascots/capi-happy.jpg");
  });

  it("con mood 'encourage', cambia a la foto de ánimo de esa mascota", () => {
    const { container } = render(<BrickCompanionAvatar companion={companionByKey("conejo")} mood="encourage" />);
    const img = container.querySelector("img")!;
    expect(img.src).toContain("/mascots/conejo-encourage.jpg");
  });
});
