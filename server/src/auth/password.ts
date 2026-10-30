import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const KEY_LENGTH = 64;
const scryptAsync = promisify(scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

/// Hash con scrypt (módulo nativo de Node, sin dependencias externas). Asíncrono a propósito:
/// cada cálculo toma ~60 ms, y la versión síncrona (scryptSync) detenía el servidor completo
/// mientras tanto — ninguna otra familia recibía respuesta y el tope era ~16 logins/s por
/// proceso (specs/024). Así corre en el pool de hilos de libuv y el servidor sigue atendiendo.
/// Mismos parámetros que antes: los hashes ya guardados siguen siendo válidos.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derivedKey.length) return false;
  return timingSafeEqual(derivedKey, keyBuffer);
}
