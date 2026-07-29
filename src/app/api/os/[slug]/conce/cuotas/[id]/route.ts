import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardConceApi } from "../../_guard";
import { recalcularEstadoFinanciacion } from "@/lib/conce-fin-server";
import { registrarActividad } from "@/lib/actividad";
import { fmtPlata, numeroFinanciacion } from "@/lib/conce-fin";

/**
 * Cobro de una cuota: total en un clic, parcial cargando cuánto entró, o
 * marcar que ya se le avisó por WhatsApp. La financiación se cierra sola
 * cuando no queda nada pendiente.
 */
const patchSchema = z
  .object({
    /** "pagar" cobra todo el saldo; "parcial" usa montoPagado; "deshacer" vuelve atrás. */
    accion: z.enum(["pagar", "parcial", "deshacer", "avisado"]),
    montoPagado: z.number().min(0),
    monto: z.number().min(0),
    fechaVencimiento: z.string().trim(),
    metodoPago: z.string().trim().max(40).nullable(),
    comprobante: z.string().trim().max(120).nullable(),
    observaciones: z.string().trim().max(500).nullable(),
  })
  .partial();

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardConceApi(slug);
  if (g.error) return g.error;

  const cuota = await db.conceCuota.findFirst({
    where: { id, clientId: g.tenant.id },
    include: {
      financiacion: { select: { id: true, numero: true, moneda: true, descripcion: true } },
    },
  });
  if (!cuota) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const monto = d.monto ?? cuota.monto;
  let montoPagado = d.montoPagado ?? cuota.montoPagado;
  let fechaPago: Date | null = cuota.fechaPago;

  if (d.accion === "pagar") {
    montoPagado = monto;
    fechaPago = new Date();
  } else if (d.accion === "parcial") {
    montoPagado = Math.min(monto, Math.max(0, d.montoPagado ?? 0));
    fechaPago = montoPagado > 0 ? (cuota.fechaPago ?? new Date()) : null;
  } else if (d.accion === "deshacer") {
    montoPagado = 0;
    fechaPago = null;
  } else if (d.montoPagado !== undefined) {
    montoPagado = Math.min(monto, Math.max(0, d.montoPagado));
    fechaPago = montoPagado > 0 ? (cuota.fechaPago ?? new Date()) : null;
  }

  const vencimiento = d.fechaVencimiento
    ? new Date(`${d.fechaVencimiento}T12:00:00-03:00`)
    : cuota.fechaVencimiento;
  const pagada = montoPagado >= monto - 0.5;
  const estado = pagada ? "PAGADA" : vencimiento.getTime() < Date.now() ? "VENCIDA" : "PENDIENTE";

  await db.conceCuota.update({
    where: { id },
    data: {
      monto,
      montoPagado,
      fechaPago,
      fechaVencimiento: vencimiento,
      estado,
      ...(d.metodoPago !== undefined ? { metodoPago: d.metodoPago } : {}),
      ...(d.comprobante !== undefined ? { comprobante: d.comprobante } : {}),
      ...(d.observaciones !== undefined ? { observaciones: d.observaciones } : {}),
      ...(d.accion === "avisado" ? { avisadoEl: new Date() } : {}),
    },
  });

  await recalcularEstadoFinanciacion(g.tenant.id, cuota.financiacionId);

  if (d.accion === "pagar" || d.accion === "parcial") {
    await registrarActividad(
      g.tenant.id,
      "cuota_pagada",
      `${numeroFinanciacion(cuota.financiacion.numero)} · cuota ${cuota.numero} — ${fmtPlata(
        montoPagado,
        cuota.financiacion.moneda
      )}${cuota.financiacion.descripcion ? ` (${cuota.financiacion.descripcion})` : ""}`
    );
  } else if (d.accion === "avisado") {
    await registrarActividad(
      g.tenant.id,
      "cuota_aviso",
      `${numeroFinanciacion(cuota.financiacion.numero)} · cuota ${cuota.numero}`
    );
  }

  return NextResponse.json({ ok: true });
}
