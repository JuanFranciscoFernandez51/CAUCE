import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, tenantBranding } from "@/lib/tenant";
import { playbookForClient } from "@/lib/playbooks";
import { SiteShell, siteContact } from "./_components/site-shell";
import { PropertyCard, type PublicListing } from "./_components/property-card";
import { ProductCard, type PublicProduct } from "./_components/product-card";
import { ConsultaForm } from "./_components/consulta-form";
import { siteContent } from "./_lib/site-content";
import { DoohSite } from "./_components/dooh-site";

export const revalidate = 300; // ISR: cachea 5 min (gru1 + esto = páginas casi instantáneas)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return { title: "Sitio" };
  const b = tenantBranding(tenant);
  const pb = playbookForClient(tenant);
  return {
    title: b.displayName,
    description: pb.heroSubtitle,
    robots: { index: false, follow: false }, // noindex por ahora (brief)
    openGraph: { title: b.displayName, description: pb.heroSubtitle },
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

  // Template DOOH (pantallas LED): página propia, dark, con disponibilidad en vivo.
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  if (tpl === "dooh") {
    const pantallasDb = await db.pantalla.findMany({
      where: { clientId: tenant.id, activa: true },
      orderBy: { orden: "asc" },
      include: {
        contratos: { where: { estado: "activo" }, select: { slots: true } },
      },
    });
    return (
      <DoohSite
        tenant={tenant}
        pantallas={pantallasDb.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          zona: p.zona,
          medidas: p.medidas,
          resolucion: p.resolucion,
          fotoUrl: p.fotoUrl,
          libres: Math.max(0, p.slotsTotal - p.contratos.reduce((a, c) => a + c.slots, 0)),
        }))}
      />
    );
  }

  const branding = tenantBranding(tenant);
  const contact = siteContact(tenant);
  const playbook = playbookForClient(tenant);
  const content = siteContent(tenant, playbook);
  const base = `/sitio/${tenant.slug}`;

  const esInmobiliaria = playbook.key === "inmobiliaria";
  const tieneCatalogo = hasModule(tenant, "catalogo") && !esInmobiliaria;
  const tieneTurnos = hasModule(tenant, "turnos");

  // Contenido extra de settings: fotos reales y horarios.
  const settings = (tenant.settings as { fotos?: string[]; horarios?: string } | null) ?? {};
  const fotos = (settings.fotos ?? []).filter(Boolean);
  const horarios = settings.horarios?.trim() ?? "";
  const eventoActivo = hasModule(tenant, "eventos")
    ? await db.evento.findFirst({
        where: { clientId: tenant.id, activo: true },
        select: { nombre: true, fecha: true, lugar: true },
      })
    : null;

  // Cargas condicionales, todas scopeadas por clientId, nunca rompen si no hay datos.
  const [featuredListings, featuredProducts] = await Promise.all([
    esInmobiliaria
      ? db.listing.findMany({
          where: { clientId: tenant.id, active: true, status: "disponible" },
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          take: 6,
          select: CARD_SELECT,
        })
      : Promise.resolve([] as PublicListing[]),
    tieneCatalogo
      ? db.product.findMany({
          where: { clientId: tenant.id, active: true },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, name: true, priceUsd: true, priceArs: true, photo: true },
        })
      : Promise.resolve([] as PublicProduct[]),
  ]);

  return (
    <SiteShell
      tenant={tenant}
      contact={contact}
      tagline={content.heroSubtitle}
      nav={{
        propiedades: esInmobiliaria,
        turnos: tieneTurnos,
        catalogoLabel: tieneCatalogo ? content.catalogoTitle : undefined,
      }}
    >
      {/* ── Hero institucional (todos los rubros) ── */}
      <section className="border-b bg-gradient-to-b from-primary-soft to-background">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            {branding.displayName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {content.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {esInmobiliaria ? (
              <Link
                href={`${base}/propiedades`}
                className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Ver propiedades
              </Link>
            ) : null}
            {tieneTurnos ? (
              <Link
                href={`/agendar/${tenant.slug}`}
                className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Reservá tu turno
              </Link>
            ) : null}
            <a
              href="#contacto"
              className="inline-flex h-12 items-center rounded-md border border-primary px-6 text-base font-medium text-primary transition-colors hover:bg-card"
            >
              Contactanos
            </a>
          </div>
        </div>
      </section>

      {/* ── Qué hacemos / Servicios (todos los rubros) ── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {content.serviciosTitle}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.servicios.map((s, i) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{s.titulo}</h3>
              {s.detalle ? (
                <p className="mt-1.5 text-sm text-muted-foreground">{s.detalle}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* ── Propiedades destacadas (inmobiliaria) ── */}
      {esInmobiliaria && featuredListings.length > 0 ? (
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Propiedades destacadas</h2>
                <p className="text-sm text-muted-foreground">Nuestra selección del momento</p>
              </div>
              <Link
                href={`${base}/propiedades`}
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Ver todas →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.map((l) => (
                <PropertyCard key={l.id} slug={tenant.slug} listing={l} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Catálogo / Carta (tenant con productos) ── */}
      {tieneCatalogo && featuredProducts.length > 0 ? (
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">{content.catalogoTitle}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Reservá tu turno (tenant con turnos) ── */}
      {tieneTurnos ? (
        <section className="border-t bg-primary-soft">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-14 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Reservá tu {playbook.glossary.appointment} online
            </h2>
            <p className="max-w-lg text-muted-foreground">
              Elegí día, horario y profesional en pocos pasos. Sin llamados ni esperas.
            </p>
            <Link
              href={`/agendar/${tenant.slug}`}
              className="mt-2 inline-flex h-12 items-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Reservar ahora
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Sobre nosotros (si hay texto en settings) ── */}
      {content.sobre ? (
        <section className="border-t">
          <div className="mx-auto max-w-3xl px-4 py-14">
            <h2 className="text-2xl font-semibold tracking-tight">Sobre nosotros</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {content.sobre}
            </p>
          </div>
        </section>
      ) : null}

      {/* ── Galería de fotos reales (settings.fotos) ── */}
      {fotos.length > 0 ? (
        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-center text-2xl font-semibold tracking-tight">El local, por dentro</h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {fotos.slice(0, 6).map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={f}
                  alt={`${branding.displayName} — foto ${i + 1}`}
                  loading="lazy"
                  className={`w-full rounded-xl border object-cover ${i === 0 ? "col-span-2 row-span-2 h-full min-h-64" : "h-40 sm:h-48"}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Horarios + ubicación ── */}
      {horarios || contact.address ? (
        <section className="border-t">
          <div className="mx-auto grid max-w-4xl gap-8 px-4 py-14 sm:grid-cols-2">
            {horarios ? (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold">🕒 Horarios</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {horarios}
                </p>
              </div>
            ) : null}
            {contact.address ? (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold">📍 Dónde estamos</h2>
                <p className="mt-2 text-sm text-muted-foreground">{contact.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Cómo llegar (Google Maps) →
                </a>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── Evento activo (si el módulo está) ── */}
      {eventoActivo ? (
        <section className="border-t bg-primary-soft">
          <div className="mx-auto max-w-3xl px-4 py-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Próximo evento</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{eventoActivo.nombre}</h2>
            <p className="mt-1 text-muted-foreground">
              {eventoActivo.fecha.split("-").reverse().join("/")}
              {eventoActivo.lugar ? ` · ${eventoActivo.lugar}` : ""}
            </p>
            <Link
              href={`/evento/${tenant.slug}`}
              className="mt-5 inline-flex h-12 items-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Inscribirme / Ver ranking en vivo →
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Contacto (siempre) — cae al CRM ── */}
      <section id="contacto" className="scroll-mt-16 border-t bg-muted/40">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Contactanos</h2>
            <p className="mt-2 text-muted-foreground">
              Escribinos y te respondemos a la brevedad.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              {contact.address ? (
                <p>
                  <span className="text-muted-foreground">Dirección: </span>
                  <span className="font-medium">{contact.address}</span>
                </p>
              ) : null}
              {contact.phone ? (
                <p>
                  <span className="text-muted-foreground">Teléfono: </span>
                  <a href={`tel:${contact.phone}`} className="font-medium hover:text-primary">
                    {contact.phone}
                  </a>
                </p>
              ) : null}
              {contact.email ? (
                <p>
                  <span className="text-muted-foreground">Email: </span>
                  <a href={`mailto:${contact.email}`} className="font-medium hover:text-primary">
                    {contact.email}
                  </a>
                </p>
              ) : null}
              {contact.whatsapp ? (
                <p>
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Escribinos por WhatsApp →
                  </a>
                </p>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <ConsultaForm slug={tenant.slug} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
