import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ButtonLink, Input, Select } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import {
  OPERATIONS,
  PROPERTY_TYPES,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
} from "../_lib/listings";
import { ListingsTable, type ListingRow } from "./_components/listings-table";
import { PublicSiteLink } from "./_components/public-site-link";

export default async function PropiedadesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; operation?: string; type?: string }>;
}) {
  const { slug } = await params;
  const { q, operation, type } = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "sitio")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.sitio} />;
  }

  const query = (q ?? "").trim();
  const op = (operation ?? "").trim();
  const ty = (type ?? "").trim();

  const listings = await db.listing.findMany({
    where: {
      clientId: tenant.id,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { neighborhood: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(op && (OPERATIONS as readonly string[]).includes(op) ? { operation: op } : {}),
      ...(ty && (PROPERTY_TYPES as readonly string[]).includes(ty) ? { propertyType: ty } : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      operation: true,
      propertyType: true,
      status: true,
      priceUsd: true,
      priceArs: true,
      neighborhood: true,
      city: true,
      photos: true,
      featured: true,
      active: true,
    },
  });

  const rows: ListingRow[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    operation: l.operation,
    propertyType: l.propertyType,
    status: l.status,
    priceUsd: l.priceUsd,
    priceArs: l.priceArs,
    neighborhood: l.neighborhood,
    city: l.city,
    photo: l.photos[0] ?? null,
    featured: l.featured,
    active: l.active,
  }));

  const base = `/os/${tenant.slug}`;
  const filtering = Boolean(query || op || ty);

  return (
    <div className="space-y-4">
      <PublicSiteLink slug={tenant.slug} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Propiedades</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} propiedad{rows.length === 1 ? "" : "es"}
            {filtering ? " con esos filtros" : " en tu cartera"}
          </p>
        </div>
        <ButtonLink href={`${base}/propiedades/nueva`} size="sm">
          + Propiedad
        </ButtonLink>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar por título, barrio, ciudad…"
            aria-label="Buscar propiedades"
          />
        </div>
        <Select name="operation" defaultValue={op} aria-label="Filtrar por operación" className="w-auto">
          <option value="">Toda operación</option>
          {OPERATIONS.map((o) => (
            <option key={o} value={o}>
              {OPERATION_LABELS[o]}
            </option>
          ))}
        </Select>
        <Select name="type" defaultValue={ty} aria-label="Filtrar por tipo" className="w-auto">
          <option value="">Todo tipo</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
        <button
          type="submit"
          className="h-10 shrink-0 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Filtrar
        </button>
      </form>

      <ListingsTable slug={tenant.slug} listings={rows} filtering={filtering} />
    </div>
  );
}
