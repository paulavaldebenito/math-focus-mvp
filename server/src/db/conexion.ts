import { readFileSync } from "node:fs";
import type { ConnectionOptions } from "node:tls";

type Entorno = Record<string, string | undefined>;

/// Dirección de la base. En local y CI viene armada en `DATABASE_URL`. En AWS (specs/025) se
/// arma con piezas: la clave llega aparte desde Secrets Manager (`DB_PASSWORD`) y el resto son
/// propiedades normales del entorno, así la clave nunca queda escrita en la configuración.
export function urlBaseDatos(env: Entorno = process.env): string {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const { DB_HOST, DB_PORT = "5432", DB_NAME, DB_USER, DB_PASSWORD } = env;
  if (DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
    const usuario = encodeURIComponent(DB_USER);
    const clave = encodeURIComponent(DB_PASSWORD);
    return `postgres://${usuario}:${clave}@${DB_HOST}:${DB_PORT}/${encodeURIComponent(DB_NAME)}`;
  }
  throw new Error(
    "DATABASE_URL no está definida (ni DB_HOST, DB_NAME, DB_USER y DB_PASSWORD). Copia .env.example a .env.",
  );
}

/// Certificados raíz de RDS que `scripts/empaquetar-api.sh` deja junto al paquete.
const CA_RDS_POR_DEFECTO = new URL("../../certs/rds-global-bundle.pem", import.meta.url);

/// TLS hacia la base. RDS con Postgres 15+ exige TLS (`rds.force_ssl=1`). Con
/// `DB_SSL=verificar` se cifra y además se verifica el certificado del servidor contra los
/// certificados raíz de RDS (`DB_SSL_CA`, o el que trae el paquete), incluido el nombre del host.
/// Sin `DB_SSL` (local, CI) no se usa TLS, igual que antes.
export function sslBaseDatos(env: Entorno = process.env): ConnectionOptions | undefined {
  const modo = env.DB_SSL;
  if (!modo || modo === "no") return undefined;
  if (modo !== "verificar") {
    throw new Error(`DB_SSL="${modo}" no es válido: usa "verificar" o déjalo vacío.`);
  }
  const ca = readFileSync(env.DB_SSL_CA ?? CA_RDS_POR_DEFECTO, "utf8");
  return { ca, rejectUnauthorized: true };
}

/// Tamaño del pool por instancia. Sin definir queda el de `pg` (10). Ver specs/025 para el
/// cálculo con RDS: instancias × PG_POOL_MAX + margen ≤ max_connections.
export function tamanoPool(env: Entorno = process.env): number | undefined {
  if (!env.PG_POOL_MAX) return undefined;
  const n = Number(env.PG_POOL_MAX);
  if (!Number.isInteger(n) || n < 1) throw new Error(`PG_POOL_MAX="${env.PG_POOL_MAX}" debe ser un entero ≥ 1.`);
  return n;
}
