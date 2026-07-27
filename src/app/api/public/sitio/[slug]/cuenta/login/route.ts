import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { cookieSesion, esBazar, firmarSesion } from "@/lib/bazar-server";

/** Login del comprador del sitio (cookie JWT propia, httpOnly). */
const schema = z.object({
  email: z.email("Email inválido").max(200),
  password: z.string().min(1, "Ingresá tu contraseña").max(200),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`bz-login:${slug}:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto y probá de nuevo." },
      { status: 429 }
    );
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio") || !esBazar(tenant)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const cuenta = await db.bazarCuenta.findFirst({
    where: { clientId: tenant.id, email: parsed.data.email.toLowerCase() },
  });
  if (!cuenta || !(await bcrypt.compare(parsed.data.password, cuenta.hash))) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieSesion(tenant.slug), firmarSesion({ cuentaId: cuenta.id, clientId: tenant.id }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 86_400,
    path: "/",
  });
  return res;
}
