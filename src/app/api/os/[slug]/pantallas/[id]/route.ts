import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const patchSchema = z.object({
  nombre: z.string().trim().min(1).max(120).optional(),
  zona: z.string().trim().max(80).nullable().optional(),
  medidas: z.string().trim().max(40).nullable().optional(),
  resolucion: z.string().trim().max(40).nullable().optional(),
  slotsTotal: z.number().int().min(1).max(200).optional(),
  activa: z.boolean().optional(),
});

// Alta de contrato en esta pantalla.
const contratoSchema = z.object({
  contrato: z.literal(true),
  contactId: z.string().trim().min(1).nullable().optional(),
  nombreCliente: z.string().trim().max(120).optional(), // si no hay contacto, se crea
  slots: z.number().int().min(1).max(30).default(1),
  montoMensual: z.number().min(0),
  notas: z.string().trim().max(500).optional(),
});

async function pantallaDelTenant(id: string, clientId: string) {
  return db.pantalla.findFirst({ where: { id, clientId } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "pantallas");
  if (g.error) return g.error;
  const pantalla = await pantallaDelTenant(id, g.tenant.id);
  if (!pantalla) return NextResponse.json({ error: "Pantalla no encontrada" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const updated = await db.pantalla.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ pantalla: updated });
}

/** POST = alta de contrato (anunciante) en la pantalla. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "pantallas");
  if (g.error) return g.error;
  const pantalla = await pantallaDelTenant(id, g.tenant.id);
  if (!pantalla) return NextResponse.json({ error: "Pantalla no encontrada" }, { status: 404 });

  const parsed = contratoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { contactId, nombreCliente, slots, montoMensual, notas } = parsed.data;

  // Capacidad: no vender más spots de los que entran en la rotación.
  const ocupados = await db.pantallaContrato.aggregate({
    where: { pantallaId: id, estado: "activo" },
    _sum: { slots: true },
  });
  const libres = pantalla.slotsTotal - (ocupados._sum.slots ?? 0);
  if (slots > libres) {
    return NextResponse.json(
      { error: `Solo quedan ${libres} spots libres en ${pantalla.nombre}` },
      { status: 409 }
    );
  }

  // Contacto: existente (verificado del tenant) o alta rápida al CRM.
  let finalContactId: string | null = null;
  if (contactId) {
    const c = await db.contact.findFirst({ where: { id: contactId, clientId: g.tenant.id } });
    if (!c) return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    finalContactId = c.id;
  } else if (nombreCliente) {
    const c = await db.contact.create({
      data: {
        clientId: g.tenant.id,
        name: nombreCliente,
        source: "pantallas",
        stage: "cliente",
      },
    });
    finalContactId = c.id;
  } else {
    return NextResponse.json({ error: "Falta el anunciante" }, { status: 400 });
  }

  const contrato = await db.pantallaContrato.create({
    data: {
      clientId: g.tenant.id,
      pantallaId: id,
      contactId: finalContactId,
      slots,
      montoMensual,
      estado: "activo",
      inicio: new Date(),
      notas: notas || null,
    },
    include: { contact: { select: { id: true, name: true, phone: true } } },
  });
  return NextResponse.json({ contrato }, { status: 201 });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "pantallas");
  if (g.error) return g.error;
  const pantalla = await pantallaDelTenant(id, g.tenant.id);
  if (!pantalla) return NextResponse.json({ error: "Pantalla no encontrada" }, { status: 404 });
  await db.pantalla.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
