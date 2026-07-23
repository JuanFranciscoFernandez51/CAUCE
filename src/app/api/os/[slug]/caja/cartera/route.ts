import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsOwnerApi } from "../../_guard";
import { noonArg } from "@/app/os/[slug]/_lib/finanzas";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  sentido: z.enum(["COBRAR", "PAGAR"]),
  cliente: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  tipo: z.string().trim().min(1).max(60),
  descripcion: z.string().trim().max(300).optional(),
  monto: z.number().finite().positive("El monto debe ser mayor a 0"),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  fechaVencimiento: z.string().regex(DATE_RE).nullable().optional(),
  observaciones: z.string().trim().max(300).optional(),
});

/** Alta de una cuenta a cobrar o a pagar (informativa, no toca la caja). */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const cuenta = await db.cuentaPorCobrar.create({
    data: {
      clientId: g.tenant.id,
      sentido: d.sentido,
      cliente: d.cliente,
      tipo: d.tipo,
      descripcion: d.descripcion || null,
      monto: d.monto,
      moneda: d.moneda,
      fechaVencimiento: d.fechaVencimiento ? noonArg(d.fechaVencimiento) : null,
      observaciones: d.observaciones || null,
    },
  });
  return NextResponse.json({ ok: true, cuenta }, { status: 201 });
}
