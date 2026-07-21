import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Badge, ButtonLink } from "@/components/ui";
import { ModuleDisabled } from "../../_components/module-disabled";
import {
  addMonths,
  argDateStr,
  argMonthStr,
  fmtMonthLabel,
  fmtTime,
} from "../../_lib/dates";
import { FichadasEmpleado, type FichadaRow } from "./fichadas";

/** Rango [inicio, fin) de un mes calendario argentino "YYYY-MM". */
function monthRange(monthStr: string): { start: Date; end: Date } {
  return {
    start: new Date(`${monthStr}-01T00:00:00-03:00`),
    end: new Date(`${addMonths(monthStr, 1)}-01T00:00:00-03:00`),
  };
}

export default async function EmpleadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; employeeId: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { slug, employeeId } = await params;
  const { mes } = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "rrhh")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.rrhh} />;
  }

  const employee = await db.employee.findFirst({
    where: { id: employeeId, clientId: tenant.id },
  });
  if (!employee) notFound();

  const month = /^\d{4}-\d{2}$/.test(mes ?? "") ? mes! : argMonthStr();
  const { start, end } = monthRange(month);

  const entries = await db.timeEntry.findMany({
    where: { clientId: tenant.id, employeeId: employee.id, clockIn: { gte: start, lt: end } },
    orderBy: { clockIn: "asc" },
  });

  const now = Date.now();
  const rows: FichadaRow[] = entries.map((t) => ({
    id: t.id,
    date: argDateStr(t.clockIn),
    in: fmtTime(t.clockIn),
    out: t.clockOut ? fmtTime(t.clockOut) : null,
    ms: Math.max(0, (t.clockOut ? t.clockOut.getTime() : now) - t.clockIn.getTime()),
    abierta: t.clockOut === null,
    source: t.source,
  }));

  const base = `/os/${tenant.slug}`;
  const totalMs = rows.reduce((acc, r) => acc + r.ms, 0);
  const diasTrabajados = new Set(rows.map((r) => r.date)).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`${base}/rrhh`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← RRHH
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {employee.name}
            {!employee.active ? <Badge variant="outline">Inactivo</Badge> : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            {employee.role ?? "Sin puesto"} · fichadas y horas del mes
          </p>
        </div>
        <ButtonLink
          href={`${base}/rrhh/${employee.id}/planilla?mes=${month}`}
          variant="secondary"
          size="sm"
        >
          🖨️ Planilla del mes
        </ButtonLink>
      </div>

      {/* Selector de mes */}
      <div className="flex items-center gap-2">
        <Link
          href={`${base}/rrhh/${employee.id}?mes=${addMonths(month, -1)}`}
          className="rounded-md border bg-card px-2.5 py-1 text-sm hover:bg-muted"
          aria-label="Mes anterior"
        >
          ←
        </Link>
        <span className="min-w-36 text-center text-sm font-medium capitalize">
          {fmtMonthLabel(month)}
        </span>
        <Link
          href={`${base}/rrhh/${employee.id}?mes=${addMonths(month, 1)}`}
          className="rounded-md border bg-card px-2.5 py-1 text-sm hover:bg-muted"
          aria-label="Mes siguiente"
        >
          →
        </Link>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Horas del mes</p>
          <p className="text-xl font-semibold tabular-nums">{fmtHorasTotal(totalMs)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Días trabajados</p>
          <p className="text-xl font-semibold tabular-nums">{diasTrabajados}</p>
        </div>
      </div>

      <FichadasEmpleado
        slug={tenant.slug}
        employeeId={employee.id}
        month={month}
        rows={rows}
      />
    </div>
  );
}

function fmtHorasTotal(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0 && m === 0) return "—";
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
