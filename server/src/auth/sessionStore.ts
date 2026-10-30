import { Store, type SessionData } from "express-session";
import { prisma } from "../db/prisma.js";

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/// Store de express-session sobre la tabla `http_session`, vía Prisma (specs/021). Pasa por el
/// mismo cliente que el resto de la app: un store con su propia conexión (connect-pg-simple)
/// intercalaba consultas con Prisma y rompía las pruebas sobre `prisma dev`.
export class PrismaSessionStore extends Store {
  constructor({ pruneIntervalMs }: { pruneIntervalMs: number | false }) {
    super();
    if (pruneIntervalMs) {
      // unref: el timer de limpieza no mantiene vivo el proceso.
      setInterval(() => void this.prune().catch(console.error), pruneIntervalMs).unref();
    }
  }

  private static expiresAt(sess: SessionData): Date {
    const expires = sess.cookie?.expires;
    return expires ? new Date(expires) : new Date(Date.now() + ONE_DAY_MS);
  }

  /// Borra las sesiones vencidas.
  async prune(): Promise<void> {
    await prisma.httpSession.deleteMany({ where: { expire: { lt: new Date() } } });
  }

  override get(sid: string, cb: (err: unknown, sess?: SessionData | null) => void): void {
    prisma.httpSession
      .findUnique({ where: { sid } })
      .then((row) => cb(null, row && row.expire > new Date() ? (row.sess as unknown as SessionData) : null))
      .catch(cb);
  }

  override set(sid: string, sess: SessionData, cb?: (err?: unknown) => void): void {
    const data = { sess: JSON.parse(JSON.stringify(sess)), expire: PrismaSessionStore.expiresAt(sess) };
    prisma.httpSession
      .upsert({ where: { sid }, create: { sid, ...data }, update: data })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }

  override touch(sid: string, sess: SessionData, cb?: (err?: unknown) => void): void {
    prisma.httpSession
      .updateMany({ where: { sid }, data: { expire: PrismaSessionStore.expiresAt(sess) } })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }

  override destroy(sid: string, cb?: (err?: unknown) => void): void {
    prisma.httpSession
      .deleteMany({ where: { sid } })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }
}
