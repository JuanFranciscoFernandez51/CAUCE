import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  assertTenantAccess,
  getTenantBySlug,
  tenantBranding,
  tenantEstilo,
  tenantModules,
  type OsModule,
} from "@/lib/tenant";
import { isOsOwner, resolveOsRole } from "./_components/os-role";
import { OsSidebar, type NavEntry } from "./_components/os-sidebar";
import { db } from "@/lib/db";
import { JessTopbar } from "./_components/eventos/jess-topbar";
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
  taller: { path: "taller", label: "Taller", icon: "🔧" },
  ventas: { path: "ventas", label: "Ventas", icon: "🤝" },
  eventos: { path: "eventos", label: "Eventos & Cronómetro", icon: "⏱️" },
  sitio: { path: "propiedades", label: "Propiedades", icon: "🏠" },
  proyectos: { path: "proyectos", label: "Proyectos", icon: "📁" },
  pantallas: { path: "pantallas", label: "Pantallas LED", icon: "🖥️" },
  rrhh: { path: "rrhh", label: "RRHH", icon: "👥" },
  caja: { path: "caja", label: "Finanzas", icon: "💵" },
};

/** Orden de los módulos operativos dentro del grupo. */
const OPS_ORDER: OsModule[] = ["pantallas", "ventas", "turnos", "catalogo", "taller", "eventos", "sitio", "proyectos", "rrhh", "caja"];

