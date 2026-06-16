import { db } from "@/lib/db";

/**
 * Rol efectivo DENTRO del software del tenant.
 * - "admin": ADMIN de Cauce (Fran) — puede todo, siempre.
 * - "dueno": dueño de la cuenta del tenant.
 * - "equipo": usuario del equipo (acceso operativo, sin caja ni configuración).
 * Se lee SIEMPRE de la DB (no del JWT) para no confiar en el cliente.
 */
export type OsRole = "admin" | "dueno" | "equipo";

export async function resolveOsRole(
  userId: string,
  tenantId: string
): Promise<OsRole | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, osRole: true, clientId: true },
  });
  if (!user) return null;
  if (user.role === "ADMIN") return "admin";
  if (user.clientId !== tenantId) return null;
  return user.osRole === "equipo" ? "equipo" : "dueno";
}

/** ¿Puede administrar el OS (caja, configuración, pausar automatizaciones)? */
export function isOsOwner(role: OsRole | null): boolean {
  return role === "admin" || role === "dueno";
}
