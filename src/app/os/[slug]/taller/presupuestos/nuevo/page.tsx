import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../../_components/module-disabled";
import { PresupuestoForm } from "./presupuesto-form";

export default async function NuevoPresupuestoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "taller")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.taller} />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo presupuesto</h1>
        <p className="text-sm text-muted-foreground">
          El interesado queda en el CRM como caliente, automáticamente.
        </p>
      </div>
      <PresupuestoForm slug={tenant.slug} />
    </div>
  );
}
