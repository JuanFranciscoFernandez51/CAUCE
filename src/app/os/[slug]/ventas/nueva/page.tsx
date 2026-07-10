import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { VentaForm } from "./venta-form";

export default async function NuevaVentaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "ventas")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.ventas} />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nueva venta</h1>
        <p className="text-sm text-muted-foreground">
          El comprador queda en el CRM como caliente, automáticamente.
        </p>
      </div>
      <VentaForm slug={tenant.slug} />
    </div>
  );
}
