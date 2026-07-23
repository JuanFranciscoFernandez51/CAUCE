import { db } from "@/lib/db";
import { storageAvailable } from "@/lib/storage";
import { accesoCaja } from "../_acceso";
import { FinanzasHeader } from "../../_components/finanzas/header";
import { MovimientosCliente } from "../../_components/finanzas/movimientos-cliente";
import { argDateStr } from "../../_lib/dates";
import {
  cuentaView,
  ensureCategorias,
  movView,
  nombresCategorias,
} from "../../_lib/finanzas-data";

const YEAR_RE = /^\d{4}$/;

export default async function MovimientosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ anio?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const acceso = await accesoCaja(slug);
  if (!acceso.ok) return acceso.denied;
  const tenant = acceso.tenant;

  const anio = sp.anio && YEAR_RE.test(sp.anio) ? Number(sp.anio) : Number(argDateStr().slice(0, 4));

  const [cuentas, movimientos, categorias] = await Promise.all([
    db.account.findMany({
      where: { clientId: tenant.id },
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    }),
    db.cashMovement.findMany({
      where: {
        clientId: tenant.id,
        date: {
          gte: new Date(`${anio}-01-01T00:00:00-03:00`),
          lt: new Date(`${anio + 1}-01-01T00:00:00-03:00`),
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    ensureCategorias(tenant.id),
  ]);

  return (
    <div className="space-y-6">
      <FinanzasHeader slug={tenant.slug} subtitle={`Libro diario de ${anio} — todo lo que entró y salió.`} />
      <MovimientosCliente
        slug={tenant.slug}
        cuentas={cuentas.map(cuentaView)}
        movimientos={movimientos.map(movView)}
        anio={anio}
        categorias={nombresCategorias(categorias)}
        storageReady={storageAvailable()}
      />
    </div>
  );
}
