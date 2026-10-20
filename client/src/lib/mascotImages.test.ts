import { describe, expect, it } from "vitest";
import { mascotImageForCompanion } from "./mascotImages.js";

describe("mascotImageForCompanion", () => {
  it("devuelve la foto neutra por defecto si no se pide un estado de ánimo", () => {
    expect(mascotImageForCompanion("zorro")).toBe("/mascots/zorro-idle.jpg");
  });

  it("devuelve una foto distinta por cada estado de ánimo, no solo la neutra", () => {
    expect(mascotImageForCompanion("capi", "idle")).toBe("/mascots/capi-idle.jpg");
    expect(mascotImageForCompanion("capi", "happy")).toBe("/mascots/capi-happy.jpg");
    expect(mascotImageForCompanion("capi", "encourage")).toBe("/mascots/capi-encourage.jpg");
  });

  it("cubre las 4 mascotas", () => {
    expect(mascotImageForCompanion("buho", "happy")).toBe("/mascots/buho-happy.jpg");
    expect(mascotImageForCompanion("conejo", "encourage")).toBe("/mascots/conejo-encourage.jpg");
  });

  it("sin mascota reconocida (o null/undefined), cae de vuelta a Capi", () => {
    expect(mascotImageForCompanion(null, "happy")).toBe("/mascots/capi-happy.jpg");
    expect(mascotImageForCompanion(undefined)).toBe("/mascots/capi-idle.jpg");
    expect(mascotImageForCompanion("no-existe")).toBe("/mascots/capi-idle.jpg");
  });
});
