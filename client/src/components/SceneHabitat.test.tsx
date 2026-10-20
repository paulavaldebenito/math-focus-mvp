import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SceneHabitat } from "./SceneHabitat.js";
import { companionByKey } from "../lib/companions.js";

describe("SceneHabitat", () => {
  it("muestra el conteo de regalos para que se vea cuántos lleva", () => {
    render(<SceneHabitat companion={companionByKey("conejo")} totalStars={10} />);
    expect(screen.getByText("×3")).toBeInTheDocument();
  });


  it("no muestra ningún elemento decorativo por debajo del primer umbral", () => {
    const { container } = render(<SceneHabitat companion={companionByKey("conejo")} totalStars={2} />);
    expect(container.querySelectorAll(".scene-pop")).toHaveLength(0);
  });

  it("desbloquea el primer regalo justo al llegar al umbral", () => {
    const { container } = render(<SceneHabitat companion={companionByKey("conejo")} totalStars={3} />);
    expect(container.querySelectorAll(".scene-pop")).toHaveLength(1);
  });

  it("acumula regalos a medida que suben las estrellas, nunca los quita", () => {
    const { container } = render(<SceneHabitat companion={companionByKey("conejo")} totalStars={20} />);
    expect(container.querySelectorAll(".scene-pop")).toHaveLength(5);
  });

  it("cada mascota recibe su propio tipo de regalo", () => {
    const stars = 20;
    const { container: capiScene } = render(<SceneHabitat companion={companionByKey("capi")} totalStars={stars} />);
    const { container: buhoScene } = render(<SceneHabitat companion={companionByKey("buho")} totalStars={stars} />);
    const { container: zorroScene } = render(<SceneHabitat companion={companionByKey("zorro")} totalStars={stars} />);
    const { container: conejoScene } = render(<SceneHabitat companion={companionByKey("conejo")} totalStars={stars} />);

    // Capi: flores (emoji). Búho: ramitas (path sin fill). Zorro: hojitas
    // (ellipse café). Conejo: zanahorias (path relleno naranja).
    expect(capiScene.querySelectorAll(".scene-pop .gift-emoji").length).toBeGreaterThan(0);
    expect(buhoScene.querySelectorAll(".scene-pop path[stroke='#8B6B3D']").length).toBeGreaterThan(0);
    expect(zorroScene.querySelectorAll(".scene-pop ellipse[fill='#9C6B3E']").length).toBeGreaterThan(0);
    expect(conejoScene.querySelectorAll(".scene-pop path[fill='#E8862E']").length).toBeGreaterThan(0);
  });
});
