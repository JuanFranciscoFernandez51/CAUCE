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
    beneficiario: z.string().trim().min(1).max(120).optional(),
    monto: z.number().finite().positive().optional(),
    fechaVencimiento: z.string().regex(DATE_RE).optional(),
    formato: z.string().trim().max(40).optional(),
    observaciones: z.string().trim().max(300).nullable().optional(),
    estado: z.enum(["PENDIENTE", "CONCRETADO", "ANULADO"]).optional(),
    // Al concretar: ¿registrar el movimiento de caja? ¿en qué cuenta?
    crearMovimiento: z.boolean().optional(),
    cuentaId: z.string().trim().min(1).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Nada para actualizar" });

/** PATCH → editar / concretar (cobrado-pagado, con movimiento de caja opcional) / anular. */
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

  const actual = await db.cheque.findFirst({ where: { id, clientId } });
  if (!actual) return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 });

  const cuenta =
    d.estado === "CONCRETADO" && d.crearMovimiento && d.cuentaId
      ? await db.account.findFirst({ where: { id: d.cuentaId, clientId } })
      : null;
  if (d.estado === "CONCRETADO" && d.crearMovimiento && !cuenta) {
    return NextResponse.json({ error: "Cuenta inválida" }, { status: 400 });
  }

  try {
    const cheque = await db.$transaction(async (tx) => {
      const ch = await tx.cheque.update({
        where: { id },
        data: {
          beneficiario: d.beneficiario,
          monto: d.monto,
          fechaVencimiento: d.fechaVencimiento ? noonArg(d.fechaVencimiento) : undefined,
          formato: d.formato,
          observaciones: d.observaciones !== undefined ? d.observaciones || null : undefined,
          estado: d.estado,
          fechaConcretado:
            d.estado === undefined
              ? undefined
              : d.estado === "CONCRETADO"
                ? new Date()
                : null,
        },
      });

      // Cierre del círculo: al concretar, registrar el movimiento de caja.
      if (cuenta) {
        const esCobrar = ch.tipo === "A_COBRAR";
        await tx.cashMovement.create({
          data: {
            clientId,
            kind: esCobrar ? "venta" : "gasto",
            concept: `Cheque ${ch.beneficiario}`,
            categoria: esCobrar ? CATEGORIA_COBRO_AUTO : CATEGORIA_PAGO_AUTO,
            amountArs: ch.monto,
            moneda: cuenta.currency,
            accountId: cuenta.id,
            date: noonArg(argDateStr()),
          },
        });
        await recalcularBalances(tx, clientId, [cuenta.id]);
      }
      return ch;
    });
    return NextResponse.json({ ok: true, cheque });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el cheque" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;

  const result = await db.cheque.deleteMany({ where: { id, clientId: g.tenant.id } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
