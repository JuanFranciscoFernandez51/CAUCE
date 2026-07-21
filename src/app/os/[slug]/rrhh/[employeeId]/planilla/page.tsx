import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS, tenantBranding } from "@/lib/tenant";
import { ModuleDisabled } from "../../../_components/module-disabled";
import { Imprimible } from "../../../_components/imprimible";
import {
  addMonths,
  argDateStr,
  argMonthStr,
  fmtDayLabel,
  fmtMonthLabel,
  fmtTime,
} from "../../../_lib/dates";

/** Planilla mensual de horas de un empleado, lista para imprimir/PDF (liquidación). */
export default async function PlanillaPage({
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
  const start = new Date(`${month}-01T00:00:00-03:00`);
  const end = new Date(`${addMonths(month, 1)}-01T00:00:00-03:00`);

  const entries = await db.timeEntry.findMany({
    where: { clientId: tenant.id, employeeId: employee.id, clockIn: { gte: start, lt: end } },
    orderBy: { clockIn: "asc" },
  });

  // Agrupar por día argentino (solo fichadas cerradas suman horas).
  const dias = new Map<string, { tramos: string[]; ms: number }>();
  for (const t of entries) {
    const date = argDateStr(t.clockIn);
    const d = dias.get(date) ?? { tramos: [], ms: 0 };
    d.tramos.push(`${fmtTime(t.clockIn)}–${t.clockOut ? fmtTime(t.clockOut) : "…"}`);
    if (t.clockOut) d.ms += Math.max(0, t.clockOut.getTime() - t.clockIn.getTime());
    dias.set(date, d);
  }
  const totalMs = [...dias.values()].reduce((a, d) => a + d.ms, 0);

  const branding = tenantBranding(tenant);
  const negocio = branding.displayName;

  return (
    <div className="space-y-3">
      <Link
        href={`/os/${tenant.slug}/rrhh/${employee.id}?mes=${month}`}
        className="no-print text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a {employee.name}
      </Link>

      <Imprimible
        negocio={negocio}
        primary={branding.primary}
        titulo="Planilla de horas"
        subtitulo={`${employee.name} · ${fmtMonthLabel(month)}`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-1.5 pr-2">Día</th>
              <th className="py-1.5 pr-2">Fichadas</th>
              <th className="py-1.5 text-right">Horas</th>
            </tr>
          </thead>
          <tbody>
            {[...dias.entries()].map(([date, d]) => (
              <tr key={date} className="border-b border-gray-100">
                <td className="py-1.5 pr-2 capitalize">{fmtDayLabel(date)}</td>
                <td className="py-1.5 pr-2 font-mono text-xs tabular-nums">
                  {d.tramos.join(" · ")}
                </td>
                <td className="py-1.5 text-right tabular-nums">{fmtHs(d.ms)}</td>
              </tr>
            ))}
            {dias.size === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-400">
                  Sin fichadas este mes
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-semibold">
              <td className="py-2" colSpan={2}>
                Total del mes · {dias.size} día{dias.size === 1 ? "" : "s"} trabajado
                {dias.size === 1 ? "" : "s"}
              </td>
              <td className="py-2 text-right tabular-nums">{fmtHs(totalMs)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
          <div className="border-t pt-2">Firma del empleado</div>
          <div className="border-t pt-2">Firma del responsable</div>
        </div>
      </Imprimible>
    </div>
  );
}

function fmtHs(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0 && m === 0) return "—";
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
