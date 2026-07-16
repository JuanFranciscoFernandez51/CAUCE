import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsApi } from "../../../_guard";
import { registrarActividad } from "@/lib/actividad";
import type { PagoVenta } from "@/app/os/[slug]/ventas/saldo";

const schema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  montoArs: z.number().min(1).max(10_000_000_000),
  medio: z.string().trim().max(50).default("efectivo"),
});

/** Suma un pago a la venta desde la lista (append atómico del lado del server). */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await ctx.params;
  const g = await guardOsApi(slug, "ventas");
  if (g.error) return g.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const venta = await db.venta.findFirst({ where: { id, clientId: g.tenant.id } });
  if (!venta) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const pagos = [...(((venta.pagos as PagoVenta[] | null) ?? [])), parsed.data];
  await db.venta.update({ where: { id: venta.id }, data: { pagos } });
  void registrarActividad(
    g.tenant.id,
    "venta_creada",
    `Pago $${Math.round(parsed.data.montoArs).toLocaleString("es-AR")} en V-${String(venta.numero).padStart(4, "0")}`
  );
  return NextResponse.json({ ok: true });
}
