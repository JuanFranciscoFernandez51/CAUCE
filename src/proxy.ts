import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const TENANT_BASE = process.env.TENANT_BASE_DOMAIN; // ej: "cauce.app" → cliente.cauce.app

// Dominios propios de clientes (Client.domain) → slug, con cache de 5 min
const domainCache = new Map<string, { slug: string | null; exp: number }>();

async function slugByCustomDomain(req: NextRequest, host: string): Promise<string | null> {
  const hit = domainCache.get(host);
  if (hit && hit.exp > Date.now()) return hit.slug;
  let slug: string | null = null;
  try {
    const r = await fetch(`${req.nextUrl.origin}/api/public/tenant-by-host?host=${encodeURIComponent(host)}`);
    if (r.ok) slug = ((await r.json()) as { slug: string | null }).slug;
  } catch {
    slug = null;
  }
  domainCache.set(host, { slug, exp: Date.now() + 5 * 60_000 });
  return slug;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").toLowerCase();

  // ── Cauce OS: subdominio del tenant → rewrite a /os/<slug> ──
  if (
    TENANT_BASE &&
    host.endsWith(`.${TENANT_BASE}`) &&
    !host.startsWith("www.") &&
    !pathname.startsWith("/os/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next")
  ) {
    const slug = host.slice(0, -(TENANT_BASE.length + 1));
    const url = req.nextUrl.clone();
    url.pathname = `/os/${slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Cauce OS: dominio PROPIO del cliente (Client.domain) → rewrite a /os/<slug> ──
  // Solo se activa cuando hay un TENANT_BASE configurado (setup con dominios propios).
  // Los dominios de Vercel (*.vercel.app) y localhost sirven SIEMPRE la app principal,
  // nunca se tratan como dominio de un tenant (evita un fetch por request que rompe el edge).
  const esHostPropio =
    Boolean(TENANT_BASE) &&
    host &&
    !host.includes("localhost") &&
    !host.startsWith("127.") &&
    !host.startsWith("192.168.") &&
    !host.endsWith(".vercel.app") &&
    host !== TENANT_BASE &&
    !host.endsWith(`.${TENANT_BASE}`);
  if (
    esHostPropio &&
    !pathname.startsWith("/os/") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/login")
  ) {
    const slug = await slugByCustomDomain(req, host);
    if (slug) {
      const url = req.nextUrl.clone();
      url.pathname = `/os/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Rutas PÚBLICAS sin auth: calendario de auto-agendado + su API.
  // (igual que /login, /api/hooks, /api/public — el cliente final no tiene sesión)
  if (pathname.startsWith("/agendar") || pathname.startsWith("/api/public/agendar")) {
    return NextResponse.next();
  }

  // Sitio web público de la inmobiliaria (catálogo de propiedades + consulta).
  // Mismo trato que /agendar: sin sesión, scoping por slug del tenant.
  if (pathname.startsWith("/sitio") || pathname.startsWith("/api/public/sitio")) {
    return NextResponse.next();
  }

  // El manifest de la PWA debe ser público (el navegador lo lee sin cookies).
  // Solo expone nombre/color/íconos del tenant, nada sensible.
  if (pathname.endsWith("/manifest.webmanifest") || pathname === "/sw.js") {
    return NextResponse.next();
  }

  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/os") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/portal") ||
    pathname.startsWith("/api/os");

  if (!needsAuth) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isApi = pathname.startsWith("/api/");

  if (!token) {
    // API: JSON 401, no redirect. Páginas: redirect a login.
    if (isApi) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as string | undefined;
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && role !== "ADMIN") {
    if (isApi) return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    const url = req.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
