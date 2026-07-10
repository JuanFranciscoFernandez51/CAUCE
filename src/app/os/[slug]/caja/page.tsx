import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { isOsOwner, resolveOsRole } from "../_components/os-role";
import { Stat } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { argMonthStr } from "../_lib/dates";
import { storageAvailable } from "@/lib/storage";
import { AccountsSection } from "../_components/finanzas/accounts-section";
import { MonthSection } from "../_components/finanzas/month-section";
import { YearSection } from "../_components/finanzas/year-section";
import { ArqueoSection, type ArqueoHistItem } from "../_components/finanzas/arqueo-section";
import { CostosSection } from "../_components/finanzas/costos-section";
import { FinanzasTabs } from "../_components/finanzas/tabs";
import { argDateStr, dayRange } from "../_lib/dates";
import { fmtArs } from "../_components/money";

const MONTH_RE = /^\d{4}-\d{2}$/;
const YEAR_RE = /^\d{4}$/;

type Mov = {
  id: string;
  kind: string;
  concept: string;
  amountArs: number;
  method: string | null;
  date: Date;
  accountId: string | null;
  toAccountId: string | null;
  attachmentUrl: string | null;
};

/** Ingresos/egresos/balance para reportes. Transferencia es neutra. Ajuste va con su signo. */
function totals(movs: Pick<Mov, "kind" | "amountArs">[]) {
  let ingresos = 0;
  let egresos = 0;
  for (const m of movs) {
    if (m.kind === "venta") ingresos += m.amountArs;
    if (m.kind === "gasto") egresos += m.amountArs;
    if (m.kind === "ajuste") {
      if (m.amountArs >= 0) ingresos += m.amountArs;
      else egresos += -m.amountArs;
    }
  }
  return { ingresos, egresos, balance: ingresos - egresos };
}

function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return {
    gte: new Date(`${month}-01T00:00:00-03:00`),
    lt: new Date(`${next}-01T00:00:00-03:00`),
  };
}

function yearRange(year: string) {
  return {
    gte: new Date(`${year}-01-01T00:00:00-03:00`),
    lt: new Date(`${Number(year) + 1}-01-01T00:00:00-03:00`),
  };
}

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  mp: "Mercado Pago",
  transferencia: "Transferencia",
};

