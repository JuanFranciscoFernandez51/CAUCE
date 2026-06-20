import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { resolveOsRole, isOsOwner } from "../_components/os-role";
import { ModuleDisabled } from "../_components/module-disabled";
import { TeamSection } from "../_components/config-panel";

export const dynamic = "force-dynamic";

export default async function UsuariosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(role)) {
    return (
      <ModuleDisabled
        moduleLabel="Usuarios"
        title="Usuarios del equipo"
        detail="Solo el dueño de la cuenta puede gestionar los usuarios. Pedile acceso si lo necesitás."
      />
    );
  }

  const users = await db.user.findMany({
    where: { clientId: tenant.id },
    select: { id: true, name: true, username: true, osRole: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Quién entra a tu sistema y con qué permisos. Sumá a tu equipo.
        </p>
      </div>
      <TeamSection
        slug={slug}
        meId={session!.user.id}
        initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
      />
    </div>
  );
}
