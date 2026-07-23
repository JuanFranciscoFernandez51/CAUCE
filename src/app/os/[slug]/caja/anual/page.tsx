import { db } from "@/lib/db";
import { Card, Stat } from "@/components/ui";
import { accesoCaja } from "../_acceso";
import { FinanzasHeader } from "../../_components/finanzas/header";
import { PeriodoSelector } from "../../_components/finanzas/periodo-selector";
import { GraficoAnual } from "../../_components/finanzas/grafico-anual";
import { fmtMoneda } from "../../_components/money";
import { argDateStr } from "../../_lib/dates";
import { MESES_CORTOS, abrevMonto, calcularDashboardAnual } from "../../_lib/finanzas";
import {
  cuentaView,
  ensureCategorias,
  movView,
  nombresCategorias,
} from "../../_lib/finanzas-data";

export default async function DashboardAnualPage({
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

  const anio =
    sp.anio != null && /^\d{4}$/.test(sp.anio) ? Number(sp.anio) : Number(argDateStr().slice(0, 4));

  const [cuentas, movimientos, categorias] = await Promise.all([
    db.account.findMany({ where: { clientId: tenant.id } }),
    db.cashMovement.findMany({
      where: {
        clientId: tenant.id,
        date: {
          gte: new Date(`${anio}-01-01T00:00:00-03:00`),
          lt: new Date(`${anio + 1}-01-01T00:00:00-03:00`),
        },
      },
    }),
    ensureCategorias(tenant.id),
  ]);

  const cats = nombresCategorias(categorias);
  const d = calcularDashboardAnual(
    movimientos.map(movView),
    cuentas.map(cuentaView),
    anio,
    cats.ingreso,
    cats.gasto
  );

  const hayUsd = d.ingresosUSDMes.some((v) => v !== 0) || d.gastosUSDMes.some((v) => v !== 0);

  return (
    <div className="space-y-6">
      <FinanzasHeader
        slug={tenant.slug}
        subtitle={`Evolución mensual del año ${anio}.`}
        actions={<PeriodoSelector base={`/os/${tenant.slug}/caja/anual`} anio={anio} conMes={false} />}
      />

      {/* KPIs anuales */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat
          label="Ingresos del año"
          value={<span className="text-success">{fmtMoneda(d.totalIngresosAnual, "ARS")}</span>}
        />
        <Stat
          label="Gastos del año"
          value={<span className="text-destructive">{fmtMoneda(d.totalGastosAnual, "ARS")}</span>}
        />
        <Stat
          label="Resultado del año"
          value={fmtMoneda(d.resultadoAnual, "ARS")}
          tone={d.resultadoAnual >= 0 ? "default" : "destructive"}
          hint={
            d.totalIngresosAnual > 0
              ? `Margen ${((d.resultadoAnual / d.totalIngresosAnual) * 100).toFixed(0)}%`
              : undefined
          }
        />
      </div>

      {/* Gráfico */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-semibold">Ingresos, gastos y resultado por mes</h2>
        <GraficoAnual
          ingresos={d.totalIngresosMes}
          gastos={d.totalGastosMes}
          resultado={d.resultadoMes}
        />
      </Card>

      {/* Matriz 12 meses */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className="sticky left-0 z-10 min-w-[180px] bg-muted px-3 py-2 text-left font-semibold">
                Concepto
              </th>
              {MESES_CORTOS.map((m) => (
                <th key={m} className="min-w-[58px] px-2 py-2 text-right font-semibold">
                  {m}
                </th>
              ))}
              <th className="min-w-[80px] bg-muted px-3 py-2 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            <SeccionHeader label="INGRESOS" tono="text-success" />
            {d.ingresos.map((f) => (
              <FilaDatos key={f.categoria} fila={f} />
            ))}
            <FilaTotal
              label="Total ingresos"
              meses={d.totalIngresosMes}
              total={d.totalIngresosAnual}
              color="text-success"
            />

            <SeccionHeader label="GASTOS" tono="text-destructive" />
            {d.gastos.map((f) => (
              <FilaDatos key={f.categoria} fila={f} />
            ))}
            <FilaTotal
              label="Total gastos"
              meses={d.totalGastosMes}
              total={d.totalGastosAnual}
              color="text-destructive"
            />

            <FilaTotal
              label="RESULTADO"
              meses={d.resultadoMes}
              total={d.resultadoAnual}
              color="text-foreground"
              fuerte
            />
            <FilaTotal
              label="Acumulado"
              meses={d.resultadoAcumulado}
              total={d.resultadoAcumulado[11]}
              color="text-primary"
            />
            <tr className="border-t">
              <td className="sticky left-0 z-10 bg-card px-3 py-1.5 italic text-muted-foreground">
                Margen %
              </td>
              {d.margenMes.map((m, i) => (
                <td
                  key={i}
                  className={`px-2 py-1.5 text-right tabular-nums ${m < 0 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {m !== 0 ? `${m.toFixed(0)}%` : "—"}
                </td>
              ))}
              <td className="bg-muted px-3 py-1.5 text-right font-semibold tabular-nums text-muted-foreground">
                {d.totalIngresosAnual > 0
                  ? `${((d.resultadoAnual / d.totalIngresosAnual) * 100).toFixed(0)}%`
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {hayUsd ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="sticky left-0 z-10 min-w-[180px] bg-muted px-3 py-2 text-left font-semibold">
                  USD
                </th>
                {MESES_CORTOS.map((m) => (
                  <th key={m} className="min-w-[58px] px-2 py-2 text-right font-semibold">
                    {m}
                  </th>
                ))}
                <th className="min-w-[80px] bg-muted px-3 py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <FilaTotal
                label="Ingresos USD"
                meses={d.ingresosUSDMes}
                total={d.ingresosUSDMes.reduce((a, b) => a + b, 0)}
                color="text-success"
              />
              <FilaTotal
                label="Gastos USD"
                meses={d.gastosUSDMes}
                total={d.gastosUSDMes.reduce((a, b) => a + b, 0)}
                color="text-destructive"
              />
              <FilaTotal
                label="Resultado USD"
                meses={d.resultadoUSDMes}
                total={d.resultadoUSDMes.reduce((a, b) => a + b, 0)}
                color="text-foreground"
                fuerte
              />
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Los montos de la matriz están abreviados (k = mil, M = millón); los ceros se muestran como
        &quot;—&quot; y los negativos en rojo. Todo sale de los movimientos cargados (cash-basis).
      </p>
    </div>
  );
}

function SeccionHeader({ label, tono }: { label: string; tono: string }) {
  return (
    <tr className="bg-muted/70">
      <td
        colSpan={14}
        className={`sticky left-0 z-10 bg-muted/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${tono}`}
      >
        {label}
      </td>
    </tr>
  );
}

function FilaDatos({ fila }: { fila: { categoria: string; meses: number[]; total: number } }) {
  return (
    <tr className="border-t hover:bg-muted/40">
      <td className="sticky left-0 z-10 bg-card px-3 py-1.5">{fila.categoria}</td>
      {fila.meses.map((v, i) => (
        <td key={i} className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
          {abrevMonto(v)}
        </td>
      ))}
      <td className="bg-muted/60 px-3 py-1.5 text-right font-semibold tabular-nums">
        {abrevMonto(fila.total)}
      </td>
    </tr>
  );
}

function FilaTotal({
  label,
  meses,
  total,
  color,
  fuerte,
}: {
  label: string;
  meses: number[];
  total: number;
  color: string;
  fuerte?: boolean;
}) {
  return (
    <tr className={`border-t ${fuerte ? "bg-muted/60" : ""}`}>
      <td
        className={`sticky left-0 z-10 px-3 py-1.5 font-bold ${fuerte ? "bg-muted" : "bg-card"} ${color}`}
      >
        {label}
      </td>
      {meses.map((v, i) => (
        <td
          key={i}
          className={`px-2 py-1.5 text-right font-semibold tabular-nums ${v < 0 ? "text-destructive" : color}`}
        >
          {abrevMonto(v)}
        </td>
      ))}
      <td
        className={`bg-muted px-3 py-1.5 text-right font-bold tabular-nums ${total < 0 ? "text-destructive" : color}`}
      >
        {abrevMonto(total)}
      </td>
    </tr>
  );
}
