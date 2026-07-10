import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const createSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio").max(200),
  telefono: z.string().trim().max(50).optional().default(""),
  descripcion: z.string().trim().min(1, "Contanos qué se vendió").max(300),
  precioArs: z.number().min(0).max(10_000_000_000),
  senaArs: z.number().min(0).max(10_000_000_000).optional().default(0),
  permutaDetalle: z.string().trim().max(300).optional().default(""),
  permutaValorArs: z.number().min(0).max(10_000_000_000).optional().default(0),
});

/** Alta de venta con seña. El comprador entra SIEMPRE al CRM único. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug, "ventas");
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

  let contact = d.telefono
    ? await db.contact.findFirst({ where: { clientId: g.tenant.id, phone: d.telefono } })
    : await db.contact.findFirst({ where: { clientId: g.tenant.id, name: d.nombre } });
  if (contact) {
    contact = await db.contact.update({
      where: { id: contact.id },
      data: { lastTouchAt: now, stage: "interesado" },
    });
  } else {
    contact = await db.contact.create({
      data: {
        clientId: g.tenant.id,
        name: d.nombre,
        phone: d.telefono || null,
        source: "venta",
        stage: "interesado",
        temperatura: "caliente",
        lastTouchAt: now,
      },
    });
  }

  const max = await db.venta.aggregate({
    where: { clientId: g.tenant.id },
    _max: { numero: true },
  });
  const venta = await db.venta.create({
    data: {
      clientId: g.tenant.id,
      numero: (max._max.numero ?? 0) + 1,
      contactId: contact.id,
      descripcion: d.descripcion,
      precioArs: d.precioArs,
      senaArs: d.senaArs,
      permutaDetalle: d.permutaDetalle || null,
      permutaValorArs: d.permutaValorArs,
    },
  });
  return NextResponse.json({ ok: true, id: venta.id, numero: venta.numero }, { status: 201 });
}
