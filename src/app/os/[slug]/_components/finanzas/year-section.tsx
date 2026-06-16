"use client";

import { useRouter } from "next/navigation";
import { Card, Stat, Table, Td, Th } from "@/components/ui";
import { fmtArs } from "../money";
import { METHOD_LABELS } from "./types";

type MonthRow = { month: number; key: string; ingresos: number; egresos: number; balance: number };
type Totals = { ingresos: number; egresos: number; balance: number };
type MethodRow = { key: string; label: string; ingresos: number; egresos: number; balance: number; count: number };

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function YearSection({
  slug,
  year,
  months,
  totals,
  byMethod,
}: {
  slug: string;
  year: string;
  months: MonthRow[];
  totals: Totals;
  byMethod: MethodRow[];
}) {
  const router = useRouter();
  const y = Number(year);

  function go(nextYear: number) {
    const q = new URLSearchParams({ tab: "ano", year: String(nextYear) });
    router.push(`/os/${slug}/caja?${q.toString()}`);
  }

  // Para barras: escala según el máximo absoluto entre ingresos y egresos.
  const maxVal = Math.max(1, ...months.map((m) => Math.max(m.ingresos, m.egresos)));

  const withMovs = months.filter((m) => m.ingresos !== 0 || m.egresos !== 0);
  const best = withMovs.length ? withMovs.reduce((a, b) => (b.balance > a.balance ? b : a)) : null;
  const worst = withMovs.length ? withMovs.reduce((a, b) => (b.balance < a.balance ? b : a)) : null;

  // Balance acumulado mes a mes (sin mutar nada en render).
  const accumulated = months.map((_, i) =>
    months.slice(0, i + 1).reduce((sum, mm) => sum + mm.balance, 0)
  );

  return (
    <div className="space-y-5">
      {/* Selector de año */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(y - 1)}
          className="h-9 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted"
          aria-label="Año anterior"
        >
          ‹
        </button>
        <span className="min-w-16 text-center text-sm font-semibold">{year}</span>
        <button
          type="button"
          onClick={() => go(y + 1)}
          className="h-9 rounded-md border bg-card px-3 text-sm font-medium hover:bg-muted"
          aria-label="Año siguiente"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Ingresos del año" value={fmtArs(totals.ingresos)} tone="success" />
        <Stat label="Egresos del año" value={fmtArs(totals.egresos)} tone="destructive" />
        <Stat
          label="Balance del año"
          value={fmtArs(totals.balance)}
          tone={totals.balance > 0 ? "success" : totals.balance < 0 ? "destructive" : "default"}
        />
      </div>

      {best && worst ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mejor mes</p>
            <p className="mt-1 text-lg font-semibold">
              {MONTH_NAMES[best.month - 1]} <span className="text-success tabular-nums">{fmtArs(best.balance)}</span>
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Peor mes</p>
            <p className="mt-1 text-lg font-semibold">
              {MONTH_NAMES[worst.month - 1]} <span className="text-destructive tabular-nums">{fmtArs(worst.balance)}</span>
            </p>
          </Card>
        </div>
      ) : null}

      {/* Barras proporcionales por mes (sin libs) */}
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Por mes</h2>
        <div className="space-y-2.5">
          {months.map((m, i) => (
            <div key={m.key} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-xs font-medium text-muted-foreground">{MONTH_NAMES[i]}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-success"
                    style={{ width: `${(m.ingresos / maxVal) * 100}%` }}
                    title={`Ingresos ${fmtArs(m.ingresos)}`}
                  />
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-destructive"
                    style={{ width: `${(m.egresos / maxVal) * 100}%` }}
                    title={`Egresos ${fmtArs(m.egresos)}`}
                  />
                </div>
              </div>
              <span
                className={`w-28 shrink-0 text-right text-xs font-semibold tabular-nums ${
                  m.balance > 0 ? "text-success" : m.balance < 0 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {fmtArs(m.balance)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" /> Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" /> Egresos
          </span>
        </div>
      </Card>

      {/* Tabla detallada con acumulado */}
      <div>
        <h2 className="mb-2 font-semibold">Detalle mensual</h2>
        <Table>
          <thead>
            <tr>
              <Th>Mes</Th>
              <Th className="text-right">Ingresos</Th>
              <Th className="text-right">Egresos</Th>
              <Th className="text-right">Balance</Th>
              <Th className="text-right">Acumulado</Th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m.key}>
                <Td className="font-medium">{MONTH_NAMES[i]}</Td>
                <Td className="text-right tabular-nums text-success">{fmtArs(m.ingresos)}</Td>
                <Td className="text-right tabular-nums text-destructive">{fmtArs(m.egresos)}</Td>
                <Td
                  className={`text-right font-medium tabular-nums ${
                    m.balance < 0 ? "text-destructive" : ""
                  }`}
                >
                  {fmtArs(m.balance)}
                </Td>
                <Td
                  className={`text-right tabular-nums ${
                    accumulated[i] < 0 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {fmtArs(accumulated[i])}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Desglose por medio */}
      <div>
        <h2 className="mb-2 font-semibold">Por medio de pago</h2>
        {byMethod.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Sin movimientos este año todavía.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Medio</Th>
                <Th className="text-right">Ingresos</Th>
                <Th className="text-right">Egresos</Th>
                <Th className="text-right">Balance</Th>
              </tr>
            </thead>
            <tbody>
              {byMethod.map((row) => (
                <tr key={row.key}>
                  <Td className="font-medium">{METHOD_LABELS[row.key] ?? row.label}</Td>
                  <Td className="text-right tabular-nums text-success">{fmtArs(row.ingresos)}</Td>
                  <Td className="text-right tabular-nums text-destructive">{fmtArs(row.egresos)}</Td>
                  <Td className="text-right font-medium tabular-nums">{fmtArs(row.balance)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
