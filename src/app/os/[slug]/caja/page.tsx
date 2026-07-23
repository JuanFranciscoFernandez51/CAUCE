import Link from "next/link";
import { db } from "@/lib/db";
import { Card, Stat } from "@/components/ui";
import { accesoCaja } from "./_acceso";
import { FinanzasHeader } from "../_components/finanzas/header";
import { fmtMoneda } from "../_components/money";
import { fmtDateShort } from "../_lib/dates";
import { calcularSaldos } from "../_lib/finanzas";
import { cuentaView } from "../_lib/finanzas-data";

/** Dorado "por cobrar" (patrón Vespa). */
const DORADO = "#CE9F33";

export default async function ResumenGeneralPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const acceso = await accesoCaja(slug);
  if (!acceso.ok) return acceso.denied;
  const tenant = acceso.tenant;

  const [cuentas, movimientos, cartera, cheques] = await Promise.all([
    db.account.findMany({
      where: { clientId: tenant.id },
      orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
    }),
    db.cashMovement.findMany({
      where: { clientId: tenant.id },
      select: { kind: true, amountArs: true, accountId: true, toAccountId: true },
    }),
    db.cuentaPorCobrar.findMany({ where: { clientId: tenant.id, estado: "PENDIENTE" } }),
    db.cheque.findMany({ where: { clientId: tenant.id, estado: "PENDIENTE" } }),
  ]);

  const views = cuentas.map(cuentaView);
  const saldos = calcularSaldos(views, movimientos).filter((s) => s.cuenta.active);
  const saldosARS = saldos.filter((s) => s.cuenta.currency === "ARS" && !s.cuenta.excluirDeResultado);
  const saldosUSD = saldos.filter((s) => s.cuenta.currency === "USD" && !s.cuenta.excluirDeResultado);
  const excluidas = saldos.filter((s) => s.cuenta.excluirDeResultado);

  const totalARS = saldosARS.reduce((a, s) => a + s.saldoActual, 0);
  const totalUSD = saldosUSD.reduce((a, s) => a + s.saldoActual, 0);

  // Cartera (solo ARS pendiente): cuentas por cobrar/pagar + cheques.
  const sumARS = (arr: { monto: number; moneda: string }[]) =>
    arr.filter((x) => x.moneda === "ARS").reduce((a, x) => a + x.monto, 0);
  const aCobrar =
    sumARS(cartera.filter((c) => c.sentido === "COBRAR")) +
    sumARS(cheques.filter((c) => c.tipo === "A_COBRAR"));
  const aPagar =
    sumARS(cartera.filter((c) => c.sentido === "PAGAR")) +
    sumARS(cheques.filter((c) => c.tipo === "A_PAGAR"));
  const neta = aCobrar - aPagar;

  const ahora = new Date();
  const items = [
    ...cartera.map((c) => ({
      dir: c.sentido === "COBRAR" ? ("cobrar" as const) : ("pagar" as const),
      label: c.cliente,
      sub: c.tipo,
      monto: c.monto,
      moneda: c.moneda,
      venc: c.fechaVencimiento,
    })),
    ...cheques.map((c) => ({
      dir: c.tipo === "A_COBRAR" ? ("cobrar" as const) : ("pagar" as const),
      label: c.beneficiario,
      sub: "Cheque",
      monto: c.monto,
      moneda: c.moneda,
      venc: c.fechaVencimiento as Date | null,
    })),
  ]
    .map((i) => ({ ...i, vencido: !!i.venc && i.venc < ahora }))
    .sort((a, b) => (a.venc?.getTime() ?? Infinity) - (b.venc?.getTime() ?? Infinity));

  const vencidoCobrar = items
    .filter((i) => i.dir === "cobrar" && i.vencido && i.moneda === "ARS")
    .reduce((a, i) => a + i.monto, 0);

  const posicionTotal = totalARS + neta;

  return (
    <div className="space-y-6">
      <FinanzasHeader
        slug={tenant.slug}
        subtitle="Cuentas, resultados y posición del negocio — en vivo."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Posición total"
          value={fmtMoneda(posicionTotal, "ARS")}
          tone={posicionTotal >= 0 ? "default" : "destructive"}
          hint="Plata en cuentas + cartera neta (ARS)"
        />
        <Stat
          label="En cuentas (ARS)"
          value={fmtMoneda(totalARS, "ARS")}
          tone={totalARS >= 0 ? "default" : "destructive"}
          hint="Disponible hoy en cuentas activas"
        />
        <Stat
          label="Por cobrar"
          value={<span style={{ color: DORADO }}>{fmtMoneda(aCobrar, "ARS")}</span>}
          hint={`${items.filter((i) => i.dir === "cobrar").length} pendientes (cuentas + cheques)`}
        />
      </div>

      {vencidoCobrar > 0 ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          ⚠ Tenés <strong>{fmtMoneda(vencidoCobrar, "ARS")}</strong> vencido por cobrar. Pasá por{" "}
          <Link href={`/os/${tenant.slug}/caja/cartera`} className="underline">
            Cartera
          </Link>{" "}
          para reclamarlo.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Saldos ARS */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Saldos por cuenta (ARS)</h2>
            <Link
              href={`/os/${tenant.slug}/caja/cuentas`}
              className="text-xs text-primary hover:underline"
            >
              Editar →
            </Link>
          </div>
          <div className="space-y-1">
            {saldosARS.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay cuentas en pesos. Crealas desde la pestaña Cuentas.
              </p>
            ) : null}
            {saldosARS.map((s) => (
              <div
                key={s.cuenta.id}
                className="flex items-center justify-between border-b py-1.5 text-sm last:border-0"
              >
                <span>{s.cuenta.name}</span>
                <span
                  className={`font-medium tabular-nums ${s.saldoActual < 0 ? "text-destructive" : ""}`}
                >
                  {fmtMoneda(s.saldoActual, "ARS")}
                </span>
              </div>
            ))}
            {saldosARS.length > 0 ? (
              <div className="flex items-center justify-between pt-2 font-bold">
                <span>Total en cuentas</span>
                <span className="tabular-nums text-primary">{fmtMoneda(totalARS, "ARS")}</span>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          {/* USD */}
          {saldosUSD.length > 0 ? (
            <Card className="p-5">
              <h2 className="mb-3 text-base font-semibold">💵 Saldos en USD</h2>
              <div className="space-y-1">
                {saldosUSD.map((s) => (
                  <div
                    key={s.cuenta.id}
                    className="flex items-center justify-between border-b py-1.5 text-sm last:border-0"
                  >
                    <span>{s.cuenta.name}</span>
                    <span className="font-medium tabular-nums">
                      {fmtMoneda(s.saldoActual, "USD")}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 font-bold">
                  <span>Total USD</span>
                  <span className="tabular-nums text-success">{fmtMoneda(totalUSD, "USD")}</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Los dólares no se suman a los pesos: se muestran aparte.
              </p>
            </Card>
          ) : null}

          {/* Cuentas excluidas */}
          {excluidas.length > 0 ? (
            <Card className="p-5">
              <h2 className="mb-3 text-base font-semibold">Cuentas excluidas de resultados</h2>
              <div className="space-y-1">
                {excluidas.map((s) => (
                  <div
                    key={s.cuenta.id}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <span>
                      {s.cuenta.name}{" "}
                      <span className="text-[11px] text-muted-foreground">(excluida)</span>
                    </span>
                    <span className="font-medium tabular-nums">
                      {fmtMoneda(s.saldoActual, s.cuenta.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Plata que se administra pero no es del negocio: no entra en ingresos/gastos.
              </p>
            </Card>
          ) : null}

          {/* Cartera */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Cartera (cuentas y cheques)</h2>
              <Link
                href={`/os/${tenant.slug}/caja/cartera`}
                className="text-xs text-primary hover:underline"
              >
                Ver todo →
              </Link>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between border-b py-1.5">
                <span>A cobrar</span>
                <span className="font-medium tabular-nums" style={{ color: DORADO }}>
                  {fmtMoneda(aCobrar, "ARS")}
                </span>
              </div>
              <div className="flex items-center justify-between border-b py-1.5">
                <span>A pagar</span>
                <span className="font-medium tabular-nums text-destructive">
                  {fmtMoneda(aPagar, "ARS")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 font-bold">
                <span>Posición neta</span>
                <span
                  className={`tabular-nums ${neta >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {fmtMoneda(neta, "ARS")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {neta >= 0 ? "Te queda a favor" : "Te queda en contra"} (cuentas + cheques, ARS).
              </p>
              {items.length > 0 ? (
                <div className="mt-1 space-y-1.5 border-t pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Próximos vencimientos
                  </p>
                  {items.slice(0, 5).map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="max-w-[58%] truncate">
                        <span style={{ color: i.dir === "cobrar" ? DORADO : "var(--destructive)" }}>
                          {i.dir === "cobrar" ? "▲" : "▼"}
                        </span>{" "}
                        {i.label} <span className="text-muted-foreground">· {i.sub}</span>
                        {i.vencido ? <span className="text-destructive"> · vencido</span> : null}
                      </span>
                      <span className="text-muted-foreground">
                        {i.venc ? fmtDateShort(i.venc) : "—"} ·{" "}
                        <span className="font-medium tabular-nums text-foreground">
                          {fmtMoneda(i.monto, i.moneda)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Los saldos se calculan siempre en vivo: saldo inicial + movimientos. La cartera es
        informativa — entra al resultado recién cuando la cobrás o pagás de verdad.
      </p>
    </div>
  );
}
