import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  getTenantBySlug,
  hasModule,
  tenantCustomFields,
  MODULE_LABELS,
} from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { AppointmentForm } from "../../_components/appointment-form";

export default async function NuevoTurnoPage({
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

  // Misma tabla Contact que el CRM: si el CRM está activo, lo que crees acá aparece allá.
  const contacts = await db.contact.findMany({
    where: { clientId: tenant.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });

  // Recursos (empleados activos) para asignar el turno; opcional.
  const employees = await db.employee.findMany({
    where: { clientId: tenant.id, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const customDefs = tenantCustomFields(tenant).appointment ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo turno</h1>
        <p className="text-sm text-muted-foreground">
          Los horarios que se muestran son los huecos libres según tu disponibilidad.
        </p>
      </div>
      <AppointmentForm
        slug={tenant.slug}
        contacts={contacts}
        employees={employees}
        customDefs={customDefs}
      />
    </div>
  );
}
