import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../_guard";

const schema = z.object({
  nombre: z.string().trim().min(1).max(200),
  domicilio: z.string().trim().max(300).optional().default(""),
  telefono: z.string().trim().max(50).optional().default(""),
  datos: z.array(z.object({ etiqueta: z.string().max(60), valor: z.string().max(120) })).default([]),
  items: z
    .array(z.object({ detalle: z.string().trim().min(1).max(400), cant: z.number().min(0), unitario: z.number().min(0) }))
    .min(1),
  materiales: z.number().min(0).default(0),
  condiciones: z.string().trim().max(2000).optional().default(""),
});

/** Alta de presupuesto: numera secuencial por negocio y devuelve el link del PDF. */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revisá los datos" }, { status: 400 });
  const d = parsed.data;

  const ultimo = await db.presupuestoDoc.findFirst({
    where: { clientId: g.tenant!.id },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const condiciones =
    d.condiciones ||
    ((g.tenant!.settings as { condicionesPresupuesto?: string } | null)?.condicionesPresupuesto ?? "");

  const p = await db.presupuestoDoc.create({
    data: {
      clientId: g.tenant!.id,
      numero: (ultimo?.numero ?? 0) + 1,
      nombre: d.nombre,
      domicilio: d.domicilio || null,
      telefono: d.telefono || null,
      datos: d.datos,
      items: d.items,
      materiales: d.materiales,
      condiciones: condiciones || null,
      estado: "ENVIADO",
    },
    select: { id: true, numero: true },
  });
  return NextResponse.json(p, { status: 201 });
}
