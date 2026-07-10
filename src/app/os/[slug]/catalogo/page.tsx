import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ButtonLink, Input } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { CatalogTable, type CatalogProduct } from "../_components/catalog-table";

export default async function CatalogoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "catalogo")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.catalogo} />;
  }

  const query = (q ?? "").trim();
  const products = await db.product.findMany({
    where: {
      clientId: tenant.id,
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      priceArs: true,
      priceUsd: true,
      stock: true,
      minStock: true,
      talles: true,
      active: true,
    },
  });

  const base = `/os/${tenant.slug}`;
  const rows: CatalogProduct[] = products.map((p) => ({
    ...p,
    talles: (p.talles as Record<string, number> | null) ?? null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Catálogo & Stock</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} producto{products.length === 1 ? "" : "s"}
            {query ? ` para “${query}”` : " en tu catálogo"}
          </p>
        </div>
        <ButtonLink href={`${base}/catalogo/nuevo`} size="sm">
          + Producto
        </ButtonLink>
      </div>

      <form method="GET" className="flex max-w-md gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre…"
          aria-label="Buscar productos"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Buscar
        </button>
      </form>

      <CatalogTable slug={tenant.slug} products={rows} searching={Boolean(query)} />
    </div>
  );
}
