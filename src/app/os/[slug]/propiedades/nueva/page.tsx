import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { storageAvailable } from "@/lib/storage";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ListingForm } from "../_components/listing-form";

export default async function NuevaPropiedadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "sitio")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.sitio} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nueva propiedad</h1>
        <p className="text-sm text-muted-foreground">
          Apenas la guardes aparece en tu sitio público (si está activa).
        </p>
      </div>
      <ListingForm slug={tenant.slug} storageOk={storageAvailable()} />
    </div>
  );
}
