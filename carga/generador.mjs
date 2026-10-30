#!/usr/bin/env node
/**
 * Generador de carga de Eureka (specs/024) — Node ≥ 20, sin dependencias.
 *
 * Cada usuario virtual hace el recorrido real de un niño: login de su familia, inicio, mapa,
 * empieza una práctica, responde 6 preguntas (incluidas «detecta el error» y «encuentra el
 * paso») con una pausa para pensar entre cada una, cierra la práctica y vuelve a empezar.
 *
 *   node carga/generador.mjs --escenario humo
 *   node carga/generador.mjs --escenario carga    --usuarios 200 --duracion 300
 *   node carga/generador.mjs --escenario estres   --usuarios 1000
 *   node carga/generador.mjs --escenario desgaste --usuarios 100 --duracion 1800 --pid <pid servidor>
 *
 * Opciones: --url (http://localhost:4200) · --familias (100000, cuentas carga.<i>@example.test de
 * server/prisma/carga/sembrar-volumen.ts) · --pausa (segundos para pensar, 8) · --rampa (s) ·
 * --salida resultado.json · --pid (muestrea la memoria RSS del servidor, para el desgaste).
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const ESCENARIOS = {
  humo: { usuarios: 5, duracion: 30, rampa: 5 },
  carga: { usuarios: 100, duracion: 300, rampa: 60 },
  estres: { usuarios: 1000, duracion: 0, rampa: 0 },
  desgaste: { usuarios: 50, duracion: 1800, rampa: 60 },
};
const escenario = args.escenario ?? "humo";
if (!ESCENARIOS[escenario]) throw new Error(`Escenario desconocido: ${escenario}`);
const cfg = {
  url: args.url ?? "http://localhost:4200",
  familias: Number(args.familias ?? 100_000),
  pausa: Number(args.pausa ?? 8),
  ...ESCENARIOS[escenario],
  ...(args.usuarios && { usuarios: Number(args.usuarios) }),
  ...(args.duracion && { duracion: Number(args.duracion) }),
  ...(args.rampa && { rampa: Number(args.rampa) }),
};
const CLAVE = "carga-de-prueba-1234";

// ---------- métricas ----------
const metricas = new Map(); // ruta → { lat: number[], errores, porCodigo }
let ventana = { peticiones: 0, errores: 0, lat: [] };
const registrar = (ruta, ms, status) => {
  const m = metricas.get(ruta) ?? { lat: [], errores: 0, porCodigo: {} };
  m.lat.push(ms);
  m.porCodigo[status] = (m.porCodigo[status] ?? 0) + 1;
  const error = status === 0 || status >= 500 || status === 429;
  if (error) m.errores++;
  metricas.set(ruta, m);
  ventana.peticiones++;
  ventana.lat.push(ms);
  if (error) ventana.errores++;
};
const pct = (xs, p) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

// ---------- cliente HTTP con cookie ----------
async function pedir(vu, metodo, ruta, etiqueta, body) {
  const t = performance.now();
  let status = 0;
  try {
    const res = await fetch(cfg.url + ruta, {
      method: metodo,
      headers: { ...(body && { "Content-Type": "application/json" }), ...(vu.cookie && { cookie: vu.cookie }) },
      body: body && JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    status = res.status;
    const sc = res.headers.get("set-cookie");
    if (sc) vu.cookie = sc.split(";")[0];
    const data = status === 204 ? null : await res.json().catch(() => null);
    registrar(etiqueta, performance.now() - t, status);
    return { status, data };
  } catch {
    registrar(etiqueta, performance.now() - t, status);
    return { status, data: null };
  }
}

let activo = true;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
// Pausa para pensar con variación (±50 %), como un niño real.
const pensar = () => dormir(cfg.pausa * 1000 * (0.5 + Math.random()));

async function usuarioVirtual(n) {
  const vu = { cookie: null };
  const familia = 1 + Math.floor(Math.random() * cfg.familias);
  const login = await pedir(vu, "POST", "/api/auth/login", "POST /auth/login", { email: `carga.${familia}@example.test`, password: CLAVE });
  if (login.status !== 200) return;
  const hijos = await pedir(vu, "GET", "/api/children", "GET /children");
  const nino = hijos.data?.children?.[0];
  if (!nino) return;
  while (activo && vu.activo !== false) {
    await pedir(vu, "GET", `/api/children/${nino.id}/home`, "GET /children/:id/home");
    await pedir(vu, "GET", `/api/children/${nino.id}/skill-path`, "GET /children/:id/skill-path");
    const sesion = await pedir(vu, "POST", `/api/children/${nino.id}/sessions`, "POST /children/:id/sessions");
    const sessionId = sesion.data?.sessionId;
    if (!sessionId) { await pensar(); continue; }
    for (let q = 0; q < 6 && activo && vu.activo !== false; q++) {
      const ej = await pedir(vu, "GET", `/api/children/${nino.id}/next-exercise?sessionId=${sessionId}`, "GET /children/:id/next-exercise");
      const e = ej.data;
      if (!e?.id) break;
      await pensar();
      if (e.mode === "spot_error") {
        await pedir(vu, "POST", `/api/sessions/${sessionId}/spot-error-attempts`, "POST /sessions/:id/spot-error-attempts",
          { exerciseId: e.id, wrongOptionId: e.wrongOptionId, chosenCode: e.explanationOptions[0] });
      } else if (e.mode === "find_step") {
        await pedir(vu, "POST", `/api/sessions/${sessionId}/find-step-attempts`, "POST /sessions/:id/find-step-attempts",
          { exerciseId: e.id, wrongOptionId: e.wrongOptionId, chosenLine: e.lines.length - 1 });
      } else {
        const opcion = e.options[Math.floor(Math.random() * e.options.length)];
        await pedir(vu, "POST", `/api/sessions/${sessionId}/attempts`, "POST /sessions/:id/attempts",
          { exerciseId: e.id, selectedOptionId: opcion.id, responseTimeMs: 3000 + Math.floor(Math.random() * 9000) });
      }
    }
    await pedir(vu, "POST", `/api/sessions/${sessionId}/complete`, "POST /sessions/:id/complete");
    await pedir(vu, "GET", `/api/children/${nino.id}/progress`, "GET /children/:id/progress");
    await pensar();
  }
}

// ---------- memoria del servidor (desgaste) ----------
const memoria = [];
const rssMb = () => {
  if (!args.pid) return null;
  try { return Math.round(Number(execFileSync("ps", ["-o", "rss=", "-p", args.pid]).toString().trim()) / 1024); } catch { return null; }
};

// ---------- reporte ----------
const inicio = Date.now();
let usuariosActivos = 0;
const serie = [];
function tick() {
  const s = Math.round((Date.now() - inicio) / 1000);
  const rps = ventana.peticiones / 10;
  const fila = { s, usuarios: usuariosActivos, rps: +rps.toFixed(1), p50: Math.round(pct(ventana.lat, 50)), p95: Math.round(pct(ventana.lat, 95)),
    errores: ventana.errores, rssMb: rssMb() };
  serie.push(fila);
  if (fila.rssMb) memoria.push(fila.rssMb);
  console.log(`[${String(s).padStart(5)} s] usuarios ${String(fila.usuarios).padStart(5)} · ${String(fila.rps).padStart(6)} pet/s · p50 ${fila.p50} ms · p95 ${fila.p95} ms · errores ${fila.errores}${fila.rssMb ? ` · RSS ${fila.rssMb} MB` : ""}`);
  ventana = { peticiones: 0, errores: 0, lat: [] };
  return fila;
}

function resumen() {
  const filas = [...metricas.entries()].map(([ruta, m]) => ({
    ruta, peticiones: m.lat.length, errores: m.errores, p50: Math.round(pct(m.lat, 50)), p95: Math.round(pct(m.lat, 95)), p99: Math.round(pct(m.lat, 99)), codigos: m.porCodigo,
  })).sort((a, b) => b.p95 - a.p95);
  console.log("\nruta".padEnd(44) + "pet.".padStart(8) + "err.".padStart(7) + "p50".padStart(8) + "p95".padStart(8) + "p99".padStart(8));
  for (const f of filas) console.log(f.ruta.padEnd(43) + String(f.peticiones).padStart(8) + String(f.errores).padStart(7) + `${f.p50}`.padStart(8) + `${f.p95}`.padStart(8) + `${f.p99}`.padStart(8));
  return filas;
}

// ---------- escenarios ----------
const vus = [];
const lanzar = () => { const vu = usuarioVirtual(vus.length); usuariosActivos++; vus.push(vu.finally(() => usuariosActivos--)); };
const reloj = setInterval(tick, 10_000);
console.log(`Escenario «${escenario}» contra ${cfg.url}: ${JSON.stringify(cfg)}`);

let quiebre = null;
if (escenario === "estres") {
  // Sube por escalones de 60 s hasta que se rompa: >5 % de errores o p95 > 2 s.
  for (const escalon of [10, 25, 50, 100, 200, 400, 700, 1000, 1500, 2000, 3000].filter((u) => u <= cfg.usuarios)) {
    while (usuariosActivos < escalon) lanzar();
    const antes = serie.length;
    await dormir(60_000);
    const ult = serie.slice(antes);
    const pet = ult.reduce((a, f) => a + f.rps * 10, 0);
    const err = ult.reduce((a, f) => a + f.errores, 0);
    const p95 = Math.max(...ult.map((f) => f.p95));
    console.log(`→ escalón ${escalon} usuarios: ${(pet / 60).toFixed(1)} pet/s, ${pet ? ((100 * err) / pet).toFixed(1) : 0}% errores, p95 máx ${p95} ms`);
    if ((pet && err / pet > 0.05) || p95 > 2000) { quiebre = { usuarios: escalon, petPorSeg: +(pet / 60).toFixed(1), p95, errores: err }; break; }
  }
} else {
  const paso = cfg.rampa > 0 ? (cfg.rampa * 1000) / cfg.usuarios : 0;
  for (let i = 0; i < cfg.usuarios; i++) { lanzar(); if (paso) await dormir(paso); }
  await dormir(cfg.duracion * 1000);
}
activo = false;
clearInterval(reloj);
tick();
const filas = resumen();
if (quiebre) console.log(`\n⚠️  Punto de quiebre: ${quiebre.usuarios} usuarios (~${quiebre.petPorSeg} pet/s, p95 ${quiebre.p95} ms).`);
if (memoria.length > 1) console.log(`Memoria del servidor: ${memoria[0]} MB al inicio → ${memoria.at(-1)} MB al final (máx ${Math.max(...memoria)} MB).`);
if (args.salida) writeFileSync(args.salida, JSON.stringify({ escenario, cfg, quiebre, serie, rutas: filas }, null, 2));
await Promise.race([Promise.allSettled(vus), dormir(35_000)]);
process.exit(0);
