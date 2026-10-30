/**
 * Volumen para pruebas de escalabilidad (specs/024): N familias ficticias con un hijo cada una,
 * su consentimiento y un historial de prácticas e intentos. Solo para una base de carga aislada —
 * se niega a correr en producción o contra la base de `server/.env`.
 *
 *   DATABASE_URL=<base de carga> npx tsx prisma/carga/sembrar-volumen.ts [familias] [sesiones/niño]
 *
 * Todas las cuentas: carga.<i>@example.test / clave «carga-de-prueba-1234» (un solo hash
 * precalculado: scrypt por cuenta tomaría horas con 100 mil).
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { hashPassword } from "../../src/auth/password.js";

const FAMILIAS = Number(process.argv[2] ?? 100_000);
const SESIONES_POR_NINO = Number(process.argv[3] ?? 2);
const INTENTOS_POR_SESION = 6;
export const CLAVE_CARGA = "carga-de-prueba-1234";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL (la base de carga).");
if (process.env.NODE_ENV === "production") throw new Error("sembrar-volumen es solo para pruebas.");
const urlDesarrollo = readFileSync(new URL("../../.env", import.meta.url), "utf8").match(/DATABASE_URL="?([^"\n]+)/)?.[1];
if (urlDesarrollo && new URL(urlDesarrollo).port === new URL(url).port) {
  throw new Error("DATABASE_URL apunta a la base de desarrollo. Usa una base de carga aislada.");
}

const db = new pg.Client({ connectionString: url });
await db.connect();
const t0 = Date.now();
const paso = async (nombre: string, sql: string, params: unknown[] = []) => {
  const t = Date.now();
  const r = await db.query(sql, params);
  console.log(`${nombre}: ${r.rowCount ?? 0} filas en ${((Date.now() - t) / 1000).toFixed(1)} s`);
};

await paso("Limpieza de una carga anterior", `DELETE FROM "Attempt" WHERE id LIKE 'carga-%'`);
await paso("", `DELETE FROM "Session" WHERE id LIKE 'carga-%'`);
await paso("", `DELETE FROM "ChildProfile" WHERE id LIKE 'carga-%'`);
await paso("", `DELETE FROM "Consent" WHERE id LIKE 'carga-%'`);
await paso("", `DELETE FROM "AdultUser" WHERE id LIKE 'carga-%'`);

const hash = await hashPassword(CLAVE_CARGA);
await paso(
  "Familias",
  `INSERT INTO "AdultUser" (id, email, "passwordHash", "updatedAt")
   SELECT 'carga-a-' || i, 'carga.' || i || '@example.test', $1, now() FROM generate_series(1, $2) i`,
  [hash, FAMILIAS],
);
await paso(
  "Consentimientos",
  `INSERT INTO "Consent" (id, "adultUserId", scope)
   SELECT 'carga-c-' || i, 'carga-a-' || i, 'Consentimiento ficticio de carga' FROM generate_series(1, $1) i`,
  [FAMILIAS],
);
await paso(
  "Niños",
  `INSERT INTO "ChildProfile" (id, "adultUserId", "consentId", "displayName", grade, companion, interests)
   SELECT 'carga-n-' || i, 'carga-a-' || i, 'carga-c-' || i, 'Niño ' || i, 1 + (i % 6), 'capi', ARRAY['animales']
   FROM generate_series(1, $1) i`,
  [FAMILIAS],
);
// Prácticas repartidas en los últimos 30 días, de una habilidad del curso del niño.
await paso(
  "Prácticas",
  `INSERT INTO "Session" (id, "childProfileId", "mathSkillId", kind, "startedAt", "endedAt")
   SELECT 'carga-s-' || i || '-' || s, 'carga-n-' || i,
          (SELECT id FROM "MathSkill" m WHERE m.grade = 1 + (i % 6) ORDER BY m."order" LIMIT 1),
          'practica', now() - ((i + s) % 30) * interval '1 day', now() - ((i + s) % 30) * interval '1 day' + interval '8 minutes'
   FROM generate_series(1, $1) i, generate_series(1, $2) s`,
  [FAMILIAS, SESIONES_POR_NINO],
);
// Por tandas de familias: un solo INSERT de 1,2 millones de filas no terminó en 8 h sobre
// `prisma dev` (PGlite). Cada tanda queda guardada y muestra su avance.
const TANDA = 5_000;
for (let desde = 1; desde <= FAMILIAS; desde += TANDA) {
  const hasta = Math.min(FAMILIAS, desde + TANDA - 1);
  await paso(
    `Intentos ${desde}–${hasta} de ${FAMILIAS} (${((Date.now() - t0) / 1000).toFixed(0)} s)`,
    `WITH ej AS (SELECT array_agg(id ORDER BY id) AS ids FROM "Exercise")
     INSERT INTO "Attempt" (id, "sessionId", "exerciseId", "isCorrect", "responseTimeMs", "createdAt")
     SELECT 'carga-t-' || x.sid || '-' || k, x.sid,
            ej.ids[1 + (abs(hashtext(x.sid)) + k) % cardinality(ej.ids)],
            (k % 3) <> 0, 4000 + (k * 997) % 9000, x.inicio + k * interval '1 minute'
     FROM (SELECT 'carga-s-' || i || '-' || s AS sid, now() - ((i + s) % 30) * interval '1 day' AS inicio
           FROM generate_series($1::int, $2::int) i, generate_series(1, $3::int) s) x,
          generate_series(1, $4::int) k, ej`,
    [desde, hasta, SESIONES_POR_NINO, INTENTOS_POR_SESION],
  );
}
await paso("ANALYZE", "ANALYZE");
console.log(`Listo en ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
await db.end();
