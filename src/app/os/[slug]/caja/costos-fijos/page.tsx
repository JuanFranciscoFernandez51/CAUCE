import { db } from "@/lib/db";
import { accesoCaja } from "../_acceso";
import { FinanzasHeader } from "../../_components/finanzas/header";
import { CostosFijosCliente } from "../../_components/finanzas/costos-fijos-cliente";
import { finanzasConfigDe } from "../../_lib/finanzas";

export default async function CostosFijosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acceso = await accesoCaja(slug);
  if (!acceso.ok) return acceso.denied;
  const tenant = acceso.tenant;

  const costos = await db.costoFijo.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <FinanzasHeader
        slug={tenant.slug}
        subtitle="Costos fijos mensuales y cuántas ventas necesitás para cubrirlos."
      />
      <CostosFijosCliente
        slug={tenant.slug}
        costos={costos.map((c) => ({
          id: c.id,
          concepto: c.concepto,
          categoria: c.categoria,
          montoArs: c.montoArs,
          notas: c.notas,
          activo: c.activo,
        }))}
        config={finanzasConfigDe(tenant.settings)}
      />
    </div>
  );
}
