import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { ACCION_LABELS } from "@/lib/actividad";
import { Card, EmptyState } from "@/components/ui";
import { fmtDateShort, fmtTime } from "../_lib/dates";
import { isOsOwner, resolveOsRole } from "../_components/os-role";
import { ModuleDisabled } from "../_components/module-disabled";

/** Actividad — quién hizo qué y cuándo. Solo el dueño. */
export default async function ActividadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(osRole)) {
    return (
      <ModuleDisabled
        moduleLabel="Actividad"
        title="Solo el dueño ve la actividad"
        detail="Pedile acceso al dueño de la cuenta."
      />
    );
  }

  const filas = await db.actividad.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Actividad</h1>
        <p className="text-sm text-muted-foreground">
          Las acciones sensibles del sistema, con quién y cuándo. Últimas 100.
        </p>
      </div>

      {filas.length === 0 ? (
        <EmptyState
          icon="🕘"
          title="Sin actividad registrada"
          detail="Las acciones importantes (caja, ventas, taller, procesos) van quedando acá."
        />
      ) : (
        <Card className="p-0">
          <ul className="divide-y">
            {filas.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {ACCION_LABELS[f.accion] ?? f.accion}
                    {f.detalle ? <span className="text-muted-foreground"> — {f.detalle}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{f.usuario ?? "Sistema"}</p>
                </div>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {fmtDateShort(f.createdAt)} · {fmtTime(f.createdAt)} h
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
