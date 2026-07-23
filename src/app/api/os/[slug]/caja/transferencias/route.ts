import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { guardOsOwnerApi } from "../../_guard";
import { CATEGORIA_TRANSFERENCIA, noonArg } from "@/app/os/[slug]/_lib/finanzas";
import { recalcularBalances } from "@/app/os/[slug]/_lib/finanzas-data";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z
  .object({
    date: z.string().regex(DATE_RE),
    origenId: z.string().trim().min(1, "Elegí la cuenta de origen"),
    destinoId: z.string().trim().min(1, "Elegí la cuenta de destino"),
    montoOrigen: z.number().finite().positive("Ingresá el monto que sale"),
    montoDestino: z.number().finite().positive().optional(), // cambio de divisa
    descripcion: z.string().trim().max(200).default(""),
  })
  .refine((d) => d.origenId !== d.destinoId, {
    message: "Origen y destino deben ser cuentas distintas",
    path: ["destinoId"],
  });

/**
 * Transferencia entre cuentas: crea las DOS patas (salida negativa en origen,
 * entrada positiva en destino) unidas por transferenciaId. Si las cuentas son
 * de distinta moneda, montoDestino permite el cambio de divisa.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsOwnerApi(slug, "caja");
  if (g.error) return g.error;
  const clientId = g.tenant.id;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const [origen, destino] = await Promise.all([
    db.account.findFirst({ where: { id: d.origenId, clientId } }),
    db.account.findFirst({ where: { id: d.destinoId, clientId } }),
  ]);
  if (!origen || !destino) {
    return NextResponse.json({ error: "Cuenta inválida" }, { status: 400 });
  }

  const montoDestino = d.montoDestino ?? d.montoOrigen;
  const transferenciaId = randomUUID();
  const concept = d.descripcion || `Transferencia ${origen.name} → ${destino.name}`;
  const when = noonArg(d.date);

  try {
    await db.$transaction(async (tx) => {
      await tx.cashMovement.createMany({
        data: [
          {
            clientId,
            kind: "transferencia",
            concept,
            categoria: CATEGORIA_TRANSFERENCIA,
            amountArs: -d.montoOrigen, // sale
            moneda: origen.currency,
            accountId: origen.id,
            transferenciaId,
            date: when,
          },
          {
            clientId,
            kind: "transferencia",
            concept,
            categoria: CATEGORIA_TRANSFERENCIA,
            amountArs: montoDestino, // entra
            moneda: destino.currency,
            accountId: destino.id,
            transferenciaId,
            date: when,
          },
        ],
      });
      await recalcularBalances(tx, clientId, [origen.id, destino.id]);
    });
    return NextResponse.json({ ok: true, transferenciaId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la transferencia" }, { status: 500 });
  }
}