/** "Propiedades" (gestión de listings) solo tiene sentido para inmobiliarias. */
const esInmobiliaria = (rubro: string | null) => (rubro ?? "").toLowerCase().includes("inmobil");

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
  const opsOrder = OPS_ORDER.filter((m) => m !== "sitio" || esInmobiliaria(tenant.rubro));
  // Si la marca define su fondo y su tinta, el panel usa la misma estética que
  // su web: el dueño entra y reconoce su negocio, no una herramienta genérica.
  const paleta = (tenant.branding ?? {}) as { fondo?: string; tinta?: string; display?: string; fuente?: string };
  const themeVars = {
    "--primary": branding.primary,
    "--primary-foreground": "#ffffff",
    "--primary-soft": `color-mix(in srgb, ${branding.primary} 16%, transparent)`,
    "--accent": branding.accent,
    "--ring": branding.primary,
    ...(paleta.fondo
      ? {
          "--background": paleta.fondo,
          "--card": `color-mix(in srgb, ${paleta.fondo} 55%, #ffffff)`,
          "--muted": `color-mix(in srgb, ${paleta.fondo} 70%, ${branding.primary} 6%)`,
          "--muted-foreground": `color-mix(in srgb, ${paleta.tinta ?? "#333"} 62%, transparent)`,
          "--border": `color-mix(in srgb, ${branding.primary} 18%, transparent)`,
        }
      : {}),
    ...(paleta.tinta ? { "--foreground": paleta.tinta, "--card-foreground": paleta.tinta } : {}),
    // La marca puede traer su propia tipografía: el panel habla su idioma.
    ...(paleta.fuente ? { fontFamily: paleta.fuente } : {}),
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

  // Grupo Operaciones: módulos operativos activos (Caja solo para el dueño) + Procesos.
  const opsItems = opsOrder.filter((m) => modules.includes(m) && (m !== "caja" || owner)).map((m) => ({
    label: OPS_NAV[m]!.label,
    href: `${base}/${OPS_NAV[m]!.path}`,
    icon: OPS_NAV[m]!.icon,
  }));
  // Template bazar (tienda online): sus módulos propios van primero en Operaciones.
  const tpl = (tenant.settings as { template?: string } | null)?.template;
  if (tpl === "bazar") {
    opsItems.unshift(
      { label: "Catálogo", href: `${base}/productos`, icon: "🛍️" },
      { label: "Despacho", href: `${base}/despacho`, icon: "📦" },
      { label: "Consultas", href: `${base}/consultas`, icon: "💬" },
      { label: "Instagram", href: `${base}/instagram`, icon: "📷" }
    );
  }
  // Template eventos (Jess Design): el embudo de eventos y las cotizaciones.
  if (tpl === "eventos") {
    opsItems.unshift(
      { label: "Eventos", href: `${base}/eventos-org`, icon: "" },
      { label: "Cotizaciones", href: `${base}/cotizaciones`, icon: "" },
      { label: "Proveedores", href: `${base}/proveedores`, icon: "" }
    );
  }

  // Template piletas (Piletas Bahía Blanca): presupuestos e Instagram.
  if (tpl === "piletas") {
    opsItems.unshift(
      { label: "Presupuestos", href: `${base}/presupuestos`, icon: "📄" },
      { label: "Instagram", href: `${base}/instagram`, icon: "📷" }
    );
  }

  // Template comida (Casa Milo): la carta y los pedidos del día.
  if (tpl === "comida") {
    opsItems.unshift(
      { label: "Pedidos", href: `${base}/pedidos`, icon: "🧾" },
      { label: "Carta", href: `${base}/productos`, icon: "🍽" },
      { label: "Reparto", href: `${base}/despacho`, icon: "🛵" },
      { label: "Consultas", href: `${base}/consultas`, icon: "💬" },
      { label: "Instagram", href: `${base}/instagram`, icon: "📷" }
    );
  }

  // Template repuestos (Fernández Repuestos): misma tienda, con proveedores y stock propio.
  if (tpl === "repuestos") {
    // Pedidos une la venta con el despacho: es el centro del negocio online.
    opsItems.unshift(
      { label: "Pedidos", href: `${base}/pedidos`, icon: "🧾" },
      { label: "Repuestos & Stock", href: `${base}/productos`, icon: "🔩" },
      { label: "Proveedores", href: `${base}/proveedores`, icon: "🏭" }
    );
  }
  // Template concesionaria (Ri Cars): sus módulos propios primero en Operaciones.
  if (tpl === "concesionaria") {
    opsItems.unshift(
      { label: "Stock", href: `${base}/stock`, icon: "🚗" },
      { label: "Mandatos", href: `${base}/mandatos`, icon: "📝" },
      { label: "Boletos", href: `${base}/boletos`, icon: "🧾" },
      { label: "Financiaciones", href: `${base}/financiaciones`, icon: "💳" },
      { label: "Proveedores", href: `${base}/proveedores`, icon: "🏭" },
      { label: "Clientes", href: `${base}/clientes`, icon: "🧑" },
      { label: "Consultas", href: `${base}/consultas`, icon: "💬" },
      { label: "Publicar", href: `${base}/publicar`, icon: "📣" }
    );
  }
  // Template vidrios (Código Auto): parabrisas — stock de depósito, órdenes de
  // pedido con boleto imprimible y la bandeja de facturación ARCA.
  if (tpl === "vidrios") {
    opsItems.splice(
      0,
      opsItems.length,
      { label: "Stock", href: `${base}/productos`, icon: "🪟" },
      { label: "Órdenes", href: `${base}/ordenes`, icon: "🧾" },
      { label: "Facturación", href: `${base}/facturacion`, icon: "🧮" },
      { label: "Turnos", href: `${base}/turnos`, icon: "📅" },
      { label: "Taller", href: `${base}/taller`, icon: "🔧" },
      { label: "Proveedores", href: `${base}/proveedores`, icon: "🏭" },
      { label: "Tareas", href: `${base}/tareas`, icon: "🗂️" },
      ...(owner ? [{ label: "Finanzas", href: `${base}/caja`, icon: "💵" }] : [])
    );
  }
  // Template dooh (circuito de pantallas LED): la carpeta de clientes va
  // pegada a Pantallas, que es su módulo principal.
  if (tpl === "dooh") {
    opsItems.splice(
      Math.max(opsItems.findIndex((i) => i.href === `${base}/pantallas`), 0) + 1,
      0,
      { label: "Clientes", href: `${base}/clientes`, icon: "🧑" }
    );
  }
  if (tpl !== "eventos" && tpl !== "comida" && tpl !== "vidrios") opsItems.push({ label: "Procesos", href: `${base}/procesos`, icon: "⚡" });

  // Navegación reagrupada: Dashboard · CRM · Operaciones · Config · Usuarios · Asistente IA.
  const nav: NavEntry[] = [
    { label: "Dashboard", href: base, icon: "🏁", exact: true },
    tpl === "eventos"
      ? { label: "Calendario", href: `${base}/calendario`, icon: "" }
      : { label: "Para hoy", href: `${base}/hoy`, icon: "☀️" },
    ...(crm ? [{ label: tpl === "vidrios" ? "Clientes" : "CRM", href: `${base}/crm`, icon: "📇" }] : []),
    { label: "Operaciones", icon: "🛠️", items: opsItems },
    ...(tpl === "repuestos"
      ? [
          {
            label: "Canales",
            icon: "📣",
            items: [
              { label: "Consultas", href: `${base}/consultas`, icon: "💬" },
              { label: "Instagram", href: `${base}/instagram`, icon: "📷" },
            ],
          },
        ]
      : []),
    ...(owner && tpl !== "eventos" && tpl !== "comida" ? [{ label: "Reportes", href: `${base}/reportes`, icon: "📊" }] : []),
    ...(owner && tpl !== "eventos" && tpl !== "comida" ? [{ label: "Actividad", href: `${base}/actividad`, icon: "🕘" }] : []),
    ...(owner
      ? [
          { label: "Configuración de la página", href: `${base}/config`, icon: "⚙️" },
          { label: "Usuarios", href: `${base}/usuarios`, icon: "👤" },
        ]
      : []),
    ...(tpl !== "eventos" ? [{ label: "Asistente IA", href: `${base}/asistente`, icon: "✨" }] : []),
  ];

  // La banda "lo próximo" del marco de Jess: primera tarea pendiente o hito por vencer.
  let proximoJess: { texto: string; href: string } | null = null;
  let eventosActivos = 0;
  if (tpl === "eventos") {
    const [tareasPend, evs] = await Promise.all([
      db.tarea.count({ where: { clientId: tenant.id, estado: { not: "hecho" } } }).catch(() => 0),
      db.eventoOrg.findMany({ where: { clientId: tenant.id, estado: { not: "cerrado" } }, select: { nombre: true, fecha: true } }).catch(() => []),
    ]);
    eventosActivos = evs.length;
    const proxEv = evs
      .filter((e: { fecha: Date | null }) => e.fecha && e.fecha >= new Date())
      .sort((a: { fecha: Date | null }, b: { fecha: Date | null }) => a.fecha!.getTime() - b.fecha!.getTime())[0];
    if (tareasPend || proxEv) {
      proximoJess = {
        texto: `${tareasPend} cosa${tareasPend === 1 ? "" : "s"} hoy${proxEv ? ` · Próximo: ${proxEv.nombre}` : ""}`,
        href: tareasPend ? `${base}/calendario#pendientes` : `${base}/eventos-org`,
      };
    }
  }

  // Una empresa de diseño no quiere emojis en su barra: el tema "elegante"
  // deja las etiquetas solas, en mayúsculas espaciadas.
  const navElegante = ((tenant.branding as { estilo?: { navTema?: string } } | null)?.estilo?.navTema) === "elegante";
  const navFinal: NavEntry[] = navElegante
    ? nav.map((e) =>
        "items" in e && e.items
          ? { ...e, icon: "", items: e.items.map((i) => ({ ...i, icon: "" })) }
          : { ...e, icon: "" }
      )
    : nav;

  // Las "terminaciones" elegidas por el cliente (esquinas, nav, densidad).
  const estilo = tenantEstilo(tenant);
  const estiloCls = [
    estilo.esquinas === "rectas" ? "os-esquinas-rectas" : "",
    estilo.esquinas === "redondeadas" ? "os-esquinas-redondeadas" : "",
    estilo.densidad === "compacta" ? "os-densidad-compacta" : "",
    tpl === "eventos" ? "os-jess" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={themeVars}
      className={`flex min-h-screen bg-background text-foreground flex-col ${
        estilo.nav === "arriba" || tpl === "eventos" ? "" : "lg:flex-row"
      } ${estiloCls}`}
    >
      {tpl === "eventos" ? (
        <JessTopbar
          logo={branding.logo || null}
          base={base}
          proximo={proximoJess}
          tabs={[
            { label: "Dashboard", href: base },
            { label: "Cotizaciones", href: `${base}/cotizaciones` },
            { label: "Eventos", href: `${base}/eventos-org`, badge: eventosActivos },
            { label: "Clientes", href: `${base}/clientes` },
            { label: "Proveedores", href: `${base}/proveedores` },
            { label: "Calendario", href: `${base}/calendario` },
            { label: "Finanzas", href: `${base}/caja` },
            { label: "Configuración", href: `${base}/config` },
          ]}
        />
      ) : (
        <OsSidebar
          displayName={branding.displayName}
          logo={branding.logo || null}
          initial={branding.displayName.charAt(0).toUpperCase()}
          nav={navFinal}
          posicion={estilo.nav}
          grupos={estilo.grupos}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <InstallPrompt appName={branding.displayName} />
        {tpl === "eventos" ? (
          <a
            href={`${base}/asistente`}
            aria-label="Asistente IA"
            title="Asistente IA"
            className="fixed bottom-5 left-5 z-50 flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: "#1A1816", color: "#EDE8DE", width: 52, height: 52, fontSize: 20 }}
          >
            ✦
          </a>
        ) : null}
        <footer className="border-t py-4">
          <p className="text-center text-xs text-muted-foreground">
            ⚡ Powered by{" "}
            <a href="https://cauceapp.com.ar" className="font-medium hover:text-foreground">
              Cauce
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
