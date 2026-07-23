import { db } from "@/lib/db";
import { accesoCaja } from "../_acceso";
import { FinanzasHeader } from "../../_components/finanzas/header";
import { CarteraCliente } from "../../_components/finanzas/cartera-cliente";
import { cuentaView } from "../../_lib/finanzas-data";
import type { ChequeView, CobroView } from "../../_components/finanzas/types";

export default async function CarteraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acceso = await accesoCaja(slug);
  if (!acceso.ok) return acceso.denied;
  const tenant = acceso.tenant;

  const [cartera, cheques, cuentas] = await Promise.all([
    db.cuentaPorCobrar.findMany({
      where: { clientId: tenant.id },
      orderBy: [{ estado: "asc" }, { fechaVencimiento: "asc" }, { createdAt: "desc" }],
    }),
    db.cheque.findMany({
      where: { clientId: tenant.id },
      orderBy: { fechaVencimiento: "asc" },
    }),
    db.account.findMany({
      where: { clientId: tenant.id, active: true },
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const cobroView = (c: (typeof cartera)[number]): CobroView => ({
    id: c.id,
    sentido: c.sentido,
    cliente: c.cliente,
    tipo: c.tipo,
    descripcion: c.descripcion,
    monto: c.monto,
    moneda: c.moneda,
    fechaVencimiento: c.fechaVencimiento?.toISOString() ?? null,
    fechaCobro: c.fechaCobro?.toISOString() ?? null,
    estado: c.estado,
    observaciones: c.observaciones,
  });
  const chequeView = (c: (typeof cheques)[number]): ChequeView => ({
    id: c.id,
    tipo: c.tipo,
    beneficiario: c.beneficiario,
    monto: c.monto,
    moneda: c.moneda,
    fechaVencimiento: c.fechaVencimiento.toISOString(),
    fechaConcretado: c.fechaConcretado?.toISOString() ?? null,
    formato: c.formato,
    estado: c.estado,
    observaciones: c.observaciones,
  });

  const cobros = cartera.filter((c) => c.sentido === "COBRAR").map(cobroView);
  const pagos = cartera.filter((c) => c.sentido === "PAGAR").map(cobroView);

  // Totales (solo ARS pendiente): cuentas + cheques.
  const sumPendArs = (arr: { monto: number; moneda: string; estado: string }[]) =>
    arr
      .filter((x) => x.estado === "PENDIENTE" && x.moneda === "ARS")
      .reduce((a, x) => a + x.monto, 0);
  const totalCobrar =
    sumPendArs(cobros) + sumPendArs(cheques.filter((c) => c.tipo === "A_COBRAR"));
  const totalPagar =
    sumPendArs(pagos) + sumPendArs(cheques.filter((c) => c.tipo === "A_PAGAR"));

  return (
    <div className="space-y-6">
      <FinanzasHeader
        slug={tenant.slug}
        subtitle="Cuentas a cobrar, cuentas a pagar y cheques — en un solo lugar."
      />
      <CarteraCliente
        slug={tenant.slug}
        cobros={cobros}
        pagos={pagos}
        cheques={cheques.map(chequeView)}
        cuentas={cuentas.map(cuentaView)}
        totalCobrar={totalCobrar}
        totalPagar={totalPagar}
      />
    </div>
  );
}
