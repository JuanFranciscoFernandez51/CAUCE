import { notFound } from "next/navigation";
import { getTenantBySlug, hasModule, tenantCustomFields, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { ProductForm } from "../../_components/product-form";

export default async function NuevoProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "catalogo")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.catalogo} />;
  }

  const customDefs = tenantCustomFields(tenant).product ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">
          Se suma a tu catálogo activo apenas lo guardes.
        </p>
      </div>
      <ProductForm slug={tenant.slug} customDefs={customDefs} />
    </div>
  );
}
