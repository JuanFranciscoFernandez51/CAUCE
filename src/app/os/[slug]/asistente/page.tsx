import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { aiAvailable } from "@/lib/anthropic";
import { getTenantBySlug, tenantBranding, tenantModules } from "@/lib/tenant";
import { Stat } from "@/components/ui";
import { buildTenantSummary } from "@/lib/asistente";
import { resolveOsRole, isOsOwner } from "../_components/os-role";
import { AsistenteChat } from "../_components/asistente-chat";

export const dynamic = "force-dynamic";

export default async function AsistentePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const branding = tenantBranding(tenant);
  const modules = tenantModules(tenant);

  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  const owner = isOsOwner(role);

  const summary = await buildTenantSummary(tenant, modules);
  const has = (m: (typeof modules)[number]) => modules.includes(m);

  // Sólo mostramos las métricas que aplican a sus módulos.
  const stats: { label: string; value: string | number; hint?: string }[] = [];
  if (has("crm")) stats.push({ label: "Contactos", value: summary.contactos, hint: "en el CRM" });
  if (has("turnos"))
    stats.push({ label: "Turnos próximos", value: summary.turnosProximos, hint: `${summary.turnosHoy} hoy` });
  if (has("catalogo")) stats.push({ label: "Productos activos", value: summary.productosActivos });
  if (has("sitio")) stats.push({ label: "Publicaciones activas", value: summary.propiedadesActivas });
  if (has("proyectos")) stats.push({ label: "Proyectos activos", value: summary.proyectosActivos });
  if (has("rrhh")) stats.push({ label: "Empleados activos", value: summary.empleadosActivos });
  if (owner && has("caja"))
    stats.push({ label: "Saldo en cuentas", value: `$${summary.saldoArs.toLocaleString("es-AR")}` });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Asistente</h1>
        <p className="text-sm text-muted-foreground">
          {owner
            ? "Conoce tu sistema, responde tus preguntas y propone cambios chicos para que vos confirmes."
            : "Conoce tu sistema y responde tus preguntas. Los cambios los hace el dueño."}
        </p>
      </div>

      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} hint={s.hint} />
          ))}
        </div>
      ) : null}

      <AsistenteChat
        slug={slug}
        isOwner={owner}
        aiAvailable={aiAvailable()}
        displayName={branding.displayName}
      />
    </div>
  );
}
