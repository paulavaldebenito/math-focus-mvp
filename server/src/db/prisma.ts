import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida. Copia .env.example a .env.");
}

// `prisma dev` (PGlite) es una sola sesión de Postgres para todas las conexiones: dos conexiones
// preparando consultas a la vez se pisan («bind message supplies N parameters»). En local se usa
// PG_POOL_MAX=1 (ver .env.example); en CI y en AWS (Postgres real) queda el valor por defecto.
const max = process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : undefined;

export const pool = new pg.Pool({ connectionString, max });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
