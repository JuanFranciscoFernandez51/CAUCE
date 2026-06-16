import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug, tenantBranding } from "@/lib/tenant";
import { resolveOsRole, isOsOwner } from "../_components/os-role";
import { ModuleDisabled } from "../_components/module-disabled";
import { ConfigPanel } from "../_components/config-panel";

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
        title="Configuración del sistema"
        detail="Solo el dueño de la cuenta puede entrar acá. Pedile acceso si lo necesitás."
      />
    );
  }

  const [users, brandingRaw] = await Promise.all([
    db.user.findMany({
      where: { clientId: tenant.id },
      select: { id: true, name: true, username: true, osRole: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    Promise.resolve(tenantBranding(tenant)),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Tu equipo y la identidad de tu sistema. Los cambios se aplican al instante.
        </p>
      </div>
      <ConfigPanel
        slug={slug}
        meId={session!.user.id}
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        branding={{ displayName: brandingRaw.displayName, primary: brandingRaw.primary, accent: brandingRaw.accent }}
      />
    </div>
  );
}
