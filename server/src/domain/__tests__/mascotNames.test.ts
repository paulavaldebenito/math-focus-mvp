import { describe, expect, it } from "vitest";
import { renameMascot, switchCompanion, toMascotNames } from "../mascotNames.js";

describe("nombre propio por mascota", () => {
  it("al cambiar de mascota guarda el nombre de la actual y recupera el de la nueva", () => {
    const r = switchCompanion({ buho: "Sabio" }, { companion: "zorro", mascotName: "Pelusa" }, "buho");
    expect(r).toEqual({ mascotNames: { buho: "Sabio", zorro: "Pelusa" }, mascotName: "Sabio" });
  });

  it("una mascota sin nombre propio queda sin nombre (la UI usa el del personaje)", () => {
    expect(switchCompanion({}, { companion: "zorro", mascotName: "Pelusa" }, "capi").mascotName).toBeNull();
  });

  it("en la primera elección (sin mascota previa) no guarda nada extra", () => {
    expect(switchCompanion({}, { companion: null, mascotName: null }, "zorro")).toEqual({ mascotNames: {}, mascotName: null });
  });

  it("renombrar guarda el nombre para la mascota actual", () => {
    expect(renameMascot({ zorro: "Pelusa" }, "zorro", "Chispa")).toEqual({ zorro: "Chispa" });
    expect(renameMascot({}, null, "X")).toEqual({});
  });

  it("toMascotNames ignora valores inválidos de la columna JSON", () => {
    expect(toMascotNames(null)).toEqual({});
    expect(toMascotNames([1])).toEqual({});
    expect(toMascotNames({ zorro: "Pelusa", buho: "", capi: 3 })).toEqual({ zorro: "Pelusa" });
  });
});
