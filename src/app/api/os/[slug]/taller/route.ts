import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const createSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio").max(200),
  telefono: z.string().trim().max(50).optional().default(""),
  equipo: z.string().trim().min(1, "Contanos qué equipo entra").max(200),
  motivoIngreso: z.string().trim().min(1, "Contanos el motivo").max(2000),
});

/**
 * Alta de orden de trabajo. El cliente entra SIEMPRE al CRM único:
 * si el teléfono ya existe se reutiliza el contacto; si no, se crea.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug, "taller");
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const now = new Date();

  // CRM único: dedup por teléfono (si hay), sino por nombre exacto.
  let contact = d.telefono
    ? await db.contact.findFirst({ where: { clientId: g.tenant.id, phone: d.telefono } })
    : await db.contact.findFirst({ where: { clientId: g.tenant.id, name: d.nombre } });
  if (contact) {
    contact = await db.contact.update({
      where: { id: contact.id },
      data: { lastTouchAt: now },
    });
  } else {
    contact = await db.contact.create({
      data: {
        clientId: g.tenant.id,
        name: d.nombre,
        phone: d.telefono || null,
        source: "taller",
        stage: "nuevo",
        lastTouchAt: now,
      },
    });
  }

  const max = await db.ordenTrabajo.aggregate({
    where: { clientId: g.tenant.id },
    _max: { numero: true },
  });
  const ot = await db.ordenTrabajo.create({
    data: {
      clientId: g.tenant.id,
      numero: (max._max.numero ?? 0) + 1,
      contactId: contact.id,
      equipo: d.equipo,
      motivoIngreso: d.motivoIngreso,
    },
  });
  return NextResponse.json({ ok: true, id: ot.id, numero: ot.numero }, { status: 201 });
}
