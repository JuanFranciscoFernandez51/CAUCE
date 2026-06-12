import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantCustomFields, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { customToValues } from "../../_components/custom-fields";
import { ProductForm } from "../../_components/product-form";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "catalogo")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.catalogo} />;
  }

  // Scopeado por clientId: un producto de otro tenant da 404.
  const product = await db.product.findFirst({
    where: { id: productId, clientId: tenant.id },
    select: {
      id: true,
      name: true,
      priceArs: true,
      priceUsd: true,
      stock: true,
      minStock: true,
      custom: true,
    },
  });
  if (!product) notFound();

  const customDefs = tenantCustomFields(tenant).product ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Editar producto</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm
        slug={tenant.slug}
        customDefs={customDefs}
        product={{
          id: product.id,
          name: product.name,
          priceArs: product.priceArs,
          priceUsd: product.priceUsd,
          stock: product.stock,
          minStock: product.minStock,
          custom: customToValues(product.custom),
        }}
      />
    </div>
  );
}
