import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { sslBaseDatos, tamanoPool, urlBaseDatos } from "./conexion.js";

const connectionString = urlBaseDatos();

// `prisma dev` (PGlite) es una sola sesión de Postgres para todas las conexiones: dos conexiones
// preparando consultas a la vez se pisan («bind message supplies N parameters»). En local se usa
// PG_POOL_MAX=1 (ver .env.example); en CI queda el valor por defecto y en AWS lo fija el entorno
// (specs/025).
const max = tamanoPool();

export const pool = new pg.Pool({
  connectionString,
  max,
  ssl: sslBaseDatos(),
  // Si la base no responde, la petición falla en 10 s en vez de quedar colgada para siempre.
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
