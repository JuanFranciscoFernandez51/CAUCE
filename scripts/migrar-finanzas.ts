/**
 * Migración one-shot del módulo Finanzas (correr DESPUÉS de `npx prisma db push`):
 *
 * 1. Account.saldoInicial = balance actual − Σ(efecto de los movimientos existentes),
 *    para que "saldo inicial + movimientos = saldo actual" cierre con los datos
 *    reales que ya están cargados (avefenix y demos).
 * 2. CashMovement.moneda = moneda de su cuenta (los movimientos viejos no la tenían).
 *
 * Los movimientos existentes quedan con categoria = null → se muestran como
 * "Sin categoría" hasta que se les asigne una desde la lista.
 *
 * Idempotente: si se corre dos veces, recalcula lo mismo (saldoInicial se deriva
 * siempre de balance − movimientos, y balance no se toca acá).
 *
 * Uso: npx tsx scripts/migrar-finanzas.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type MovLite = {
  kind: string;
  amountArs: number;
  accountId: string | null;
  toAccountId: string | null;
};

/** Efecto del movimiento sobre el saldo de la cuenta `accountId`. */
function deltaPara(m: MovLite, accountId: string): number {
  if (m.kind === "transferencia") {
    if (m.toAccountId) {
      // Estilo viejo (1 fila): sale de accountId, entra a toAccountId.
      if (m.accountId === accountId) return -m.amountArs;
      if (m.toAccountId === accountId) return m.amountArs;
      return 0;
    }
    // Estilo nuevo (2 patas con signo).
    return m.accountId === accountId ? m.amountArs : 0;
  }
  if (m.accountId !== accountId) return 0;
  if (m.kind === "venta") return m.amountArs;
  if (m.kind === "gasto") return -m.amountArs;
  return m.amountArs; // ajuste (con signo)
}

async function main() {
  const accounts = await db.account.findMany();
  const movimientos = await db.cashMovement.findMany({
    select: { id: true, kind: true, amountArs: true, accountId: true, toAccountId: true, moneda: true },
  });

  console.log(`Cuentas: ${accounts.length} · Movimientos: ${movimientos.length}`);

  for (const a of accounts) {
    const neto = movimientos.reduce((s, m) => s + deltaPara(m, a.id), 0);
    const saldoInicial = a.balance - neto;
    await db.account.update({ where: { id: a.id }, data: { saldoInicial } });
    console.log(
      `  ${a.name} (${a.currency}): balance=${a.balance} neto=${neto} → saldoInicial=${saldoInicial}`
    );
  }

  // Moneda de cada movimiento = moneda de su cuenta (default ARS ya cubre el resto).
  for (const a of accounts.filter((x) => x.currency !== "ARS")) {
    const r = await db.cashMovement.updateMany({
      where: { accountId: a.id },
      data: { moneda: a.currency },
    });
    if (r.count) console.log(`  moneda ${a.currency} en ${r.count} movimientos de ${a.name}`);
  }

  console.log("Migración Finanzas OK.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
