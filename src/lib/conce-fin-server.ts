import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { nombreVehiculo, numeroOperacion } from "@/lib/conce";
import { planDeCuotas } from "@/lib/conce-fin";
import { registrarActividad } from "@/lib/actividad";

/**
 * Lado server de las financiaciones propias: numeración por tenant, alta del
 * plan de cuotas y el automatismo "boleto concretado con financiación propia
 * → financiación armada sola".
 */

type Tx = Prisma.TransactionClient | PrismaClient;

/** Próximo FIN-xxxx del tenant. */
export async function proximoNumeroFinanciacion(tx: Tx, clientId: string): Promise<number> {
  const ultima = await tx.conceFinanciacion.findFirst({
    where: { clientId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (ultima?.numero ?? 0) + 1;
}

export type NuevaFinanciacion = {
  contactId?: string | null;
  operacionId?: string | null;
  descripcion?: string | null;
  origen?: "MANUAL" | "BOLETO_AUTOMATICA";
  montoTotal: number;
  entrega?: number;
  cantidadCuotas: number;
  valorCuota?: number | null;
  moneda?: string;
  fechaInicio?: Date;
  diaVencimiento?: number;
  observaciones?: string | null;
};

/** Crea la financiación CON su plan de cuotas en una sola pasada. */
export async function crearFinanciacion(
  tx: Tx,
  clientId: string,
  datos: NuevaFinanciacion
): Promise<{ id: string; numero: number }> {
  const fechaInicio = datos.fechaInicio ?? new Date();
  const diaVencimiento = datos.diaVencimiento ?? 10;
  const cuotas = planDeCuotas({
    montoTotal: datos.montoTotal,
    cantidadCuotas: datos.cantidadCuotas,
    valorCuota: datos.valorCuota,
    fechaInicio,
    diaVencimiento,
  });

  const fin = await tx.conceFinanciacion.create({
    data: {
      clientId,
      numero: await proximoNumeroFinanciacion(tx, clientId),
      contactId: datos.contactId || null,
      operacionId: datos.operacionId || null,
      descripcion: datos.descripcion || null,
      origen: datos.origen ?? "MANUAL",
      montoTotal: datos.montoTotal,
      entrega: datos.entrega ?? 0,
      cantidadCuotas: cuotas.length,
      valorCuota: cuotas[0]?.monto ?? 0,
      moneda: datos.moneda === "USD" ? "USD" : "ARS",
      fechaInicio,
      diaVencimiento,
      observaciones: datos.observaciones || null,
    },
    select: { id: true, numero: true },
  });

  await tx.conceCuota.createMany({
    data: cuotas.map((c) => ({
      clientId,
      financiacionId: fin.id,
      numero: c.numero,
      monto: c.monto,
      fechaVencimiento: c.fechaVencimiento,
    })),
  });

  return fin;
}

/**
 * Rearma el plan de cuotas de una financiación (cuando cambian monto, cantidad
 * o día de vencimiento). Respeta lo YA COBRADO: las cuotas con pagos quedan
 * como están y se recalculan sólo las que no tienen un peso encima.
 */
export async function regenerarCuotas(clientId: string, financiacionId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const fin = await tx.conceFinanciacion.findFirst({
      where: { id: financiacionId, clientId },
      include: { cuotas: { orderBy: { numero: "asc" } } },
    });
    if (!fin) return;

    const cobradas = fin.cuotas.filter((c) => c.montoPagado > 0);
    const yaCobrado = cobradas.reduce((a, c) => a + c.montoPagado, 0);

    await tx.conceCuota.deleteMany({
      where: { financiacionId: fin.id, montoPagado: { lte: 0 } },
    });

    const desde = cobradas.length;
    if (fin.cantidadCuotas <= desde) return;

    // Las FECHAS salen de la serie mensual completa (para que la cuota 5 siga
    // venciendo en su mes) y los MONTOS reparten sólo lo que falta cobrar.
    const fechas = planDeCuotas({
      montoTotal: fin.montoTotal,
      cantidadCuotas: fin.cantidadCuotas,
      valorCuota: null,
      fechaInicio: fin.fechaInicio,
      diaVencimiento: fin.diaVencimiento,
    });
    const montos = planDeCuotas({
      montoTotal: Math.max(0, fin.montoTotal - yaCobrado),
      cantidadCuotas: fin.cantidadCuotas - desde,
      valorCuota: fin.valorCuota,
      fechaInicio: fin.fechaInicio,
      diaVencimiento: fin.diaVencimiento,
    });

    await tx.conceCuota.createMany({
      data: montos.map((m, i) => ({
        clientId,
        financiacionId: fin.id,
        numero: desde + i + 1,
        monto: m.monto,
        fechaVencimiento: fechas[desde + i]!.fechaVencimiento,
      })),
    });
  });
}

/** Recalcula el estado de la financiación mirando sus cuotas. */
export async function recalcularEstadoFinanciacion(
  clientId: string,
  financiacionId: string
): Promise<void> {
  const fin = await db.conceFinanciacion.findFirst({
    where: { id: financiacionId, clientId },
    include: { cuotas: { select: { monto: true, montoPagado: true } } },
  });
  if (!fin || fin.estado === "CANCELADA") return;
  const pendiente = fin.cuotas.some((c) => c.montoPagado < c.monto - 0.5);
  const nuevo = pendiente ? "ACTIVA" : "COMPLETADA";
  if (nuevo !== fin.estado) {
    await db.conceFinanciacion.update({ where: { id: fin.id }, data: { estado: nuevo } });
  }
}

/** ¿La forma de pago del boleto dice "financiación propia de la casa"? */
export function esFinanciacionPropia(formaPago: string | null | undefined): boolean {
  return (formaPago ?? "").toLowerCase().includes("financ");
}

/**
 * BOLETO CONCRETADO CON FINANCIACIÓN PROPIA → arma la financiación y sus
 * cuotas solo. Idempotente: si el boleto ya tiene financiación, no duplica.
 * Financia el saldo (precio − seña − permutas tomadas).
 */
export async function financiacionDeBoleto(opts: {
  clientId: string;
  operacionId: string;
}): Promise<{ creada: boolean; numero?: number }> {
  const resultado = await db.$transaction(async (tx) => {
    const op = await tx.conceOperacion.findFirst({
      where: { id: opts.operacionId, clientId: opts.clientId },
      include: {
        vehiculo: { select: { marca: true, modelo: true, version: true, anio: true } },
      },
    });
    if (!op || op.tipo !== "BOLETO") return { creada: false as const };
    if (!esFinanciacionPropia(op.formaPago)) return { creada: false as const };

    const yaTiene = await tx.conceFinanciacion.findFirst({
      where: { clientId: opts.clientId, operacionId: op.id },
      select: { id: true },
    });
    if (yaTiene) return { creada: false as const }; // idempotencia

    const permutas = Array.isArray(op.permutas)
      ? (op.permutas as { valorTomado?: number }[]).reduce(
          (a, p) => a + (Number(p?.valorTomado) || 0),
          0
        )
      : 0;
    const entrega = (op.sena ?? 0) + permutas;
    const aFinanciar = Math.max(0, (op.precio ?? 0) - entrega);
    if (aFinanciar <= 0) return { creada: false as const };

    const descripcion = op.vehiculo
      ? `${nombreVehiculo(op.vehiculo)} ${op.vehiculo.anio}`
      : op.vehiculoTexto || [op.vehMarca, op.vehModelo, op.vehAnio].filter(Boolean).join(" ") || null;

    const cantidadCuotas = op.finCuotas && op.finCuotas > 0 ? op.finCuotas : 12;

    const fin = await crearFinanciacion(tx, opts.clientId, {
      contactId: op.contactId,
      operacionId: op.id,
      descripcion,
      origen: "BOLETO_AUTOMATICA",
      montoTotal: aFinanciar,
      entrega,
      cantidadCuotas,
      valorCuota: op.finValorCuota,
      moneda: op.moneda,
      fechaInicio: new Date(),
      diaVencimiento: op.finDiaVenc ?? 10,
      observaciones: `Generada sola al entregar el boleto ${numeroOperacion(op.tipo, op.numero)}.`,
    });
    return { creada: true as const, numero: fin.numero, ref: numeroOperacion(op.tipo, op.numero), nombre: op.nombre };
  });

  if (resultado.creada) {
    await registrarActividad(
      opts.clientId,
      "financiacion_creada",
      `FIN-${String(resultado.numero).padStart(4, "0")} armada sola desde ${resultado.ref} — ${resultado.nombre}`
    );
  }
  return resultado.creada ? { creada: true, numero: resultado.numero } : { creada: false };
}
