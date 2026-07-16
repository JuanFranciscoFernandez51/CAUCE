import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";
import { registrarActividad } from "@/lib/actividad";

const itemSchema = z.object({
  descripcion: z.string().trim().min(1).max(300),
  cantidad: z.number().int().min(1).max(10000),
  precioArs: z.number().min(0).max(1_000_000_000),
  tipo: z.enum(["repuesto", "mano_obra"]),
});

const patchSchema = z.object({
  estado: z.enum(["BORRADOR", "ENVIADO", "ACEPTADO", "RECHAZADO"]).optional(),
  detalle: z.string().trim().min(1).max(2000).optional(),
  items: z.array(itemSchema).optional(),
});

/** Edita el presupuesto: items (recalcula total), estado, detalle. */
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "taller");
  if (g.error) return g.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const d = parsed.data;

  const p = await db.presupuestoTaller.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const totalArs = d.items ? d.items.reduce((s, i) => s + i.cantidad * i.precioArs, 0) : undefined;
  await db.presupuestoTaller.update({
    where: { id: p.id },
    data: {
      ...(d.estado !== undefined ? { estado: d.estado } : {}),
      ...(d.detalle !== undefined ? { detalle: d.detalle } : {}),
      ...(d.items !== undefined ? { items: d.items, totalArs } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

/**
 * Convertir a OT: el cliente aceptó. Crea la orden con los mismos items
 * y deja el presupuesto ACEPTADO linkeado a la OT.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "taller");
  if (g.error) return g.error;

  const p = await db.presupuestoTaller.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!p) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (p.otId) return NextResponse.json({ error: "Ya se convirtió en OT" }, { status: 409 });

  const max = await db.ordenTrabajo.aggregate({
    where: { clientId: g.tenant.id },
    _max: { numero: true },
  });
  const ot = await db.ordenTrabajo.create({
    data: {
      clientId: g.tenant.id,
      numero: (max._max.numero ?? 0) + 1,
      contactId: p.contactId,
      equipo: p.equipo,
      motivoIngreso: p.detalle,
      items: p.items ?? undefined,
      totalArs: p.totalArs,
      estado: "APROBADA",
    },
  });
  await db.presupuestoTaller.update({
    where: { id: p.id },
    data: { estado: "ACEPTADO", otId: ot.id },
  });
  void registrarActividad(
    g.tenant.id,
    "presupuesto_aceptado",
    `P-${String(p.numero).padStart(4, "0")} → OT-${String(ot.numero).padStart(4, "0")}`
  );
  return NextResponse.json({ ok: true, otId: ot.id });
}
