import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { getTenantBySlug, hasModule } from "@/lib/tenant";
import { DATE_RE } from "@/app/os/[slug]/_lib/dates";

const schema = z.object({
  nombre: z.string().trim().min(1, "Decinos tu nombre").max(200),
  telefono: z.string().trim().min(6, "El teléfono no parece válido").max(50),
  fecha: z.string().regex(DATE_RE, "Fecha inválida"),
});

/**
 * Lista de espera pública: el día está lleno y el cliente final se anota.
 * Cuando se libera un lugar, el negocio recibe el aviso con el WhatsApp listo.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!rateLimit(`espera:${slug}:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Demasiados intentos. Probá en un minuto." }, { status: 429 });
  }
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !hasModule(tenant, "turnos")) {
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

  // No duplicar: mismo teléfono esperando el mismo día.
  const ya = await db.listaEspera.findFirst({
    where: { clientId: tenant.id, fecha: d.fecha, telefono: d.telefono, estado: "ESPERANDO" },
  });
  if (ya) return NextResponse.json({ ok: true, yaEstabas: true });

  await db.listaEspera.create({
    data: { clientId: tenant.id, fecha: d.fecha, nombre: d.nombre, telefono: d.telefono },
  });

  // Todo dato que entra queda también en el CRM (regla de la casa).
  const contacto = await db.contact.findFirst({ where: { clientId: tenant.id, phone: d.telefono } });
  if (!contacto) {
    await db.contact.create({
      data: {
        clientId: tenant.id,
        name: d.nombre,
        phone: d.telefono,
        source: "lista-espera",
        stage: "nuevo",
        lastTouchAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
