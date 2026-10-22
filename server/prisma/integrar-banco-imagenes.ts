/**
 * Integra el banco de imágenes por curso, las traducciones de alternativas y
 * las correcciones de inglés de aula (traducciones/ingles_de_aula.json) sobre
 * la BD existente, y verifica el resultado. Idempotente — se puede
 * correr las veces que haga falta; seed.ts también lo llama al final.
 *
 *   npm run bank:images          (desde server/)
 *
 * Verifica: cada una de las 798 entradas vinculada a un único ejercicio, que
 * el curso de la carpeta coincide con el de la habilidad, y que los SVG de
 * ambos idiomas existen en client/public. Sale con código 1 si algo falla.
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/db/prisma.js";
import { Prisma } from "../src/generated/prisma/client.js";
import { linkImages, type ExerciseImage } from "./seed/imagenes/linkImages.js";
import { applyOptionTranslations, loadOptionTranslations } from "./seed/traducciones/applyOptionTranslations.js";
import { applyClassroomEnglish } from "./seed/traducciones/applyClassroomEnglish.js";
import { applyOptionFeedback } from "./seed/traducciones/applyOptionFeedback.js";
import { applyWorkedSteps } from "./seed/traducciones/applyWorkedSteps.js";
import { linkBancoVisual, loadBancoVisual } from "./seed/imagenes/bancoVisual.js";
import { applyPromptEdits } from "./seed/traducciones/applyPromptEdits.js";
import { mkdirSync, writeFileSync } from "node:fs";

const PUBLIC_DIR = fileURLToPath(new URL("../../client/public", import.meta.url));

export async function integrateImageBank(): Promise<string[]> {
  const problems: string[] = [];

  // Enunciados editados a propósito (p. ej. pictogramas de 1.° sin la
  // palabra "pictograma"): primero, porque los pasos siguientes los verifican.
  const pe = await applyPromptEdits(prisma);
  console.log(`Enunciados editados: ${pe.written} textos escritos en esta corrida (${pe.already} ya estaban al día).`);
  problems.push(...pe.problems);

  // El banco visual completo (por exerciseId) reemplaza a la ilustración
  // anterior en los ejercicios que cubre; la anterior queda solo como
  // respaldo para los demás.
  const bancoVisual = loadBancoVisual();
  const coveredByBanco = new Set(bancoVisual.entries.map((e) => e.exerciseId));
  // El índice anterior solo importa para lo que el banco visual NO cubre.
  const results = (await linkImages(prisma, coveredByBanco)).filter((r) => !coveredByBanco.has(r.entry.exerciseId));
  const count = (s: string) => results.filter((r) => r.status === s).length;
  console.log(
    `Índice anterior (solo ejercicios fuera del banco visual): ${results.length} — ${count("by_id")} por id, ${count("by_content")} por contenido, ` +
      `${count("id_mismatch")} con datos distintos, ${count("ambiguous")} ambiguas, ${count("not_found")} sin ejercicio.`,
  );
  for (const r of results) {
    if (r.status === "id_mismatch") problems.push(`${r.entry.exerciseId}: difiere en ${r.fields.join(", ")}`);
    if (r.status === "ambiguous") problems.push(`${r.entry.exerciseId}: ambiguo (${r.candidates.join(", ")})`);
    if (r.status === "not_found") problems.push(`${r.entry.exerciseId}: sin ejercicio correspondiente`);
  }

  const tr = await applyOptionTranslations(prisma);
  console.log(
    `Alternativas: ${tr.exercisesMatched} ejercicios revisados, ${tr.optionsWritten} traducciones escritas y ` +
      `${tr.promptsWritten} enunciados EN corregidos en esta corrida.`,
  );
  problems.push(...tr.problems);

  const en = await applyClassroomEnglish(prisma);
  console.log(
    `Inglés de aula: ${en.skillsMatched} habilidades y ${en.exercisesMatched} ejercicios revisados, ` +
      `${en.fieldsWritten} textos corregidos en esta corrida (${en.alreadyApplied} ya estaban al día).`,
  );
  problems.push(...en.problems);

  const fb = await applyOptionFeedback(prisma);
  console.log(`Feedback por alternativa: ${fb.written} escritos en esta corrida (${fb.already} ya estaban al día).`);
  problems.push(...fb.problems);

  // Desarrollo paso a paso y paso equivocado de cada alternativa (specs/015).
  const ws = await applyWorkedSteps(prisma);
  console.log(`Desarrollo paso a paso: ${ws.exercises} ejercicios, ${ws.written} escrituras en esta corrida.`);
  problems.push(...ws.problems);

  // Verificación final: cada labelEn del JSON quedó en la BD.
  const expected = loadOptionTranslations().flatMap((e) => e.options.filter((o) => o.labelEn !== null));
  const inDb = await prisma.exerciseOption.findMany({
    where: { id: { in: expected.map((o) => o.id) } },
    select: { id: true, labelEn: true },
  });
  const dbLabel = new Map(inDb.map((o) => [o.id, o.labelEn]));
  const missing = expected.filter((o) => dbLabel.has(o.id) && dbLabel.get(o.id) !== o.labelEn);
  console.log(`Alternativas traducidas verificadas en la BD: ${expected.length - missing.length}/${expected.length}`);

  // Banco visual completo: después de las traducciones, porque las leyendas
  // usan labelEn de las alternativas y el alt usa el inglés de aula vigente.
  const bv = await linkBancoVisual(prisma);
  console.log(
    `Banco visual: ${bv.entries} en el paquete — ${bv.linked} vinculados por exerciseId, ${bv.emojiPreferred} con dibujo de emojis (se prefiere), ${bv.emojiPictographs} pictogramas de emojis, ${bv.absent.length} ausentes ` +
      `en la BD, ${bv.promptMismatch.length} con enunciado distinto. Leyendas:`,
    bv.legends,
    "genéricas por:",
    bv.genericReasons,
  );
  // Los ausentes son ejercicios eliminados a propósito del banco (se
  // informan, no son un error); un enunciado distinto sí lo es.
  for (const m of bv.promptMismatch) problems.push(`${m.exerciseId}: enunciado distinto al del banco visual`);

  // Las 4.222 rutas del paquete (PNG + SVG) existen en client/public.
  const packagePaths = bancoVisual.entries.flatMap((e) => (e.svgSrc ? [e.src, e.svgSrc] : [e.src]));
  const missingFiles = packagePaths.filter((p) => !existsSync(PUBLIC_DIR + p));
  console.log(`Rutas del banco visual verificadas: ${packagePaths.length - missingFiles.length}/${packagePaths.length}`);
  for (const p of missingFiles) problems.push(`falta el archivo ${p}`);

  // Toda imagen vinculada: ruta del curso correcto, archivo presente y alt en ambos idiomas.
  const linked = await prisma.exercise.findMany({
    where: { image: { not: Prisma.DbNull } },
    select: { id: true, image: true, mathSkill: { select: { grade: true } } },
  });
  const perGrade: Record<number, number> = {};
  let fromBancoVisual = 0;
  for (const ex of linked) {
    const image = ex.image as unknown as ExerciseImage & { source?: string };
    const grade = ex.mathSkill.grade;
    perGrade[grade] = (perGrade[grade] ?? 0) + 1;
    if (image.source === "banco_visual") fromBancoVisual += 1;
    if (image.source === "emoji_pictograph") {
      // Sin archivo: se dibuja con emojis en la app. Solo se exige el alt.
      for (const lang of ["es", "en"] as const) if (!image.alt[lang]) problems.push(`${ex.id}: falta el texto alternativo ${lang}`);
      continue;
    }
    for (const lang of ["es", "en"] as const) {
      const src = image.src[lang];
      const expectedPrefix =
        image.source === "banco_visual" ? `/exercise-images/${grade}b__${ex.id}__` : `/banco-imagenes/${grade}_basico/${lang}/`;
      if (!src.startsWith(expectedPrefix)) problems.push(`${ex.id}: ruta ${lang} no calza con el curso (${src})`);
      if (!existsSync(PUBLIC_DIR + src)) problems.push(`${ex.id}: falta el archivo ${src}`);
      if (!image.alt[lang]) problems.push(`${ex.id}: falta el texto alternativo ${lang}`);
    }
  }
  console.log(`Ejercicios con imagen en la BD: ${linked.length} (${fromBancoVisual} del banco visual)`, perGrade);

  const reportDir = fileURLToPath(new URL("../../specs/010-banco-visual-completo", import.meta.url));
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    `${reportDir}/reporte_integracion.json`,
    JSON.stringify({ ...bv, rutasVerificadas: packagePaths.length - missingFiles.length, rutasTotales: packagePaths.length, conImagen: linked.length, porCurso: perGrade }, null, 1) + "\n",
  );
  for (const o of missing) problems.push(`${o.id}: labelEn "${o.labelEn}" no quedó en la BD`);

  return problems;
}

// Solo corre como script directo, no al importarlo desde seed.ts.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  integrateImageBank()
    .then((problems) => {
      if (problems.length > 0) {
        console.error(`Problemas (${problems.length}):\n${problems.join("\n")}`);
        process.exitCode = 1;
      } else {
        console.log("OK: integración verificada sin problemas.");
      }
    })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
