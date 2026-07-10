import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { IngresoForm } from "./ingreso-form";

export default async function NuevaOtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "taller")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.taller} />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo ingreso</h1>
        <p className="text-sm text-muted-foreground">
          El cliente queda cargado en el CRM automáticamente.
        </p>
      </div>
      <IngresoForm slug={tenant.slug} />
    </div>
  );
}
