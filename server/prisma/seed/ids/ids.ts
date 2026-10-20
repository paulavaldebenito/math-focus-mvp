/// Ids fijos de ejercicios y alternativas (ids_ejercicios.json).
///
/// El banco visual, los enunciados editados, las traducciones y el feedback
/// por alternativa apuntan a ejercicios y alternativas POR ID. Sin ids fijos,
/// una BD sembrada desde cero (CI, una instalación nueva) recibía ids nuevos
/// y nada de eso se vinculaba. Con este archivo, persist.ts crea cada
/// ejercicio con el mismo id en cualquier BD. Clave: curso, habilidad y
/// enunciado TAL COMO ESTÁ EN LAS FUENTES (grade*.ts, themes/*.ts) — el
/// texto anterior si después se editó (enunciados_editados.json).
///
/// Un ejercicio nuevo en las fuentes no está en el archivo: recibe un id
/// generado, como antes. Regenerar con `npm run bank:ids` (desde server/)
/// sobre una BD ya sembrada e integrada.
import { readFileSync } from "node:fs";

export interface FixedIds {
  grade: number;
  skill: string;
  prompt: string;
  id: string;
  /// Texto de la alternativa → id.
  options: Record<string, string>;
}

export const idKey = (grade: number, skill: string, prompt: string) => `${grade}|${skill}|${prompt}`;

let cache: Map<string, FixedIds> | null = null;

export function loadFixedIds(): Map<string, FixedIds> {
  if (!cache) {
    const list = JSON.parse(readFileSync(new URL("./ids_ejercicios.json", import.meta.url), "utf8")) as FixedIds[];
    cache = new Map(list.map((e) => [idKey(e.grade, e.skill, e.prompt), e]));
  }
  return cache;
}
