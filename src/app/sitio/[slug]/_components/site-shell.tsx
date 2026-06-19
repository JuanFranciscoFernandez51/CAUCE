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
  return {
    phone: client.phone?.trim() || get("phone") || get("telefono"),
    whatsapp: client.whatsapp?.trim() || get("whatsapp"),
    email: client.email?.trim() || get("email"),
    address: get("address") || get("direccion") || get("domicilio"),
  };
}

/**
 * Shell del sitio público de la inmobiliaria: aplica el branding del tenant
 * vía CSS vars (crema + azul marino vienen de primary/accent), header con nav
 * y footer con datos de contacto. Sin sesión.
 */
export function SiteShell({
  tenant,
  contact,
  children,
}: {
  tenant: Client;
  contact: SiteContact;
  children: ReactNode;
}) {
  const branding = tenantBranding(tenant);
  const base = `/sitio/${tenant.slug}`;

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
            <Link
              href={`${base}/propiedades`}
              className="rounded-md px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Propiedades
            </Link>
            {contact.whatsapp ? (
              <a
                href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 hidden rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:opacity-90 sm:inline-flex"
              >
                Contacto
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
            <p className="mt-1 text-sm text-muted-foreground">
              Tu inmobiliaria de confianza. Encontrá tu próxima propiedad.
            </p>
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
    </div>
  );
}
