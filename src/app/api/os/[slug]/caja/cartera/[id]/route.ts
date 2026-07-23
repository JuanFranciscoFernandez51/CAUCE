import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsOwnerApi } from "../../../_guard";
import {
  CATEGORIA_COBRO_AUTO,
  CATEGORIA_PAGO_AUTO,
  noonArg,
} from "@/app/os/[slug]/_lib/finanzas";
import { recalcularBalances } from "@/app/os/[slug]/_lib/finanzas-data";
import { argDateStr } from "@/app/os/[slug]/_lib/dates";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const patchSchema = z
  .object({
    cliente: z.string().trim().min(1).max(120).optional(),
    tipo: z.string().trim().min(1).max(60).optional(),
    descripcion: z.string().trim().max(300).nullable().optional(),
    monto: z.number().finite().positive().optional(),
    moneda: z.enum(["ARS", "USD"]).optional(),
    fechaVencimiento: z.string().regex(DATE_RE).nullable().optional(),
    observaciones: z.string().trim().max(300).nullable().optional(),
    estado: z.enum(["PENDIENTE", "COBRADO"]).optional(),
    // Al marcar cobrada/pagada: ¿registrar el movimiento de caja? ¿en qué cuenta?
    crearMovimiento: z.boolean().optional(),
    cuentaId: z.string().trim().min(1).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nada para actualizar" });

/** PATCH → editar / marcar cobrada-pagada (con movimiento de caja opcional) / volver a pendiente. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;
  const clientId = g.tenant.id;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const actual = await db.cuentaPorCobrar.findFirst({ where: { id, clientId } });
  if (!actual) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const cuenta =
    d.estado === "COBRADO" && d.crearMovimiento && d.cuentaId
      ? await db.account.findFirst({ where: { id: d.cuentaId, clientId } })
      : null;
  if (d.estado === "COBRADO" && d.crearMovimiento && !cuenta) {
    return NextResponse.json({ error: "Cuenta inválida" }, { status: 400 });
  }

  try {
    const registro = await db.$transaction(async (tx) => {
      const r = await tx.cuentaPorCobrar.update({
        where: { id },
        data: {
          cliente: d.cliente,
          tipo: d.tipo,
          descripcion: d.descripcion !== undefined ? d.descripcion || null : undefined,
          monto: d.monto,
          moneda: d.moneda,
          fechaVencimiento:
            d.fechaVencimiento !== undefined
              ? d.fechaVencimiento
                ? noonArg(d.fechaVencimiento)
                : null
              : undefined,
          observaciones: d.observaciones !== undefined ? d.observaciones || null : undefined,
          estado: d.estado,
          fechaCobro:
            d.estado === undefined ? undefined : d.estado === "COBRADO" ? new Date() : null,
        },
      });

      // Cierre del círculo: registrar el movimiento de caja al cobrar/pagar.
      if (cuenta) {
        const esCobrar = r.sentido === "COBRAR";
        await tx.cashMovement.create({
          data: {
            clientId,
            kind: esCobrar ? "venta" : "gasto",
            concept: `${esCobrar ? "Cobro" : "Pago"} ${r.cliente}${r.descripcion ? ` — ${r.descripcion}` : ""}`,
            categoria: esCobrar ? CATEGORIA_COBRO_AUTO : CATEGORIA_PAGO_AUTO,
            amountArs: r.monto,
            moneda: cuenta.currency,
            accountId: cuenta.id,
            date: noonArg(argDateStr()),
          },
        });
        await recalcularBalances(tx, clientId, [cuenta.id]);
      }
      return r;
    });
    return NextResponse.json({ ok: true, cuenta: registro });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;

  const result = await db.cuentaPorCobrar.deleteMany({ where: { id, clientId: g.tenant.id } });
  if (result.count === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
