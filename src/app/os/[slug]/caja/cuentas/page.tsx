import { db } from "@/lib/db";
import { accesoCaja } from "../_acceso";
import { FinanzasHeader } from "../../_components/finanzas/header";
import { CuentasCliente } from "../../_components/finanzas/cuentas-cliente";
import { CategoriasManager } from "../../_components/finanzas/categorias-manager";
import { calcularSaldos } from "../../_lib/finanzas";
import { cuentaView, ensureCategorias } from "../../_lib/finanzas-data";

export default async function CuentasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acceso = await accesoCaja(slug);
  if (!acceso.ok) return acceso.denied;
  const tenant = acceso.tenant;

  const [cuentas, movimientos, categorias] = await Promise.all([
    db.account.findMany({
      where: { clientId: tenant.id },
      orderBy: [{ active: "desc" }, { orden: "asc" }, { createdAt: "asc" }],
    }),
    db.cashMovement.findMany({
      where: { clientId: tenant.id },
      select: { kind: true, amountArs: true, accountId: true, toAccountId: true },
    }),
    ensureCategorias(tenant.id),
  ]);

  const views = cuentas.map(cuentaView);
  const saldos = calcularSaldos(views, movimientos).map((s) => ({
    id: s.cuenta.id,
    saldoInicial: s.saldoInicial,
    movimientoNeto: s.movimientoNeto,
    saldoActual: s.saldoActual,
  }));

  return (
    <div className="space-y-6">
      <FinanzasHeader
        slug={tenant.slug}
        subtitle="Cuentas, saldos iniciales y categorías de tu negocio."
      />
      <CuentasCliente slug={tenant.slug} cuentas={views} saldos={saldos} />
      <CategoriasManager slug={tenant.slug} categorias={categorias} />
    </div>
  );
}
