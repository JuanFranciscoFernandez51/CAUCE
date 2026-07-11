import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { guardOsApi } from "../../_guard";
import { resolveOsRole, isOsOwner } from "@/app/os/[slug]/_components/os-role";
import { argDateStr, dayRange } from "@/app/os/[slug]/_lib/dates";
import { registrarActividad } from "@/lib/actividad";

const abrirSchema = z.object({
  action: z.literal("abrir"),
  saldos: z
    .array(
      z.object({
        moneda: z.enum(["ARS", "USD"]),
        saldoInicial: z.number().min(0).max(1_000_000_000),
      })
    )
    .min(1),
});

const cerrarSchema = z.object({
  action: z.literal("cerrar"),
  contados: z
    .array(
      z.object({
        moneda: z.enum(["ARS", "USD"]),
        contado: z.number().min(0).max(1_000_000_000),
      })
    )
    .min(1),
});

const bodySchema = z.discriminatedUnion("action", [abrirSchema, cerrarSchema]);

/** Efectivo del día en ARS según los movimientos (venta/gasto/ajuste con método efectivo). */
async function efectivoDelDia(clientId: string, fecha: string) {
  const { start, end } = dayRange(fecha);
  const movs = await db.cashMovement.findMany({
    where: { clientId, method: "efectivo", date: { gte: start, lt: end } },
    select: { kind: true, amountArs: true },
  });
  let ingresos = 0;
  let egresos = 0;
  for (const m of movs) {
    if (m.kind === "venta") ingresos += m.amountArs;
    else if (m.kind === "gasto") egresos += m.amountArs;
    else if (m.kind === "ajuste") {
      if (m.amountArs >= 0) ingresos += m.amountArs;
      else egresos += -m.amountArs;
    }
  }
  return { ingresos, egresos };
}

/**
 * Arqueo de caja del día (patrón La Base). Solo el dueño.
 * - abrir: crea el arqueo de HOY con saldo inicial por moneda.
 * - cerrar: toma la foto del efectivo del día (ARS desde los movimientos),
 *   guarda lo contado y deja la diferencia registrada.
 */
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const g = await guardOsApi(slug);
  if (g.error) return g.error;
  const session = await auth();
  const role = session ? await resolveOsRole(session.user.id, g.tenant.id) : null;
  if (!isOsOwner(role)) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const fecha = argDateStr();
  const usuario = session?.user?.name ?? null;

  if (body.action === "abrir") {
    const existente = await db.cajaDia.findUnique({
      where: { clientId_fecha: { clientId: g.tenant.id, fecha } },
    });
    if (existente) {
      return NextResponse.json({ error: "La caja de hoy ya está abierta" }, { status: 409 });
    }
    const caja = await db.cajaDia.create({
      data: {
        clientId: g.tenant.id,
        fecha,
        usuario,
        saldos: {
          create: body.saldos.map((s) => ({ moneda: s.moneda, saldoInicial: s.saldoInicial })),
        },
      },
      include: { saldos: true },
    });
    void registrarActividad(g.tenant.id, "caja_abierta", `Caja del ${fecha}`);
    return NextResponse.json({ ok: true, caja });
  }

  // cerrar
  const caja = await db.cajaDia.findUnique({
    where: { clientId_fecha: { clientId: g.tenant.id, fecha } },
    include: { saldos: true },
  });
  if (!caja) return NextResponse.json({ error: "La caja de hoy no está abierta" }, { status: 409 });
  if (caja.cerradaEl) return NextResponse.json({ error: "La caja de hoy ya está cerrada" }, { status: 409 });

  const { ingresos, egresos } = await efectivoDelDia(g.tenant.id, fecha);

  for (const c of body.contados) {
    const saldo = caja.saldos.find((s) => s.moneda === c.moneda);
    if (!saldo) continue;
    // ARS se reconcilia contra los movimientos; otras monedas contra el inicial.
    const ing = c.moneda === "ARS" ? ingresos : 0;
    const egr = c.moneda === "ARS" ? egresos : 0;
    const esperado = saldo.saldoInicial + ing - egr;
    await db.cajaSaldo.update({
      where: { id: saldo.id },
      data: {
        ingresos: ing,
        egresos: egr,
        contado: c.contado,
        diferencia: Math.round((c.contado - esperado) * 100) / 100,
      },
    });
  }

  const cerrada = await db.cajaDia.update({
    where: { id: caja.id },
    data: { cerradaEl: new Date(), usuario },
    include: { saldos: true },
  });
  void registrarActividad(g.tenant.id, "caja_cerrada", `Caja del ${fecha}`);
  return NextResponse.json({ ok: true, caja: cerrada });
}
