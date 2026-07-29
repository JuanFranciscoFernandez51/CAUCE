import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";
import { recalcularEstadoFinanciacion, regenerarCuotas } from "@/lib/conce-fin-server";

/**
 * Edición de una financiación (inline desde la lista o desde la ficha).
 * Si tocan monto, cantidad de cuotas o día de vencimiento, el plan de cuotas
 * se rearma solo RESPETANDO lo ya cobrado.
 */
const patchSchema = z
  .object({
    descripcion: z.string().trim().max(200).nullable(),
    montoTotal: z.number().min(0),
    entrega: z.number().min(0),
    cantidadCuotas: z.number().int().min(1).max(120),
    valorCuota: z.number().min(0).nullable(),
    moneda: z.enum(["ARS", "USD"]),
    fechaInicio: z.string().trim(),
    diaVencimiento: z.number().int().min(1).max(28),
    estado: z.enum(["ACTIVA", "COMPLETADA", "CANCELADA"]),
    observaciones: z.string().trim().max(2000).nullable(),
  })
  .partial();

const REARMA = ["montoTotal", "cantidadCuotas", "valorCuota", "diaVencimiento", "fechaInicio"];

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const fin = await db.conceFinanciacion.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!fin) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const { fechaInicio, valorCuota, ...resto } = parsed.data;

  await db.conceFinanciacion.update({
    where: { id },
    data: {
      ...resto,
      ...(valorCuota != null ? { valorCuota } : {}),
      ...(fechaInicio ? { fechaInicio: new Date(`${fechaInicio}T12:00:00-03:00`) } : {}),
    },
  });

  if (Object.keys(parsed.data).some((k) => REARMA.includes(k))) {
    await regenerarCuotas(g.tenant.id, id);
  }
  await recalcularEstadoFinanciacion(g.tenant.id, id);

  const financiacion = await db.conceFinanciacion.findFirst({
    where: { id, clientId: g.tenant.id },
  });
  return NextResponse.json({ ok: true, financiacion });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const fin = await db.conceFinanciacion.findFirst({
    where: { id, clientId: g.tenant.id },
    select: { id: true },
  });
  if (!fin) return NextResponse.json({ error: "No existe" }, { status: 404 });

  await db.conceFinanciacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
