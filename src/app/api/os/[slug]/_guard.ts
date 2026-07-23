import { NextResponse } from "next/server";
import type { Client } from "@prisma/client";
import { auth } from "@/lib/auth";
import { assertTenantAccess, getTenantBySlug, hasModule, type OsModule } from "@/lib/tenant";
import { isOsOwner, resolveOsRole } from "@/app/os/[slug]/_components/os-role";

/**
 * Guard estándar de TODA API de Cauce OS:
 * sesión → tenant por slug → assertTenantAccess (→ 403) → módulo activo.
 * Devuelve { tenant } o { error: NextResponse } listo para retornar.
 */
export async function guardOsApi(
  slug: string,
  requiredModule?: OsModule
): Promise<{ tenant: Client; error?: never } | { tenant?: never; error: NextResponse }> {
  const session = await auth();
  if (!session) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return { error: NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 }) };
  }
  try {
    assertTenantAccess({
      role: session.user.role,
      userClientId: session.user.clientId,
      tenantId: tenant.id,
    });
  } catch {
    return { error: NextResponse.json({ error: "Sin acceso a este sistema" }, { status: 403 }) };
  }
  if (requiredModule && !hasModule(tenant, requiredModule)) {
    return {
      error: NextResponse.json(
        { error: "Este módulo no está activado — hablá con Cauce para sumarlo" },
        { status: 403 }
      ),
    };
  }
  return { tenant };
}

/**
 * Guard de APIs SOLO-DUEÑO (ej: Finanzas): guard estándar + exige isOsOwner.
 */
export async function guardOsOwnerApi(
  slug: string,
  requiredModule?: OsModule
): Promise<{ tenant: Client; error?: never } | { tenant?: never; error: NextResponse }> {
  const guard = await guardOsApi(slug, requiredModule);
  if (guard.error) return guard;
  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, guard.tenant.id) : null;
  if (!isOsOwner(osRole)) {
    return { error: NextResponse.json({ error: "Sin acceso a Finanzas" }, { status: 403 }) };
  }
  return guard;
}

/** Custom fields: objeto plano clave→string|number. */
export function cleanCustom(
  custom: Record<string, string | number> | undefined
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!custom) return out;
  for (const [k, v] of Object.entries(custom)) {
    if (v === "" || v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}
