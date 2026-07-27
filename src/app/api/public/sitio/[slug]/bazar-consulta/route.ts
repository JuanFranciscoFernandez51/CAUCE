import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";

/**
 * API PÚBLICA del bazar: consulta (general o por producto).
 * Crea la BazarConsulta para la bandeja del admin Y el lead en el CRM del
 * tenant (regla Cauce: todo cliente entra al CRM), con dedup por contacto.
 */
const schema = z.object({
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  contacto: z.string().trim().min(6, "Dejanos un teléfono o email válido").max(120),
  mensaje: z.string().trim().min(1, "Contanos qué querés consultar").max(2000),
  productoId: z.string().trim().max(60).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!rateLimit(`bz-consulta:${slug}:${clientIp(req)}`, 8, 60_000)) {
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

  // Producto (scopeado) para enriquecer la consulta y la nota del lead.
  let productoNombre = "";
  if (d.productoId) {
    const producto = await db.bazarProducto.findFirst({
      where: { id: d.productoId, clientId: tenant.id },
      select: { nombre: true },
    });
    if (producto) productoNombre = producto.nombre;
  }

  await db.bazarConsulta.create({
    data: {
      clientId: tenant.id,
      nombre: d.nombre,
      contacto: d.contacto,
      mensaje: productoNombre ? `[${productoNombre}] ${d.mensaje}` : d.mensaje,
      productoId: d.productoId ?? null,
    },
  });

  // Lead en el CRM (dedup por teléfono/email en el campo que tengamos).
  const esEmail = d.contacto.includes("@");
  const now = new Date();
  const note = [
    productoNombre ? `Consulta por: ${productoNombre}` : "Consulta desde la tienda online",
    `\n${d.mensaje}`,
  ].join("");
  const existente = await db.contact.findFirst({
    where: {
      clientId: tenant.id,
      ...(esEmail ? { email: d.contacto } : { phone: d.contacto }),
    },
  });
  if (existente) {
    const prev = existente.notes?.trim();
    await db.contact.update({
      where: { id: existente.id },
      data: {
        lastTouchAt: now,
        notes: prev ? `${prev}\n\n[${now.toLocaleDateString("es-AR")}] ${note}` : note,
      },
    });
  } else {
    await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: esEmail ? null : d.contacto,
        email: esEmail ? d.contacto : null,
        source: "tienda web",
        stage: "nuevo",
        notes: note,
        lastTouchAt: now,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
