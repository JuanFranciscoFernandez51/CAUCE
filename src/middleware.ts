import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const TENANT_BASE = process.env.TENANT_BASE_DOMAIN; // ej: "cauce.app" → cliente.cauce.app

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

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
