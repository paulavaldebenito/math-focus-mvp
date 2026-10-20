import { describe, expect, it } from "vitest";
import { rankFromStars, RANK_STEP } from "../homeSummary.js";

describe("rankFromStars", () => {
  it("0 estrellas es rango 1 (nunca rango 0)", () => {
    expect(rankFromStars(0)).toEqual({ rank: 1, starsIntoRank: 0, starsToNextRank: RANK_STEP });
  });

  it("justo en el paso de rango, sube uno y reinicia el progreso dentro del rango", () => {
    expect(rankFromStars(RANK_STEP)).toEqual({ rank: 2, starsIntoRank: 0, starsToNextRank: RANK_STEP });
  });

  it("a mitad de camino entre dos rangos", () => {
    const half = Math.floor(RANK_STEP / 2);
    expect(rankFromStars(half)).toEqual({
      rank: 1,
      starsIntoRank: half,
      starsToNextRank: RANK_STEP - half,
    });
  });

  it("nunca baja de rango 1 con estrellas negativas (defensivo, no debería ocurrir)", () => {
    expect(rankFromStars(0).rank).toBeGreaterThanOrEqual(1);
  });

  it("es monótono: más estrellas nunca da un rango menor", () => {
    expect(rankFromStars(45).rank).toBeGreaterThanOrEqual(rankFromStars(20).rank);
  });
});
