import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../_guard";
import { registrarActividad } from "@/lib/actividad";

/** Alta de proveedor desde el módulo Proveedores de la concesionaria. */
const createSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  rubro: z.string().trim().max(80).optional(),
  cuit: z.string().trim().max(20).optional(),
  telefono: z.string().trim().max(50).optional(),
  email: z.string().trim().max(120).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardConceApi(slug);
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
      categoria: "insumos",
      rubro: parsed.data.rubro || null,
      cuit: parsed.data.cuit || null,
      telefono: parsed.data.telefono || null,
      email: parsed.data.email || null,
      orden: (max._max.orden ?? 0) + 1,
    },
    select: { id: true, nombre: true },
  });
  await registrarActividad(g.tenant.id, "proveedor_creado", proveedor.nombre);
  return NextResponse.json({ proveedor }, { status: 201 });
}
