/**
 * Siembra cuentas + movimientos vinculados (Finanzas) y entradas de ficha
 * (ContactRecord) para que los módulos nuevos se vean vivos. Idempotente.
 * Uso: npx tsx scripts/seed-finanzas-fichas.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CUENTAS_BASE = [
  { name: "Efectivo", kind: "efectivo", currency: "ARS" },
  { name: "Mercado Pago", kind: "mp", currency: "ARS" },
  { name: "Banco", kind: "banco", currency: "ARS" },
];

// rubros con caja/finanzas
const CON_CAJA = ["estudiocontablegimenez", "distribuidoracarusomayorista", "hotelcostamedanos", "labasse"];

// fichas por rubro (slug -> entradas)
const FICHAS: Record<string, { type: string; title: string; summary: string; fields: Record<string, string> }[]> = {
  clinicadentaliriarte: [
    { type: "consulta", title: "Primera consulta", summary: "Control general + radiografía panorámica", fields: { motivo: "Dolor molar inferior derecho", diagnostico: "Caries profunda pieza 46", tratamiento: "Se indica conducto", indicaciones: "Ibuprofeno 400 cada 8hs" } },
    { type: "tratamiento", title: "Endodoncia pieza 46", summary: "Tratamiento de conducto sesión 1", fields: { tratamiento: "Apertura y conductometría", indicaciones: "Volver en 7 días" } },
    { type: "control", title: "Control post-tratamiento", summary: "Cicatrización correcta, sin dolor", fields: { diagnostico: "Evolución favorable" } },
  ],
  tallerfuneshnos: [
    { type: "service", title: "Service de 10.000 km", summary: "Cambio de aceite y filtros", fields: { vehiculo: "Toyota Hilux", patente: "AD123CD", km: "98000", trabajo: "Aceite + filtro aire/aceite", repuestos: "Filtro Mann, aceite 10W40" } },
    { type: "reparacion", title: "Cambio de pastillas", summary: "Frenos delanteros", fields: { km: "99500", trabajo: "Pastillas delanteras", repuestos: "Pastillas Ferodo" } },
  ],
  peluquerialucas: [
    { type: "servicio", title: "Color + corte", summary: "Cliente habitual", fields: { servicio: "Coloración", formula: "7.1 + 10 vol", productos: "Wella Koleston" } },
  ],
};

const at = (daysAgo: number, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, 0, 0, 0);
  return d;
};

async function main() {
  // ── Finanzas ──
  for (const slug of CON_CAJA) {
    const c = await db.client.findUnique({ where: { slug } });
    if (!c) continue;
    if ((await db.account.count({ where: { clientId: c.id } })) > 0) {
      console.log(`finanzas ${slug}: ya tiene cuentas, salteo`);
    } else {
      const cuentas = [];
      for (const base of CUENTAS_BASE) {
        cuentas.push(await db.account.create({ data: { clientId: c.id, ...base, balance: 0 } }));
      }
      // mover los CashMovement existentes a una cuenta y recalcular saldos
      const movs = await db.cashMovement.findMany({ where: { clientId: c.id, accountId: null } });
      const saldos: Record<string, number> = {};
      for (const [i, m] of movs.entries()) {
        const acc = cuentas[i % cuentas.length];
        await db.cashMovement.update({ where: { id: m.id }, data: { accountId: acc.id, date: m.createdAt } });
        const delta = m.kind === "gasto" ? -m.amountArs : m.amountArs;
        saldos[acc.id] = (saldos[acc.id] ?? 0) + delta;
      }
      // sumar movimientos de meses anteriores para que el dashboard anual tenga historia
      for (let mes = 1; mes <= 5; mes++) {
        const acc = cuentas[mes % cuentas.length];
        const venta = 180000 + mes * 24000;
        await db.cashMovement.create({ data: { clientId: c.id, kind: "venta", concept: `Ventas consolidadas`, amountArs: venta, method: "transferencia", accountId: acc.id, date: at(mes * 30) } });
        const gasto = 60000 + mes * 8000;
        await db.cashMovement.create({ data: { clientId: c.id, kind: "gasto", concept: "Gastos del mes", amountArs: gasto, method: "efectivo", accountId: cuentas[0].id, date: at(mes * 30 + 2) } });
        saldos[acc.id] = (saldos[acc.id] ?? 0) + venta;
        saldos[cuentas[0].id] = (saldos[cuentas[0].id] ?? 0) - gasto;
      }
      for (const acc of cuentas) {
        await db.account.update({ where: { id: acc.id }, data: { balance: Math.round(saldos[acc.id] ?? 0) } });
      }
      console.log(`finanzas ${slug}: 3 cuentas + saldos recalculados`);
    }
  }

  // ── Fichas / historia ──
  for (const [slug, entradas] of Object.entries(FICHAS)) {
    const c = await db.client.findUnique({ where: { slug } });
    if (!c) continue;
    if ((await db.contactRecord.count({ where: { clientId: c.id } })) > 0) {
      console.log(`fichas ${slug}: ya tiene, salteo`);
      continue;
    }
    // tomar los primeros contactos del tenant para colgarles fichas
    const contacts = await db.contact.findMany({ where: { clientId: c.id }, take: 3, orderBy: { createdAt: "asc" } });
    if (!contacts.length) { console.log(`fichas ${slug}: sin contactos`); continue; }
    let n = 0;
    for (const [i, e] of entradas.entries()) {
      const contact = contacts[Math.min(i, contacts.length - 1)];
      await db.contactRecord.create({
        data: { clientId: c.id, contactId: contact.id, type: e.type, title: e.title, summary: e.summary, fields: e.fields, date: at((entradas.length - i) * 14) },
      });
      n++;
    }
    console.log(`fichas ${slug}: ${n} entradas`);
  }

  console.log("\n🌊 Seed finanzas + fichas OK.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
