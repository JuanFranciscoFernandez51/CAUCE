import Link from "next/link";
import type { ReactNode } from "react";
import type { Client } from "@prisma/client";
import { tenantBranding } from "@/lib/tenant";

/** Datos de contacto que el tenant puede tener en config (best-effort, opcionales). */
export type SiteContact = {
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
};

/** Lee contacto del tenant desde sus columnas + settings, sin romper si no existe. */
export function siteContact(client: Client): SiteContact {
  const cfg = (client.settings as Record<string, unknown> | null) ?? {};
  const get = (k: string) => {
    const v = cfg[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  // datosNegocio.{direccion,telefono} es donde escriben el portal y el onboarding.
  const dn = (cfg.datosNegocio ?? {}) as Record<string, unknown>;
  const getDn = (k: string) => {
    const v = dn[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  return {
    phone: client.phone?.trim() || get("phone") || get("telefono") || getDn("telefono"),
    whatsapp: client.whatsapp?.trim() || get("whatsapp"),
    email: client.email?.trim() || get("email"),
    address: get("address") || get("direccion") || get("domicilio") || getDn("direccion"),
  };
}

/** Items de navegación que el sitio muestra según los módulos del tenant. */
export type SiteNav = {
  /** Mostrar link a /propiedades (tenant inmobiliario con listings). */
  propiedades?: boolean;
  /** Mostrar CTA "Reservar turno" → /agendar/[slug] (tenant con turnos). */
  turnos?: boolean;
  /** Etiqueta de la sección catálogo si la hay (ej. "Nuestra carta"). */
  catalogoLabel?: string;
};

/**
 * Shell del sitio público de CUALQUIER tenant: aplica el branding del tenant
 * vía CSS vars, header con nav según sus módulos, footer con datos de contacto
 * y botón flotante de WhatsApp. Sin sesión.
 */
export function SiteShell({
  tenant,
  contact,
  nav = {},
  tagline,
  children,
}: {
  tenant: Client;
  contact: SiteContact;
  nav?: SiteNav;
  /** Frase corta del negocio para el footer (del rubro). */
  tagline?: string;
  children: ReactNode;
}) {
  const branding = tenantBranding(tenant);
  const base = `/sitio/${tenant.slug}`;
  const waHref = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  // El primary del tenant tiñe acciones; el accent, los detalles. Fondo crema suave
  // derivado del primary para un look inmobiliario elegante.
  const themeVars = {
    "--primary": branding.primary,
    "--primary-foreground": "#ffffff",
    "--primary-soft": `color-mix(in srgb, ${branding.primary} 12%, white)`,
    "--accent": branding.accent,
    "--accent-foreground": "#0b0f16",
    "--ring": branding.primary,
    "--background": "#faf7f0",
    "--foreground": "#1a2230",
    "--card": "#ffffff",
    "--card-foreground": "#1a2230",
    "--muted": "#f0ece2",
    "--muted-foreground": "#6b6456",
    "--border": "#e6dfd2",
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href={base} className="flex min-w-0 items-center gap-2.5">
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo}
                alt={branding.displayName}
                className="h-9 w-9 rounded-full border object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {branding.displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-base font-semibold tracking-tight">
              {branding.displayName}
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link
              href={base}
              className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Inicio
            </Link>
            {nav.propiedades ? (
              <Link
                href={`${base}/propiedades`}
                className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Propiedades
              </Link>
            ) : null}
            {nav.turnos ? (
              <Link
                href={`/agendar/${tenant.slug}`}
                className="hidden rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                Reservar turno
              </Link>
            ) : null}
            <a
              href="#contacto"
              className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Contacto
            </a>
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 hidden rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90 sm:inline-flex"
              >
                WhatsApp
              </a>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2">
          <div>
            <p className="text-lg font-semibold">{branding.displayName}</p>
            {tagline ? (
              <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
            ) : null}
          </div>
          <div className="space-y-1.5 text-sm sm:text-right">
            {contact.phone ? (
              <p>
                <span className="text-muted-foreground">Tel: </span>
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
            {contact.address ? (
              <p>
                <span className="text-muted-foreground">Dirección: </span>
                <span className="font-medium">{contact.address}</span>
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
        <div className="border-t py-4">
          <p className="text-center text-xs text-muted-foreground">
            ⚡ Powered by{" "}
            <a href="https://cauce.app" className="font-medium hover:text-foreground">
              Cauce
            </a>
          </p>
        </div>
      </footer>

      {/* WhatsApp flotante (esquina inferior izquierda, patrón Cauce) */}
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="fixed bottom-5 left-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
            <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.516 5.26l-.999 3.648 3.972-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
