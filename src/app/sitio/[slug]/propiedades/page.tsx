import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { SiteShell, siteContact } from "../_components/site-shell";
import { PropertyCard, type PublicListing } from "../_components/property-card";
import {
  OPERATIONS,
  PROPERTY_TYPES,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/app/os/[slug]/_lib/listings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Propiedades" };
  const b = tenantBranding(tenant);
  return {
    title: `Propiedades — ${b.displayName}`,
    robots: { index: false, follow: false },
  };
}

type SP = {
  q?: string;
  operation?: string;
  type?: string;
  barrio?: string;
  min?: string;
  max?: string;
  orden?: string;
};

export default async function SitioCatalogo({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();

  const contact = siteContact(tenant);
  const base = `/sitio/${tenant.slug}`;

  const q = (sp.q ?? "").trim();
  const op = (sp.operation ?? "").trim();
  const ty = (sp.type ?? "").trim();
  const barrio = (sp.barrio ?? "").trim();
  const ambientes = Number.parseInt(sp.min ?? "", 10); // "min" = ambientes mínimos
  const maxPrice = Number(sp.max?.replace(/[.,\s]/g, "") ?? "");
  const orden = sp.orden ?? "recientes";

  const where: Prisma.ListingWhereInput = {
    clientId: tenant.id,
    active: true,
    status: "disponible",
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { neighborhood: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(op && (OPERATIONS as readonly string[]).includes(op) ? { operation: op } : {}),
    ...(ty && (PROPERTY_TYPES as readonly string[]).includes(ty) ? { propertyType: ty } : {}),
    ...(barrio ? { neighborhood: { contains: barrio, mode: "insensitive" } } : {}),
    ...(Number.isInteger(ambientes) && ambientes > 0 ? { bedrooms: { gte: ambientes } } : {}),
    ...(Number.isFinite(maxPrice) && maxPrice > 0 ? { priceUsd: { lte: maxPrice } } : {}),
  };

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    orden === "precio_asc"
      ? { priceUsd: "asc" }
      : orden === "precio_desc"
        ? { priceUsd: "desc" }
        : { createdAt: "desc" };

  const listings = (await db.listing.findMany({
    where,
    orderBy,
    take: 60,
    select: {
      id: true,
      title: true,
      operation: true,
      propertyType: true,
      priceUsd: true,
      priceArs: true,
      neighborhood: true,
      city: true,
      bedrooms: true,
      bathrooms: true,
      areaM2: true,
      photos: true,
    },
  })) as PublicListing[];

  const inputCls =
    "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring";

  return (
    <SiteShell tenant={tenant} contact={contact}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Propiedades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {listings.length} propiedad{listings.length === 1 ? "" : "es"} disponible
          {listings.length === 1 ? "" : "s"}
        </p>

        {/* Filtros */}
        <form
          method="GET"
          className="mt-5 grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6"
        >
          <input name="q" defaultValue={q} placeholder="Buscar…" aria-label="Buscar" className={`${inputCls} sm:col-span-3 lg:col-span-2`} />
          <select name="operation" defaultValue={op} aria-label="Operación" className={inputCls}>
            <option value="">Operación</option>
            {OPERATIONS.map((o) => (
              <option key={o} value={o}>
                {OPERATION_LABELS[o]}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={ty} aria-label="Tipo" className={inputCls}>
            <option value="">Tipo</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input name="barrio" defaultValue={barrio} placeholder="Barrio" aria-label="Barrio" className={inputCls} />
          <input
            name="min"
            defaultValue={sp.min ?? ""}
            placeholder="Ambientes mín."
            aria-label="Ambientes mínimos"
            inputMode="numeric"
            className={inputCls}
          />
          <input
            name="max"
            defaultValue={sp.max ?? ""}
            placeholder="Precio máx. (USD)"
            aria-label="Precio máximo en dólares"
            inputMode="numeric"
            className={inputCls}
          />
          <select name="orden" defaultValue={orden} aria-label="Ordenar" className={inputCls}>
            <option value="recientes">Más recientes</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
          </select>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="h-10 flex-1 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Aplicar filtros
            </button>
            <a
              href={base + "/propiedades"}
              className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            >
              Limpiar
            </a>
          </div>
        </form>

        {/* Grid */}
        {listings.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <p className="text-2xl">🔍</p>
            <p className="mt-2 font-medium text-foreground">No encontramos propiedades</p>
            <p className="mt-1 text-sm">Probá ampliando los filtros o buscando otra zona.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <PropertyCard key={l.id} slug={tenant.slug} listing={l} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
