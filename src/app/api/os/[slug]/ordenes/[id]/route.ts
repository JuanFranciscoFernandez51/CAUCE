import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { esVidrios, ordenDatos } from "@/lib/vidrios";
import { guardOsApi } from "../../_guard";

/** Cambios de estado de una orden: trabajo (pendiente→colocado) y facturación. */
const schema = z.object({
  estado: z.enum(["PENDIENTE", "CONFIRMADA", "COLOCADO"]).optional(),
  fechaColocacion: z.string().nullable().optional(),
  facturacion: z.enum(["sin_facturar", "a_facturar", "facturada"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  if (!esVidrios(g.tenant)) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;

  const orden = await db.presupuestoDoc.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!orden) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  const datos = ordenDatos(orden);
  await db.presupuestoDoc.update({
    where: { id: orden.id },
    data: {
      ...(d.estado ? { estado: d.estado } : {}),
      ...(d.facturacion || d.fechaColocacion !== undefined
        ? {
            datos: {
              ...datos,
              ...(d.facturacion ? { facturacion: d.facturacion } : {}),
              ...(d.fechaColocacion !== undefined ? { fechaColocacion: d.fechaColocacion ?? undefined } : {}),
            },
          }
        : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  if (!esVidrios(g.tenant)) return NextResponse.json({ error: "No disponible" }, { status: 404 });
  await db.presupuestoDoc.deleteMany({ where: { id, clientId: g.tenant.id } });
  return NextResponse.json({ ok: true });
}
