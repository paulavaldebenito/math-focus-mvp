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
