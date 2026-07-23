import { db } from "@/lib/db";
import { Card, Stat } from "@/components/ui";
import { accesoCaja } from "../_acceso";
import { FinanzasHeader } from "../../_components/finanzas/header";
import { PeriodoSelector } from "../../_components/finanzas/periodo-selector";
import { fmtMoneda } from "../../_components/money";
import { argDateStr } from "../../_lib/dates";
import { MESES_ES, calcularResumenMensual } from "../../_lib/finanzas";
import {
  cuentaView,
  ensureCategorias,
  movView,
  nombresCategorias,
} from "../../_lib/finanzas-data";

export default async function ResumenMensualPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const acceso = await accesoCaja(slug);
  if (!acceso.ok) return acceso.denied;
  const tenant = acceso.tenant;

  const hoy = argDateStr();
  const mesDefault = Number(hoy.slice(5, 7)) - 1;
  const anioDefault = Number(hoy.slice(0, 4));
  const mes =
    sp.mes != null && Number(sp.mes) >= 1 && Number(sp.mes) <= 12 ? Number(sp.mes) - 1 : mesDefault;
  const anio = sp.anio != null && /^\d{4}$/.test(sp.anio) ? Number(sp.anio) : anioDefault;

  const mm = String(mes + 1).padStart(2, "0");
  const next = mes === 11 ? `${anio + 1}-01` : `${anio}-${String(mes + 2).padStart(2, "0")}`;

  const [cuentas, movimientos, categorias] = await Promise.all([
    db.account.findMany({
      where: { clientId: tenant.id },
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    }),
    db.cashMovement.findMany({
      where: {
        clientId: tenant.id,
        date: {
          gte: new Date(`${anio}-${mm}-01T00:00:00-03:00`),
          lt: new Date(`${next}-01T00:00:00-03:00`),
        },
      },
    }),
    ensureCategorias(tenant.id),
  ]);

  const cats = nombresCategorias(categorias);
  const r = calcularResumenMensual(
    movimientos.map(movView),
    cuentas.map(cuentaView),
    mes,
    anio,
    cats.ingreso,
    cats.gasto
  );

  const hayUsd =
    cuentas.some((c) => c.currency === "USD") || r.ingresosUSD !== 0 || r.gastosUSD !== 0;

  return (
    <div className="space-y-6">
      <FinanzasHeader
        slug={tenant.slug}
        subtitle={`Resumen de ${MESES_ES[mes]} ${anio}.`}
        actions={<PeriodoSelector base={`/os/${tenant.slug}/caja/mensual`} mes={mes} anio={anio} />}
      />

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Ingresos" value={<span className="text-success">{fmtMoneda(r.totalIngresos, "ARS")}</span>} />
        <Stat label="Gastos" value={<span className="text-destructive">{fmtMoneda(r.totalGastos, "ARS")}</span>} />
        <Stat
          label="Resultado"
          value={fmtMoneda(r.resultado, "ARS")}
          tone={r.resultado >= 0 ? "default" : "destructive"}
        />
        <Stat label="Margen" value={`${r.margen.toFixed(1)}%`} hint="Resultado / ingresos" />
      </div>

      {/* Tablas por categoría */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TablaCategorias titulo="Ingresos" lineas={r.ingresos} total={r.totalIngresos} tono="success" />
        <TablaCategorias titulo="Gastos" lineas={r.gastos} total={r.totalGastos} tono="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Neto por cuenta */}
        <Card className="p-5">
          <h2 className="mb-3 text-base font-semibold">Movimiento neto por cuenta (ARS)</h2>
          <div className="space-y-1">
            {r.netoPorCuenta.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cuentas en pesos.</p>
            ) : null}
            {r.netoPorCuenta.map((n) => (
              <div
                key={n.cuenta}
                className="flex items-center justify-between border-b py-1.5 text-sm last:border-0"
              >
                <span>{n.cuenta}</span>
                <span
                  className={`font-medium tabular-nums ${n.neto < 0 ? "text-destructive" : ""}`}
                >
                  {fmtMoneda(n.neto, "ARS")}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* USD */}
        {hayUsd ? (
          <Card className="p-5">
            <h2 className="mb-3 text-base font-semibold">Movimientos en USD</h2>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between border-b py-1.5">
                <span>Ingresos USD</span>
                <span className="font-medium tabular-nums">{fmtMoneda(r.ingresosUSD, "USD")}</span>
              </div>
              <div className="flex items-center justify-between border-b py-1.5">
                <span>Gastos USD</span>
                <span className="font-medium tabular-nums">{fmtMoneda(r.gastosUSD, "USD")}</span>
              </div>
              <div className="flex items-center justify-between pt-2 font-bold">
                <span>Resultado USD</span>
                <span
                  className={`tabular-nums ${r.resultadoUSD < 0 ? "text-destructive" : "text-success"}`}
                >
                  {fmtMoneda(r.resultadoUSD, "USD")}
                </span>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Este resumen es de caja (cash-basis): cuenta SOLO la plata que entró y salió de verdad en
        el mes. Lo pendiente de cobrar o pagar vive en Cartera y no suma acá hasta que se
        concreta. Las categorías en gris están en cero este mes.
      </p>
    </div>
  );
}

function TablaCategorias({
  titulo,
  lineas,
  total,
  tono,
}: {
  titulo: string;
  lineas: { categoria: string; monto: number }[];
  total: number;
  tono: "success" | "destructive";
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-base font-semibold">{titulo}</h2>
      <div className="space-y-0.5">
        {lineas.map((l) => (
          <div
            key={l.categoria}
            className="flex items-center justify-between border-b py-1.5 text-sm last:border-0"
          >
            <span className={l.monto > 0 ? "" : "text-muted-foreground/60"}>{l.categoria}</span>
            <span
              className={`tabular-nums ${l.monto > 0 ? "font-medium" : "text-muted-foreground/40"}`}
            >
              {fmtMoneda(l.monto, "ARS")}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2.5 font-bold">
          <span>Total {titulo.toLowerCase()}</span>
          <span
            className={`tabular-nums ${tono === "success" ? "text-success" : "text-destructive"}`}
          >
            {fmtMoneda(total, "ARS")}
          </span>
        </div>
      </div>
    </Card>
  );
}
