import { notFound } from "next/navigation";
import type { Client } from "@prisma/client";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../_components/module-disabled";
import { isOsOwner, resolveOsRole } from "../_components/os-role";

/**
 * Acceso común a TODAS las pantallas de Finanzas: tenant por slug, módulo
 * "caja" activo y rol de DUEÑO (el equipo no ve la plata).
 */
export async function accesoCaja(
  slug: string
): Promise<{ ok: true; tenant: Client } | { ok: false; denied: ReactNode }> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "caja")) {
    return { ok: false, denied: <ModuleDisabled moduleLabel={MODULE_LABELS.caja} /> };
  }
  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(osRole)) {
    return {
      ok: false,
      denied: (
        <ModuleDisabled
          moduleLabel={MODULE_LABELS.caja}
          title="No tenés acceso a Finanzas"
          detail="Pedile acceso al dueño de la cuenta."
        />
      ),
    };
  }
  return { ok: true, tenant };
}
