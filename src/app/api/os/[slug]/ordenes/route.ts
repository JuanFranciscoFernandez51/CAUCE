import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { esVidrios } from "@/lib/vidrios";
import { guardOsApi } from "../_guard";

/**
 * Órdenes de pedido del template VIDRIOS (reusan PresupuestoDoc, ver src/lib/vidrios.ts).
 * Al crear: numera secuencial por negocio y hermana el cliente al CRM
 * (dedup por teléfono y si no por nombre; si es nuevo lo crea como contacto).
 */
const schema = z.object({
  nombre: z.string().trim().min(1, "Falta el cliente").max(200),
  telefono: z.string().trim().max(50).optional().default(""),
  vehiculo: z
    .object({
      marca: z.string().trim().max(60).optional().default(""),
      modelo: z.string().trim().max(60).optional().default(""),
      patente: z.string().trim().max(20).optional().default(""),
    })
    .optional()
    .default({ marca: "", modelo: "", patente: "" }),
  items: z
    .array(
      z.object({
        codigo: z.string().trim().max(60).optional().default(""),
        detalle: z.string().trim().min(1).max(400),
        cant: z.number().min(0),
        unitario: z.number().min(0),
      })
    )
    .min(1, "Cargá al menos un ítem"),
  senia: z.number().min(0).default(0),
});

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  if (!esVidrios(g.tenant)) return NextResponse.json({ error: "No disponible" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revisá los datos" }, { status: 400 });
  }
  const d = parsed.data;
  const clientId = g.tenant.id;

  // El cliente de la orden entra (o se actualiza) en el CRM único del negocio.
  const telefono = d.telefono.replace(/[^\d+]/g, "");
  const existente = await db.contact.findFirst({
    where: {
      clientId,
      OR: [
        ...(telefono ? [{ phone: { contains: telefono.slice(-8) } }] : []),
        { name: { equals: d.nombre, mode: "insensitive" as const } },
      ],
    },
    select: { id: true, phone: true },
  });
  if (existente) {
    if (!existente.phone && d.telefono) {
      await db.contact.update({ where: { id: existente.id }, data: { phone: d.telefono, lastTouchAt: new Date() } });
    } else {
      await db.contact.update({ where: { id: existente.id }, data: { lastTouchAt: new Date() } });
    }
  } else {
    await db.contact.create({
      data: { clientId, name: d.nombre, phone: d.telefono || null, source: "orden", stage: "cliente" },
    });
  }

  const ultimo = await db.presupuestoDoc.findFirst({
    where: { clientId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });

  const orden = await db.presupuestoDoc.create({
    data: {
      clientId,
      numero: (ultimo?.numero ?? 0) + 1,
      nombre: d.nombre,
      telefono: d.telefono || null,
      datos: { tipo: "orden", vehiculo: d.vehiculo, senia: d.senia, facturacion: "sin_facturar" },
      items: d.items,
      estado: "PENDIENTE",
    },
    select: { id: true, numero: true },
  });
  return NextResponse.json(orden, { status: 201 });
}
