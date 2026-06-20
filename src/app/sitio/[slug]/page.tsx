import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { SiteShell, siteContact } from "./_components/site-shell";
import { PropertyCard, type PublicListing } from "./_components/property-card";

export const revalidate = 300; // ISR: cachea 5 min (la región gru1 + esto = páginas casi instantáneas)

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
    title: `${b.displayName} — Propiedades`,
    description: `Comprá o alquilá tu próxima propiedad con ${b.displayName}.`,
    robots: { index: false, follow: false },
  };
}

const CARD_SELECT = {
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
} as const;

export default async function SitioHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) notFound();

  const branding = tenantBranding(tenant);
  const contact = siteContact(tenant);
  const base = `/sitio/${tenant.slug}`;

  const [featured, ventas, alquileres] = await Promise.all([
    db.listing.findMany({
      where: { clientId: tenant.id, active: true, featured: true, status: "disponible" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: CARD_SELECT,
    }),
    db.listing.findMany({
      where: { clientId: tenant.id, active: true, operation: "venta", status: "disponible" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: CARD_SELECT,
    }),
    db.listing.findMany({
      where: {
        clientId: tenant.id,
        active: true,
        operation: { in: ["alquiler", "alquiler_temporal"] },
        status: "disponible",
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: CARD_SELECT,
    }),
  ]);

  return (
    <SiteShell tenant={tenant} contact={contact}>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary-soft to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            Encontrá tu próxima propiedad con {branding.displayName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Casas, departamentos y locales en venta y alquiler. Mirá nuestra cartera completa.
          </p>
          <form
            method="GET"
            action={`${base}/propiedades`}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <input
              type="search"
              name="q"
              placeholder="Buscá por barrio, ciudad o título…"
              aria-label="Buscar propiedades"
              className="h-12 flex-1 rounded-md border border-border bg-card px-4 text-base text-card-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
            />
            <button
              type="submit"
              className="h-12 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Destacadas */}
      {featured.length > 0 ? (
        <Section
          title="Propiedades destacadas"
          subtitle="Nuestra selección del momento"
          slug={tenant.slug}
          listings={featured}
          href={`${base}/propiedades`}
        />
      ) : null}

      {/* En venta */}
      {ventas.length > 0 ? (
        <Section
          title="En venta"
          slug={tenant.slug}
          listings={ventas}
          href={`${base}/propiedades?operation=venta`}
        />
      ) : null}

      {/* En alquiler */}
      {alquileres.length > 0 ? (
        <Section
          title="En alquiler"
          slug={tenant.slug}
          listings={alquileres}
          href={`${base}/propiedades?operation=alquiler`}
        />
      ) : null}

      {featured.length === 0 && ventas.length === 0 && alquileres.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">
          <p className="text-lg">Todavía no hay propiedades publicadas.</p>
          <p className="mt-1 text-sm">Volvé pronto: estamos sumando nuevas oportunidades.</p>
        </div>
      ) : null}

      {/* CTA contacto */}
      <section className="border-t bg-primary-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-12 text-center">
          <h2 className="text-2xl font-semibold">¿Buscás algo en particular?</h2>
          <p className="max-w-lg text-muted-foreground">
            Contanos qué necesitás y te ayudamos a encontrarlo.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link
              href={`${base}/propiedades`}
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 font-medium text-primary-foreground hover:opacity-90"
            >
              Ver todas las propiedades
            </Link>
            {contact.whatsapp ? (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center rounded-md border border-primary px-6 font-medium text-primary hover:bg-card"
              >
                Escribinos por WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Section({
  title,
  subtitle,
  slug,
  listings,
  href,
}: {
  title: string;
  subtitle?: string;
  slug: string;
  listings: PublicListing[];
  href: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <Link href={href} className="shrink-0 text-sm font-medium text-primary hover:underline">
          Ver todas →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <PropertyCard key={l.id} slug={slug} listing={l} />
        ))}
      </div>
    </section>
  );
}
