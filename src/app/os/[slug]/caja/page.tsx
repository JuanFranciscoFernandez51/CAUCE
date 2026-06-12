import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Card, EmptyState, Stat, Table, Td, Th } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { DATE_RE, argDateStr, dayRange, fmtDayLabel, fmtTime } from "../_lib/dates";
import { fmtArs } from "../_components/money";
import { CashForm } from "../_components/cash-form";
import { CashDeleteButton } from "../_components/cash-actions";

const KIND_LABELS: Record<string, string> = {
  venta: "Venta",
  gasto: "Gasto",
  ajuste: "Ajuste",
};

const METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  mp: "Mercado Pago",
  transferencia: "Transferencia",
};

type Mov = {
  id: string;
  kind: string;
  concept: string;
  amountArs: number;
  method: string | null;
  createdAt: Date;
};

/** venta suma, gasto resta, ajuste va con el signo cargado. */
function signed(m: Pick<Mov, "kind" | "amountArs">): number {
  if (m.kind === "venta") return m.amountArs;
  if (m.kind === "gasto") return -m.amountArs;
  return m.amountArs;
}

function totals(movs: Mov[]) {
  let ingresos = 0;
  let egresos = 0;
  let balance = 0;
  for (const m of movs) {
    if (m.kind === "venta") ingresos += m.amountArs;
    if (m.kind === "gasto") egresos += m.amountArs;
    balance += signed(m);
  }
  return { ingresos, egresos, balance };
}

export default async function CajaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date } = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "caja")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.caja} />;
  }

  const dateStr = date && DATE_RE.test(date) ? date : argDateStr();
  const { start: dayStart, end: dayEnd } = dayRange(dateStr);

  // Mes calendario argentino que contiene el día elegido.
  const monthStr = dateStr.slice(0, 7);
  const [y, m] = monthStr.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const monthGte = new Date(`${monthStr}-01T00:00:00-03:00`);
  const monthLt = new Date(`${nextMonth}-01T00:00:00-03:00`);

  const monthMovs: Mov[] = await db.cashMovement.findMany({
    where: { clientId: tenant.id, createdAt: { gte: monthGte, lt: monthLt } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      concept: true,
      amountArs: true,
      method: true,
      createdAt: true,
    },
  });
  const dayMovs = monthMovs.filter((mv) => mv.createdAt >= dayStart && mv.createdAt < dayEnd);

  const day = totals(dayMovs);
  const month = totals(monthMovs);

  // Desglose del mes por medio de pago.
  const methodKeys = ["efectivo", "mp", "transferencia", null] as const;
  const byMethod = methodKeys
    .map((key) => {
      const movs = monthMovs.filter((mv) => (mv.method ?? null) === key);
      return { key, label: key ? METHOD_LABELS[key] : "Sin medio", ...totals(movs), count: movs.length };
    })
    .filter((row) => row.count > 0);

  const monthLabel = monthGte.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Caja & Reportes</h1>
          <p className="text-sm capitalize text-muted-foreground">{fmtDayLabel(dateStr)}</p>
        </div>
        <form method="GET" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={dateStr}
            aria-label="Elegir día"
            className="h-10 rounded-md border border-input bg-card px-3 text-sm text-card-foreground focus-visible:outline-2 focus-visible:outline-ring"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted"
          >
            Ver
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Ingresos del día" value={fmtArs(day.ingresos)} tone="success" hint="Ventas" />
        <Stat label="Egresos del día" value={fmtArs(day.egresos)} tone="destructive" hint="Gastos" />
        <Stat
          label="Balance del día"
          value={fmtArs(day.balance)}
          tone={day.balance > 0 ? "success" : day.balance < 0 ? "destructive" : "default"}
          hint="Ventas − gastos ± ajustes"
        />
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Movimiento rápido</h2>
        <CashForm slug={tenant.slug} />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Movimientos del día</h2>
        {dayMovs.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Sin movimientos este día"
            detail="Cargá ventas y gastos con el formulario de arriba y los ves acá al toque."
          />
        ) : (
          <Card className="divide-y p-0">
            {dayMovs.map((mv) => {
              const amount = signed(mv);
              const color =
                mv.kind === "venta"
                  ? "text-success"
                  : mv.kind === "gasto"
                    ? "text-destructive"
                    : "text-warning";
              return (
                <div
                  key={mv.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:px-4"
                >
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {fmtTime(mv.createdAt)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{mv.concept}</p>
                    <p className="text-xs text-muted-foreground">
                      {KIND_LABELS[mv.kind] ?? mv.kind}
                      {mv.method ? ` · ${METHOD_LABELS[mv.method] ?? mv.method}` : ""}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${color}`}>
                    {amount > 0 ? "+" : amount < 0 ? "−" : ""}
                    {fmtArs(Math.abs(amount))}
                  </span>
                  <CashDeleteButton slug={tenant.slug} movementId={mv.id} concept={mv.concept} />
                </div>
              );
            })}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">
          Resumen del mes <span className="font-normal capitalize text-muted-foreground">· {monthLabel}</span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Ingresos del mes" value={fmtArs(month.ingresos)} tone="success" />
          <Stat label="Egresos del mes" value={fmtArs(month.egresos)} tone="destructive" />
          <Stat
            label="Balance del mes"
            value={fmtArs(month.balance)}
            tone={month.balance > 0 ? "success" : month.balance < 0 ? "destructive" : "default"}
          />
        </div>
        {byMethod.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Sin movimientos este mes todavía.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Medio de pago</Th>
                <Th className="text-right">Ingresos</Th>
                <Th className="text-right">Egresos</Th>
                <Th className="text-right">Balance</Th>
              </tr>
            </thead>
            <tbody>
              {byMethod.map((row) => (
                <tr key={row.key ?? "none"}>
                  <Td className="font-medium">{row.label}</Td>
                  <Td className="text-right tabular-nums text-success">{fmtArs(row.ingresos)}</Td>
                  <Td className="text-right tabular-nums text-destructive">{fmtArs(row.egresos)}</Td>
                  <Td className="text-right font-medium tabular-nums">{fmtArs(row.balance)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
