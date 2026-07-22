import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const createSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  categoria: z.enum(["servicio", "alquiler", "impuestos", "contenido", "insumos", "otro"]).default("servicio"),
  detalle: z.string().trim().max(200).optional(),
  telefono: z.string().trim().max(50).optional(),
  montoMensual: z.number().min(0).default(0),
  diaPago: z.number().int().min(1).max(31).nullable().optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug, "caja");
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const max = await db.proveedor.aggregate({
    where: { clientId: g.tenant.id },
    _max: { orden: true },
  });
  const proveedor = await db.proveedor.create({
    data: {
      clientId: g.tenant.id,
      nombre: parsed.data.nombre,
      categoria: parsed.data.categoria,
      detalle: parsed.data.detalle || null,
      telefono: parsed.data.telefono || null,
      montoMensual: parsed.data.montoMensual,
      diaPago: parsed.data.diaPago ?? null,
      orden: (max._max.orden ?? 0) + 1,
    },
  });
  return NextResponse.json({ proveedor }, { status: 201 });
}
