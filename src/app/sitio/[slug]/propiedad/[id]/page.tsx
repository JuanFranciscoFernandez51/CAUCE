import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { SiteShell, siteContact } from "../../_components/site-shell";
import { Gallery } from "../../_components/gallery";
import { ConsultaForm } from "../../_components/consulta-form";
import {
  opLabel,
  typeLabel,
  statusLabel,
  fmtListingPrice,
  fmtExpenses,
} from "@/app/os/[slug]/_lib/listings";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Propiedad" };
  const listing = await db.listing.findFirst({
    where: { id, clientId: tenant.id, active: true },
    select: { title: true },
  });
  const b = tenantBranding(tenant);
  return {
    title: listing ? `${listing.title} — ${b.displayName}` : `Propiedad — ${b.displayName}`,
    robots: { index: false, follow: false },
  };
}

export default async function PropiedadDetalle({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();

  const listing = await db.listing.findFirst({
    where: { id, clientId: tenant.id, active: true },
  });
  if (!listing) notFound();

  const contact = siteContact(tenant);
  const base = `/sitio/${tenant.slug}`;
  const place = [listing.neighborhood, listing.city].filter(Boolean).join(", ");

  const specs: { label: string; value: string }[] = [];
  if (listing.bedrooms != null) specs.push({ label: "Ambientes", value: String(listing.bedrooms) });
  if (listing.bathrooms != null) specs.push({ label: "Baños", value: String(listing.bathrooms) });
  if (listing.areaM2 != null) specs.push({ label: "Sup. total", value: `${listing.areaM2} m²` });
  if (listing.coveredM2 != null) specs.push({ label: "Sup. cubierta", value: `${listing.coveredM2} m²` });

  return (
    <SiteShell tenant={tenant} contact={contact}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href={base} className="hover:text-foreground">
            Inicio
          </Link>{" "}
          /{" "}
          <Link href={`${base}/propiedades`} className="hover:text-foreground">
            Propiedades
          </Link>{" "}
          / <span className="text-foreground">{listing.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Columna principal */}
          <div className="space-y-6">
            <Gallery photos={listing.photos} title={listing.title} />

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                {opLabel(listing.operation)}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
                {typeLabel(listing.propertyType)}
              </span>
              {listing.status !== "disponible" ? (
                <span className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                  {statusLabel(listing.status)}
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{listing.title}</h1>
              {place ? <p className="mt-1 text-muted-foreground">{place}</p> : null}
              {listing.address ? (
                <p className="text-sm text-muted-foreground">{listing.address}</p>
              ) : null}
            </div>

            {specs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {specs.map((s) => (
                  <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {listing.description ? (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground">
                  {listing.description}
                </p>
              </div>
            ) : null}

            {listing.amenities.length > 0 ? (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Características</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border bg-card px-3 py-1 text-sm capitalize"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Mapa placeholder (solo texto) */}
            {place || listing.address ? (
              <div>
                <h2 className="mb-2 text-lg font-semibold">Ubicación</h2>
                <div className="flex items-center gap-3 rounded-xl border bg-muted p-4 text-sm">
                  <span className="text-2xl">📍</span>
                  <div>
                    {listing.address ? <p className="font-medium">{listing.address}</p> : null}
                    {place ? <p className="text-muted-foreground">{place}</p> : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar: precio + consulta */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-3xl font-bold tabular-nums text-primary">
                {fmtListingPrice({ priceUsd: listing.priceUsd, priceArs: listing.priceArs })}
              </p>
              {listing.priceUsd != null && listing.priceArs != null ? (
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {fmtExpenses(listing.priceArs)} ARS
                </p>
              ) : null}
              {listing.expensesArs != null ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  + {fmtExpenses(listing.expensesArs)} de expensas
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 text-lg font-semibold">Consultá por esta propiedad</h2>
              <ConsultaForm slug={tenant.slug} listingId={listing.id} propTitle={listing.title} />
              {contact.whatsapp ? (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                    `Hola, quiero consultar por "${listing.title}".`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-primary font-medium text-primary hover:bg-primary-soft"
                >
                  O escribinos por WhatsApp
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
