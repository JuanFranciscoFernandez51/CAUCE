import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { cookieSesion, esBazar, firmarSesion } from "@/lib/bazar-server";

/**
 * Registro de cuenta del sitio: bcrypt + cookie JWT propia (NO NextAuth).
 * Al registrarse arranca con el 10% de primera compra disponible y entra
 * como contacto al CRM del tenant (regla: todo cliente entra al CRM).
 */
const schema = z.object({
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  email: z.email("Email inválido").max(200),
  telefono: z.string().trim().max(50).nullable().optional(),
  password: z.string().min(6, "La contraseña necesita al menos 6 caracteres").max(200),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`bz-registro:${slug}:${clientIp(req)}`, 5, 60_000)) {
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
  const d = parsed.data;
  const email = d.email.toLowerCase();

  const existe = await db.bazarCuenta.findFirst({ where: { clientId: tenant.id, email } });
  if (existe) {
    return NextResponse.json(
      { error: "Ya hay una cuenta con ese email. Probá ingresar." },
      { status: 409 }
    );
  }

  const cuenta = await db.bazarCuenta.create({
    data: {
      clientId: tenant.id,
      email,
      hash: await bcrypt.hash(d.password, 10),
      nombre: d.nombre,
      telefono: d.telefono || null,
    },
  });

  // CRM: todo cliente entra al CRM (dedup por email).
  try {
    const contacto = await db.contact.findFirst({
      where: { clientId: tenant.id, email },
    });
    if (!contacto) {
      await db.contact.create({
        data: {
          clientId: tenant.id,
          name: d.nombre,
          email,
          phone: d.telefono || null,
          source: "tienda web",
          stage: "nuevo",
          notes: "Se creó una cuenta en la tienda online (10% primera compra disponible).",
          lastTouchAt: new Date(),
        },
      });
    }
  } catch {
    // el CRM nunca frena un registro
  }

  const res = NextResponse.json({ ok: true }, { status: 201 });
  res.cookies.set(cookieSesion(tenant.slug), firmarSesion({ cuentaId: cuenta.id, clientId: tenant.id }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 86_400,
    path: "/",
  });
  return res;
}
