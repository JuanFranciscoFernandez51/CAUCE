/**
 * Acceso a datos del módulo Finanzas (server-only): mapeos a views serializables,
 * seed de categorías default por tenant y recálculo del cache de saldos.
 */
import type { Account, CashMovement, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import {
  DEFAULT_CATEGORIAS_GASTO,
  DEFAULT_CATEGORIAS_INGRESO,
  cuentasAfectadas,
  deltaPara,
  type CategoriaFin,
  type CuentaFin,
  type MovFin,
} from "./finanzas";

// ── Views serializables (server → client components) ──

export function cuentaView(a: Account): CuentaFin {
  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    currency: a.currency,
    saldoInicial: a.saldoInicial,
    excluirDeResultado: a.excluirDeResultado,
    orden: a.orden,
    active: a.active,
  };
}

export function movView(m: CashMovement): MovFin {
  return {
    id: m.id,
    kind: m.kind,
    concept: m.concept,
    amountArs: m.amountArs,
    categoria: m.categoria,
    moneda: m.moneda,
    date: m.date.toISOString(),
    accountId: m.accountId,
    toAccountId: m.toAccountId,
    transferenciaId: m.transferenciaId,
    method: m.method,
    attachmentUrl: m.attachmentUrl,
  };
}

// ── Categorías: seed por tenant al entrar por primera vez ──

/**
 * Devuelve las categorías del tenant; si no tiene ninguna (primera visita),
 * siembra las default (6 ingresos / 10 gastos en criollo).
 */
export async function ensureCategorias(clientId: string): Promise<CategoriaFin[]> {
  const existentes = await db.categoriaFinanciera.findMany({
    where: { clientId },
    orderBy: [{ tipo: "asc" }, { orden: "asc" }],
  });
  if (existentes.length > 0) return existentes;

  await db.categoriaFinanciera.createMany({
    data: [
      ...DEFAULT_CATEGORIAS_INGRESO.map((nombre, i) => ({
        clientId,
        nombre,
        tipo: "INGRESO",
        orden: i,
      })),
      ...DEFAULT_CATEGORIAS_GASTO.map((nombre, i) => ({
        clientId,
        nombre,
        tipo: "GASTO",
        orden: i,
      })),
    ],
    skipDuplicates: true,
  });
  return db.categoriaFinanciera.findMany({
    where: { clientId },
    orderBy: [{ tipo: "asc" }, { orden: "asc" }],
  });
}

/** Nombres de categorías ACTIVAS separadas por tipo (para selects y resúmenes). */
export function nombresCategorias(cats: CategoriaFin[]): { ingreso: string[]; gasto: string[] } {
  return {
    ingreso: cats.filter((c) => c.activa && c.tipo === "INGRESO").map((c) => c.nombre),
    gasto: cats.filter((c) => c.activa && c.tipo === "GASTO").map((c) => c.nombre),
  };
}

// ── Cache de saldos (Account.balance = saldoInicial + Σ movimientos) ──

type DbLike = PrismaClient | Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Recalcula Account.balance de las cuentas indicadas desde cero
 * (saldoInicial + Σ efectos). Se llama después de CUALQUIER mutación que
 * toque movimientos o saldos iniciales, así el cache nunca se desvía.
 */
export async function recalcularBalances(
  tx: DbLike,
  clientId: string,
  accountIds: (string | null | undefined)[]
): Promise<void> {
  const ids = [...new Set(accountIds.filter(Boolean) as string[])];
  if (ids.length === 0) return;

  const [accounts, movs] = await Promise.all([
    tx.account.findMany({ where: { id: { in: ids }, clientId } }),
    tx.cashMovement.findMany({
      where: {
        clientId,
        OR: [{ accountId: { in: ids } }, { toAccountId: { in: ids } }],
      },
      select: { kind: true, amountArs: true, accountId: true, toAccountId: true },
    }),
  ]);

  for (const a of accounts) {
    const neto = movs.reduce((s, m) => s + deltaPara(m, a.id), 0);
    await tx.account.update({
      where: { id: a.id },
      data: { balance: a.saldoInicial + neto },
    });
  }
}

export { cuentasAfectadas };
