/// Arma el banco completo (los 6 cursos con sus variantes temáticas) a
/// partir de los datos puros — compartido por seed.ts y ids/exportar-ids.ts.
import { grade1 } from "./grade1.js";
import { grade2 } from "./grade2.js";
import { grade3 } from "./grade3.js";
import { grade4 } from "./grade4.js";
import { grade5 } from "./grade5.js";
import { grade6 } from "./grade6.js";
import { themedBlocks } from "./themes/index.js";
import type { ErrorIds, SkillBlock } from "./lib.js";

export function buildBlocks(errorTypeByCode: ErrorIds): { blocks: SkillBlock[]; problems: string[] } {
  const grades = [grade1, grade2, grade3, grade4, grade5, grade6];
  const blocks: SkillBlock[] = [];
  const problems: string[] = [];
  grades.forEach((gradeFn, i) => {
    const themed = themedBlocks(i + 1, gradeFn(errorTypeByCode));
    // El orden del contenido en el mapa de habilidades es la posición en la
    // que el agente de este curso escribió sus contenidos (ya sigue una
    // secuencia pedagógica razonable, eje por eje) — no algo que los agentes
    // declaren a mano.
    themed.blocks.forEach((b, order) => blocks.push({ ...b, skill: { ...b.skill, order } }));
    problems.push(...themed.problems);
  });
  return { blocks, problems };
}
