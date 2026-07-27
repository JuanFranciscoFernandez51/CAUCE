/**
 * Verificación rápida del tenant laestacion contra la DB (Neon).
 * Uso: npx tsx --env-file=.env scripts/verify-laestacion.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const tenant = await db.client.findUnique({ where: { slug: "laestacion" } });
  if (!tenant) throw new Error("❌ No existe el tenant laestacion");
  const tpl = (tenant.settings as { template?: string } | null)?.template;

  const [productos, activos, conFotos, pedidos, porEstado, cuentas, consultas, pubs, movs, accounts, cats, users, contacts, procesos] =
    await Promise.all([
      db.bazarProducto.count({ where: { clientId: tenant.id } }),
      db.bazarProducto.count({ where: { clientId: tenant.id, activo: true } }),
      db.bazarProducto.count({ where: { clientId: tenant.id, fotos: { not: [] } } }),
      db.bazarPedido.count({ where: { clientId: tenant.id } }),
      db.bazarPedido.groupBy({ by: ["estado"], where: { clientId: tenant.id }, _count: { _all: true } }),
      db.bazarCuenta.count({ where: { clientId: tenant.id } }),
      db.bazarConsulta.count({ where: { clientId: tenant.id } }),
      db.bazarPublicacion.count({ where: { clientId: tenant.id } }),
      db.cashMovement.count({ where: { clientId: tenant.id } }),
      db.account.findMany({ where: { clientId: tenant.id }, select: { name: true, kind: true, balance: true } }),
      db.categoriaFinanciera.count({ where: { clientId: tenant.id } }),
      db.user.count({ where: { clientId: tenant.id } }),
      db.contact.count({ where: { clientId: tenant.id } }),
      db.proceso.count({ where: { clientId: tenant.id } }),
    ]);

  console.log(`Tenant: ${tenant.name} (${tenant.slug}) — template=${tpl} — modules=${tenant.modules.join(",")}`);
  console.log(`Productos: ${productos} (activos ${activos}, con fotos ${conFotos})`);
  console.log(`Pedidos: ${pedidos} →`, porEstado.map((e) => `${e.estado}:${e._count._all}`).join(" "));
  console.log(`Cuentas comprador: ${cuentas} · Consultas: ${consultas} · Publicaciones IG: ${pubs}`);
  console.log(`Finanzas: ${movs} movimientos · ${cats} categorías`);
  for (const a of accounts) console.log(`  Cuenta "${a.name}" (${a.kind}): $ ${a.balance.toLocaleString("es-AR")}`);
  console.log(`Users OS: ${users} · Contactos CRM: ${contacts} · Procesos: ${procesos}`);

  const errores: string[] = [];
  if (tpl !== "bazar") errores.push("settings.template ≠ bazar");
  if (productos !== 500) errores.push(`productos=${productos} (esperados 500)`);
  if (conFotos !== productos) errores.push("hay productos sin fotos");
  if (pedidos !== 25) errores.push(`pedidos=${pedidos} (esperados 25)`);
  if (cuentas !== 3) errores.push(`cuentas=${cuentas} (esperadas 3)`);
  if (consultas !== 6) errores.push(`consultas=${consultas} (esperadas 6)`);
  if (pubs !== 2) errores.push(`publicaciones=${pubs} (esperadas 2)`);
  if (accounts.length !== 2) errores.push("faltan cuentas de Finanzas");
  if (users !== 1) errores.push("falta el user del OS");

  if (errores.length) {
    console.error("❌ Verificación con problemas:", errores.join(" · "));
    process.exit(1);
  }
  console.log("✅ Verificación OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