export default async function CajaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; month?: string; year?: string; account?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "caja")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.caja} />;
  }

  // Finanzas es solo del dueño: el equipo no la ve.
  const session = await auth();
  const osRole = session ? await resolveOsRole(session.user.id, tenant.id) : null;
  if (!isOsOwner(osRole)) {
    return (
      <ModuleDisabled
        moduleLabel={MODULE_LABELS.caja}
        title="No tenés acceso a Caja & Reportes"
        detail="Pedile acceso al dueño de la cuenta."
      />
    );
  }

  const tab =
    sp.tab === "mes" || sp.tab === "ano" || sp.tab === "saldos" || sp.tab === "costos"
      ? sp.tab
      : "dia";
  const month = sp.month && MONTH_RE.test(sp.month) ? sp.month : argMonthStr();
  const year = sp.year && YEAR_RE.test(sp.year) ? sp.year : argMonthStr().slice(0, 4);
  const accountFilter = sp.account || "";

  const accounts = await db.account.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });

  // ── Total consolidado en ARS (las USD aparte, no se suman) ──
  const arsTotal = accounts
    .filter((a) => a.active && a.currency === "ARS")
    .reduce((s, a) => s + a.balance, 0);
  const usdTotal = accounts
    .filter((a) => a.active && a.currency === "USD")
    .reduce((s, a) => s + a.balance, 0);
  const hasUsd = accounts.some((a) => a.currency === "USD");

  // ── Arqueo del día (tab Caja del día) ──
  const hoyStr = argDateStr();
  const hoyRange = dayRange(hoyStr);
  const [arqueoHoy, arqueoHist, efectivoMovs] = await Promise.all([
    db.cajaDia.findUnique({
      where: { clientId_fecha: { clientId: tenant.id, fecha: hoyStr } },
      include: { saldos: true },
    }),
    db.cajaDia.findMany({
      where: { clientId: tenant.id, cerradaEl: { not: null }, fecha: { not: hoyStr } },
      include: { saldos: true },
      orderBy: { fecha: "desc" },
      take: 7,
    }),
    db.cashMovement.findMany({
      where: { clientId: tenant.id, method: "efectivo", date: { gte: hoyRange.start, lt: hoyRange.end } },
      select: { kind: true, amountArs: true },
    }),
  ]);
  const efectivoHoy = totals(efectivoMovs);
  const tieneUsd = accounts.some((a) => a.active && a.currency === "USD");
  const costosFijos = await db.costoFijo.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
  });
  const historial: ArqueoHistItem[] = arqueoHist.map((h) => ({
    fecha: h.fecha,
    usuario: h.usuario,
    saldos: h.saldos.map((s) => ({
      moneda: s.moneda,
      saldoInicial: s.saldoInicial,
      ingresos: s.ingresos,
      egresos: s.egresos,
      contado: s.contado,
      diferencia: s.diferencia,
    })),
  }));

  // ── Movimientos del mes (para tab Mes) ──
  const mRange = monthRange(month);
  const monthMovs: Mov[] = await db.cashMovement.findMany({
    where: {
      clientId: tenant.id,
      date: mRange,
      ...(accountFilter
        ? { OR: [{ accountId: accountFilter }, { toAccountId: accountFilter }] }
        : {}),
    },
    orderBy: { date: "desc" },
    select: {
      id: true,
      kind: true,
      concept: true,
      amountArs: true,
      method: true,
      date: true,
      accountId: true,
      toAccountId: true,
      attachmentUrl: true,
    },
  });
  const monthTotals = totals(monthMovs);

  // ── Movimientos del año (para dashboard anual) ──
  const yRange = yearRange(year);
  const yearMovs = await db.cashMovement.findMany({
    where: { clientId: tenant.id, date: yRange },
    orderBy: { date: "asc" },
    select: { kind: true, amountArs: true, method: true, date: true },
  });

  // Agregar por mes (1..12) en calendario argentino.
  const months = Array.from({ length: 12 }, (_, i) => {
    const mm = String(i + 1).padStart(2, "0");
    return { month: i + 1, key: `${year}-${mm}`, ingresos: 0, egresos: 0, balance: 0 };
  });
  for (const m of yearMovs) {
    const mk = m.date.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    }); // YYYY-MM-DD
    const idx = Number(mk.slice(5, 7)) - 1;
    if (idx < 0 || idx > 11) continue;
    const row = months[idx];
    if (m.kind === "venta") row.ingresos += m.amountArs;
    else if (m.kind === "gasto") row.egresos += m.amountArs;
    else if (m.kind === "ajuste") {
      if (m.amountArs >= 0) row.ingresos += m.amountArs;
      else row.egresos += -m.amountArs;
    }
  }
  for (const row of months) row.balance = row.ingresos - row.egresos;

  const yearTotals = months.reduce(
    (acc, m) => ({
      ingresos: acc.ingresos + m.ingresos,
      egresos: acc.egresos + m.egresos,
      balance: acc.balance + m.balance,
    }),
    { ingresos: 0, egresos: 0, balance: 0 }
  );

  // Desglose por medio del año.
  const methodKeys = ["efectivo", "mp", "transferencia", null] as const;
  const byMethod = methodKeys
    .map((key) => {
      const movs = yearMovs.filter((mv) => (mv.method ?? null) === key);
      return {
        key: key ?? "none",
        label: key ? METHOD_LABELS[key] : "Sin medio",
        ...totals(movs),
        count: movs.length,
      };
    })
    .filter((r) => r.count > 0);

  const accountsLite = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    currency: a.currency,
    balance: a.balance,
    active: a.active,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Finanzas</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas, movimientos y reportes de tu negocio.
        </p>
      </div>

      {/* Total consolidado arriba */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Total en pesos"
          value={fmtArs(arsTotal)}
          tone={arsTotal >= 0 ? "default" : "destructive"}
          hint="Suma de cuentas activas en ARS"
        />
        {hasUsd ? (
          <Stat
            label="Total en dólares"
            value={usdTotal.toLocaleString("es-AR", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 2,
            })}
            hint="Cuentas en USD (no se suman a pesos)"
          />
        ) : null}
        <Stat label="Balance del mes" value={fmtArs(monthTotals.balance)} tone={monthTotals.balance >= 0 ? "success" : "destructive"} hint="Mes seleccionado" />
      </div>

      <FinanzasTabs slug={tenant.slug} active={tab} month={month} year={year}>
        {tab === "dia" ? (
          <ArqueoSection
            slug={tenant.slug}
            hoy={
              arqueoHoy
                ? {
                    fecha: arqueoHoy.fecha,
                    abierta: true,
                    cerrada: Boolean(arqueoHoy.cerradaEl),
                    usuario: arqueoHoy.usuario,
                    saldos: arqueoHoy.saldos.map((s) => ({
                      moneda: s.moneda,
                      saldoInicial: s.saldoInicial,
                      ingresos: s.ingresos,
                      egresos: s.egresos,
                      contado: s.contado,
                      diferencia: s.diferencia,
                    })),
                  }
                : null
            }
            efectivoHoy={{ ingresos: efectivoHoy.ingresos, egresos: efectivoHoy.egresos }}
            tieneUsd={tieneUsd}
            historial={historial}
          />
        ) : null}
        {tab === "saldos" ? (
          <AccountsSection slug={tenant.slug} accounts={accountsLite} arsTotal={arsTotal} />
        ) : null}
        {tab === "mes" ? (
          <MonthSection
            slug={tenant.slug}
            month={month}
            accounts={accountsLite.filter((a) => a.active)}
            accountFilter={accountFilter}
            movements={monthMovs.map((m) => ({ ...m, date: m.date.toISOString() }))}
            totals={monthTotals}
            storageReady={storageAvailable()}
          />
        ) : null}
        {tab === "ano" ? (
          <YearSection slug={tenant.slug} year={year} months={months} totals={yearTotals} byMethod={byMethod} />
        ) : null}
        {tab === "costos" ? (
          <CostosSection
            slug={tenant.slug}
            costos={costosFijos.map((c) => ({ id: c.id, concepto: c.concepto, montoArs: c.montoArs }))}
            ingresosMes={monthTotals.ingresos}
            mesLabel={month}
          />
        ) : null}
      </FinanzasTabs>
    </div>
  );
}
