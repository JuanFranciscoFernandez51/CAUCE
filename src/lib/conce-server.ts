import type { Client, Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { recalcularBalances } from "@/app/os/[slug]/_lib/finanzas-data";
import { nombreVehiculo } from "@/lib/conce";

/**
 * Lado server del template CONCESIONARIA: tenant, settings tipados y efectos
 * de "operación concretada" (boleto → ingreso en Finanzas + vehículo vendido).
 */

// ── Tenant ────────────────────────────────────────────────────────────────

export function esConcesionaria(tenant: Client): boolean {
  return (tenant.settings as { template?: string } | null)?.template === "concesionaria";
}

export type ConceSucursal = { direccion: string; maps?: string; whatsapp?: string };

/** Settings tipados que usa el sitio de la concesionaria. */
export type ConceSettings = {
  eslogan?: string;
  claim?: string;
  instagram?: string;
  facebook?: string;
  mercadolibre?: string;
  horarios?: string;
  sucursales?: ConceSucursal[];
  whatsapps?: string[]; // solo dígitos con 549...
  nosotros?: {
    historia?: string;
    numeros?: { valor: string; label: string }[];
    valores?: (string | { nombre: string; texto?: string })[];
  };
  serviciosFooter?: string[];
  logoOscuro?: string; // logo para fondo negro (header/footer)
};

export function conceSettings(tenant: Client): ConceSettings {
  return (tenant.settings as ConceSettings | null) ?? {};
}

// ── Slug único por tenant ─────────────────────────────────────────────────

type Tx = Prisma.TransactionClient | PrismaClient;

export async function slugUnicoVehiculo(
  tx: Tx,
  clientId: string,
  base: string,
  ignorarId?: string
): Promise<string> {
  const { slugify } = await import("@/lib/bazar");
  const baseSlug = slugify(base) || "vehiculo";
  let candidato = baseSlug;
  for (let n = 2; n < 1000; n++) {
    const existe = await tx.conceVehiculo.findFirst({
      where: { clientId, slug: candidato, ...(ignorarId ? { id: { not: ignorarId } } : {}) },
      select: { id: true },
    });
    if (!existe) return candidato;
    candidato = `${baseSlug}-${n}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

/** Próximo número de mandato/boleto del tenant (secuencial por tipo). */
export async function proximoNumeroOperacion(
  tx: Tx,
  clientId: string,
  tipo: string
): Promise<number> {
  const ultimo = await tx.conceOperacion.findFirst({
    where: { clientId, tipo },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (ultimo?.numero ?? 0) + 1;
}

// ── Efectos de "boleto concretado" ────────────────────────────────────────

/**
 * Concreta una operación con TODOS sus efectos (idempotente):
 * - BOLETO con precio → CashMovement de ingreso "Venta de vehículos" en la
 *   cuenta que corresponda a la moneda (USD → cuenta dolares; ARS → efectivo/banco).
 * - BOLETO con vehículo del stock → vehículo pasa a "vendido".
 * - MANDATO concretado con vehículo → vehículo pasa a "vendido" y, si hay
 *   comisión, ingreso "Comisiones por consignación".
 */
export async function concretarOperacion(opts: {
  clientId: string;
  operacionId: string;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const op = await tx.conceOperacion.findFirst({
      where: { id: opts.operacionId, clientId: opts.clientId },
    });
    if (!op || op.estado === "CONCRETADA") return; // idempotencia

    await tx.conceOperacion.update({
      where: { id: op.id },
      data: { estado: "CONCRETADA" },
    });

    if (op.vehiculoId) {
      await tx.conceVehiculo.updateMany({
        where: { id: op.vehiculoId, clientId: opts.clientId },
        data: { estado: "vendido" },
      });
    }

    // Ingreso en Finanzas
    const esBoleto = op.tipo === "BOLETO";
    const monto = esBoleto
      ? (op.precio ?? 0)
      : op.precio && op.comisionPct
        ? Math.round(op.precio * (op.comisionPct / 100))
        : 0;
    if (monto <= 0) return;

    const cuenta =
      (await tx.account.findFirst({
        where: {
          clientId: opts.clientId,
          active: true,
          currency: op.moneda === "USD" ? "USD" : "ARS",
        },
        orderBy: { orden: "asc" },
      })) ??
      (await tx.account.findFirst({
        where: { clientId: opts.clientId, active: true },
        orderBy: { orden: "asc" },
      }));
    if (!cuenta) return; // sin Finanzas configuradas: no rompemos

    const vehiculo = op.vehiculoId
      ? await tx.conceVehiculo.findFirst({
          where: { id: op.vehiculoId, clientId: opts.clientId },
          select: { marca: true, modelo: true, version: true, anio: true },
        })
      : null;
    const detalleVehiculo = vehiculo
      ? `${nombreVehiculo(vehiculo)} ${vehiculo.anio}`
      : (op.vehiculoTexto ?? "vehículo");

    await tx.cashMovement.create({
      data: {
        clientId: opts.clientId,
        kind: "venta",
        concept: esBoleto
          ? `Venta ${detalleVehiculo} — ${op.nombre} (Boleto #${op.numero})`
          : `Comisión consignación ${detalleVehiculo} (Mandato #${op.numero})`,
        categoria: esBoleto ? "Venta de vehículos" : "Comisiones por consignación",
        amountArs: monto,
        moneda: cuenta.currency,
        method: op.formaPago === "contado" ? "efectivo" : "transferencia",
        accountId: cuenta.id,
        date: new Date(),
      },
    });
    await recalcularBalances(tx, opts.clientId, [cuenta.id]);
  });
}
