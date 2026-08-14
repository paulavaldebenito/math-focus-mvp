import { prisma } from "../db/prisma.js";

/**
 * Devuelve el perfil infantil solo si pertenece al adulto autenticado.
 * Centraliza esta verificación para que todas las rutas que tocan datos
 * de un niño apliquen el mismo control de acceso (rule: "un apoderado no
 * puede ver datos de un niño que no es suyo").
 */
export async function getOwnedChild(childId: string, adultUserId: string) {
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || child.adultUserId !== adultUserId) {
    return null;
  }
  return child;
}

/**
 * Devuelve la sesión de práctica solo si el niño dueño de esa sesión
 * pertenece al adulto autenticado. Mismo control de acceso que
 * `getOwnedChild`, para rutas identificadas por `sessionId` en vez de
 * `childId` (POST attempts/pause-events/complete).
 */
export async function getOwnedSession(sessionId: string, adultUserId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { childProfile: true },
  });
  if (!session || session.childProfile.adultUserId !== adultUserId) {
    return null;
  }
  return session;
}
