import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsOwnerApi } from "../../_guard";
import { noonArg } from "@/app/os/[slug]/_lib/finanzas";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  tipo: z.enum(["A_COBRAR", "A_PAGAR"]),
  beneficiario: z.string().trim().min(1, "El beneficiario es obligatorio").max(120),
  monto: z.number().finite().positive("El monto debe ser mayor a 0"),
  moneda: z.enum(["ARS", "USD"]).default("ARS"),
  fechaVencimiento: z.string().regex(DATE_RE, "Falta la fecha de vencimiento"),
  formato: z.string().trim().max(40).default("E-Cheq"),
  observaciones: z.string().trim().max(300).optional(),
});

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

  const cheque = await db.cheque.create({
    data: {
      clientId: g.tenant.id,
      tipo: d.tipo,
      beneficiario: d.beneficiario,
      monto: d.monto,
      moneda: d.moneda,
      fechaVencimiento: noonArg(d.fechaVencimiento),
      formato: d.formato,
      observaciones: d.observaciones || null,
    },
  });
  return NextResponse.json({ ok: true, cheque }, { status: 201 });
}
