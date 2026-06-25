import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  assertTenantAccess,
  getTenantBySlug,
  tenantBranding,
  tenantModules,
  type OsModule,
} from "@/lib/tenant";
import { isOsOwner, resolveOsRole } from "./_components/os-role";
import { OsSidebar, type NavEntry } from "./_components/os-sidebar";
import { InstallPrompt } from "./_components/install-prompt";

/** ¿URL absoluta de Cloudinary? (sirve como apple-touch-icon). */
function isCloudinaryUrl(url: string): boolean {
  return /^https:\/\/res\.cloudinary\.com\//.test(url);
}

/**
 * theme-color por tenant: la barra del navegador / status bar de la PWA toma
 * el color de marca del cliente. En Next 16 el theme-color vive en el viewport.
 */
export async function generateViewport({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Viewport> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  const primary = tenant ? tenantBranding(tenant).primary : "#0f766e";
  return { themeColor: primary };
}

/**
 * Metadata por tenant: linkea el manifest dinámico y setea theme-color +
 * apple-touch-icon con la marca del cliente, para que sea instalable como app
 * con SU nombre y SU color.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return {};

  const branding = tenantBranding(tenant);
  const appleIcon = isCloudinaryUrl(branding.logo) ? branding.logo : "/icon.svg";

  return {
    title: {
      default: branding.displayName,
      template: `%s · ${branding.displayName}`,
    },
    applicationName: branding.displayName,
    manifest: `/os/${slug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: branding.displayName,
    },
    icons: {
      apple: appleIcon,
    },
  };
}

/** Módulos operativos: etiqueta + ruta + ícono dentro del grupo "Operaciones". */
const OPS_NAV: Partial<Record<OsModule, { path: string; label: string; icon: string }>> = {
  turnos: { path: "turnos", label: "Turnos & Agenda", icon: "📅" },
  catalogo: { path: "catalogo", label: "Catálogo & Stock", icon: "📦" },
  sitio: { path: "propiedades", label: "Propiedades", icon: "🏠" },
  proyectos: { path: "proyectos", label: "Proyectos", icon: "📁" },
  rrhh: { path: "rrhh", label: "RRHH", icon: "👥" },
  caja: { path: "caja", label: "Finanzas", icon: "💵" },
};

/** Orden de los módulos operativos dentro del grupo. */
const OPS_ORDER: OsModule[] = ["turnos", "catalogo", "sitio", "proyectos", "rrhh", "caja"];

export default async function OsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const branding = tenantBranding(tenant);
  const themeVars = {
    "--primary": branding.primary,
    "--primary-foreground": "#ffffff",
    "--primary-soft": `color-mix(in srgb, ${branding.primary} 16%, transparent)`,
    "--accent": branding.accent,
    "--ring": branding.primary,
  } as React.CSSProperties;

  // El middleware ya exige sesión en /os; acá validamos pertenencia al tenant.
  const session = await auth();
  let forbidden = !session;
  if (session) {
    try {
      assertTenantAccess({
        role: session.user.role,
        userClientId: session.user.clientId,
        tenantId: tenant.id,
      });
    } catch {
      forbidden = true;
    }
  }

  if (forbidden) {
    return (
      <div style={themeVars} className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-semibold">No tenés acceso a este sistema</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu usuario no pertenece a {branding.displayName}. Si creés que es un error, hablá con Cauce.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary underline">
          Volver al login
        </Link>
      </div>
    );
  }

  // Rol dentro del OS (leído de la DB): define qué ve en el nav.
  const osRole = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  const owner = isOsOwner(osRole);
  const base = `/os/${tenant.slug}`;

  const modules = tenantModules(tenant);
  const crm = modules.includes("crm");

  // Grupo Operaciones: módulos operativos activos (Caja solo para el dueño) + Automatizaciones.
  const opsItems = OPS_ORDER.filter((m) => modules.includes(m) && (m !== "caja" || owner)).map((m) => ({
    label: OPS_NAV[m]!.label,
    href: `${base}/${OPS_NAV[m]!.path}`,
    icon: OPS_NAV[m]!.icon,
  }));
  opsItems.push({ label: "Automatizaciones", href: `${base}/automatizaciones`, icon: "⚡" });

  // Navegación reagrupada: Dashboard · CRM · Operaciones · Config · Usuarios · Asistente IA.
  const nav: NavEntry[] = [
    { label: "Dashboard", href: base, icon: "🏁", exact: true },
    ...(crm ? [{ label: "CRM", href: `${base}/crm`, icon: "📇" }] : []),
    { label: "Operaciones", icon: "🛠️", items: opsItems },
    ...(owner ? [{ label: "Reportes", href: `${base}/reportes`, icon: "📊" }] : []),
    ...(owner
      ? [
          { label: "Configuración de la página", href: `${base}/config`, icon: "⚙️" },
          { label: "Usuarios", href: `${base}/usuarios`, icon: "👤" },
        ]
      : []),
    { label: "Asistente IA", href: `${base}/asistente`, icon: "✨" },
  ];

  return (
    <div style={themeVars} className="flex min-h-screen bg-background text-foreground lg:flex-row flex-col">
      <OsSidebar
        displayName={branding.displayName}
        logo={branding.logo || null}
        initial={branding.displayName.charAt(0).toUpperCase()}
        nav={nav}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <InstallPrompt appName={branding.displayName} />
        <footer className="border-t py-4">
          <p className="text-center text-xs text-muted-foreground">
            ⚡ Powered by{" "}
            <a href="https://cauce.app" className="font-medium hover:text-foreground">
              Cauce
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
