import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { AvailabilityForm, type AvailabilityRow } from "../../_components/availability-form";

export default async function TurnosConfigPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "turnos")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.turnos} />;
  }

  const availability = await db.availability.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });

  const rows: AvailabilityRow[] = availability.map((a) => ({
    weekday: a.weekday,
    startTime: a.startTime,
    endTime: a.endTime,
    slotMinutes: a.slotMinutes,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Disponibilidad semanal</h1>
        <p className="text-sm text-muted-foreground">
          Estos horarios definen los huecos que se ofrecen al agendar turnos (acá y por el
          bot). Podés cargar hasta dos franjas por día, por ejemplo mañana y tarde.
        </p>
      </div>
      <AvailabilityForm slug={tenant.slug} initial={rows} />
    </div>
  );
}
