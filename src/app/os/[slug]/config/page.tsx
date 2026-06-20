import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug, tenantBranding } from "@/lib/tenant";
import { resolveOsRole, isOsOwner } from "../_components/os-role";
import { ModuleDisabled } from "../_components/module-disabled";
import { BrandingSection } from "../_components/config-panel";

export const dynamic = "force-dynamic";

export default async function ConfigPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(role)) {
    return (
      <ModuleDisabled
        moduleLabel="Configuración"
        title="Configuración de la página"
        detail="Solo el dueño de la cuenta puede entrar acá. Pedile acceso si lo necesitás."
      />
    );
  }

  const brandingRaw = tenantBranding(tenant);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de la página</h1>
        <p className="text-sm text-muted-foreground">
          La identidad de tu sistema: nombre y colores de tu marca. Los cambios se aplican al instante.
        </p>
      </div>
      <BrandingSection
        slug={slug}
        initial={{ displayName: brandingRaw.displayName, primary: brandingRaw.primary, accent: brandingRaw.accent }}
      />
    </div>
  );
}
