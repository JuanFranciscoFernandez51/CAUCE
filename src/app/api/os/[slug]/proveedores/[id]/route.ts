import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../_guard";

const patchSchema = z.object({
  nombre: z.string().trim().min(1).max(120).optional(),
  categoria: z.enum(["servicio", "alquiler", "impuestos", "contenido", "insumos", "otro"]).optional(),
  detalle: z.string().trim().max(200).nullable().optional(),
  telefono: z.string().trim().max(50).nullable().optional(),
  montoMensual: z.number().min(0).optional(),
  diaPago: z.number().int().min(1).max(31).nullable().optional(),
  activo: z.boolean().optional(),
  notas: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "caja");
  if (g.error) return g.error;
  const proveedor = await db.proveedor.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const updated = await db.proveedor.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ proveedor: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "caja");
  if (g.error) return g.error;
  const proveedor = await db.proveedor.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
  await db.proveedor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
