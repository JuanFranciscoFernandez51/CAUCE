import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";

/**
 * API PÚBLICA del sitio inmobiliario: consulta de una propiedad.
 * Crea/vincula un Contact (lead) en el CRM del tenant, dedup por teléfono,
 * source "sitio web". Solo escribe datos del tenant resuelto por slug.
 */
const schema = z.object({
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  telefono: z.string().trim().min(6, "El teléfono no parece válido").max(50),
  email: z.union([z.literal(""), z.email("Email inválido")]).optional().default(""),
  mensaje: z.string().trim().max(2000).optional().default(""),
  listingId: z.string().trim().max(60).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!rateLimit(`consulta:${slug}:${clientIp(req)}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto y probá de nuevo." },
      { status: 429 }
    );
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "sitio")) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  // Si vino una propiedad, la traemos (scopeada) para enriquecer la nota del lead.
  let propTitle = "";
  if (d.listingId) {
    const listing = await db.listing.findFirst({
      where: { id: d.listingId, clientId: tenant.id, active: true },
      select: { title: true },
    });
    if (listing) propTitle = listing.title;
  }

  const note = [
    propTitle ? `Consulta por: ${propTitle}` : "Consulta general desde el sitio",
    d.mensaje ? `\n${d.mensaje}` : "",
  ].join("");

  // Dedup de Contact por teléfono dentro del tenant.
  const now = new Date();
  const existing = await db.contact.findFirst({
    where: { clientId: tenant.id, phone: d.telefono },
  });

  if (existing) {
    const prevNotes = existing.notes?.trim();
    await db.contact.update({
      where: { id: existing.id },
      data: {
        lastTouchAt: now,
        // No pisamos datos cargados; sólo completamos lo que falte y sumamos la consulta.
        email: existing.email || d.email || null,
        notes: prevNotes ? `${prevNotes}\n\n[${now.toLocaleDateString("es-AR")}] ${note}` : note,
      },
    });
  } else {
    await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: d.telefono,
        email: d.email || null,
        source: "sitio web",
        stage: "nuevo",
        notes: note,
        lastTouchAt: now,
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
