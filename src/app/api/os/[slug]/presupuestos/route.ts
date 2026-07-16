import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";
import { registrarActividad } from "@/lib/actividad";

const createSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del cliente es obligatorio").max(200),
  telefono: z.string().trim().max(50).optional().default(""),
  equipo: z.string().trim().min(1, "Contanos qué equipo es").max(200),
  detalle: z.string().trim().min(1, "Contanos qué hay que cotizar").max(2000),
});

/** Alta de presupuesto (sin ingresar el equipo). El cliente entra al CRM. */
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

  let contact = d.telefono
    ? await db.contact.findFirst({ where: { clientId: g.tenant.id, phone: d.telefono } })
    : await db.contact.findFirst({ where: { clientId: g.tenant.id, name: d.nombre } });
  if (contact) {
    contact = await db.contact.update({ where: { id: contact.id }, data: { lastTouchAt: now } });
  } else {
    contact = await db.contact.create({
      data: {
        clientId: g.tenant.id,
        name: d.nombre,
        phone: d.telefono || null,
        source: "presupuesto",
        stage: "interesado",
        temperatura: "caliente",
        lastTouchAt: now,
      },
    });
  }

  const max = await db.presupuestoTaller.aggregate({
    where: { clientId: g.tenant.id },
    _max: { numero: true },
  });
  const p = await db.presupuestoTaller.create({
    data: {
      clientId: g.tenant.id,
      numero: (max._max.numero ?? 0) + 1,
      contactId: contact.id,
      equipo: d.equipo,
      detalle: d.detalle,
    },
  });
  void registrarActividad(g.tenant.id, "presupuesto_creado", `P-${String(p.numero).padStart(4, "0")} ${d.equipo}`);
  return NextResponse.json({ ok: true, id: p.id, numero: p.numero }, { status: 201 });
}
