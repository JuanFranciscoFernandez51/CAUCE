import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Card, EmptyState, Table, Td, Th } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { addDays, argDateStr, dayRange, fmtDayLabel, fmtTime } from "../_lib/dates";
import { RrhhToday, type TodayRow } from "../_components/rrhh-today";
import { EmployeeManager, type ManagedEmployee } from "../_components/employee-manager";

export default async function RrhhPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "rrhh")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.rrhh} />;
  }

  const today = argDateStr();
  const { start: todayStart } = dayRange(today);
  const { start: weekStart } = dayRange(addDays(today, -6));

  const [employees, entries] = await Promise.all([
    db.employee.findMany({
      where: { clientId: tenant.id },
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: { id: true, name: true, phone: true, role: true, active: true },
    }),
    // Últimos 7 días + cualquier entrada abierta (puede venir de antes).
    db.timeEntry.findMany({
      where: {
        clientId: tenant.id,
        OR: [{ clockIn: { gte: weekStart } }, { clockOut: null }],
      },
      orderBy: { clockIn: "asc" },
      select: { id: true, employeeId: true, clockIn: true, clockOut: true },
    }),
  ]);

  const activeEmployees = employees.filter((e) => e.active);
  const now = Date.now();

  // ── Estado de HOY por empleado activo ──
  const todayRows: TodayRow[] = activeEmployees.map((emp) => {
    const mine = entries.filter((t) => t.employeeId === emp.id);
    const open = mine.find((t) => t.clockOut === null);
    if (open) {
      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        status: "working",
        label: `Trabajando desde ${fmtTime(open.clockIn)}`,
      };
    }
    const todayClosed = mine.filter(
      (t) => t.clockIn >= todayStart && t.clockOut !== null
    );
    if (todayClosed.length > 0) {
      const first = todayClosed[0];
      const last = todayClosed[todayClosed.length - 1];
      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        status: "done",
        label: `Terminó ${fmtTime(first.clockIn)}–${fmtTime(last.clockOut!)}`,
      };
    }
    return { id: emp.id, name: emp.name, role: emp.role, status: "none", label: "Sin fichar" };
  });

  // ── Horas de la SEMANA (últimos 7 días) por empleado activo ──
  const weekMs = new Map<string, number>();
  for (const t of entries) {
    const end = t.clockOut ? t.clockOut.getTime() : now; // abiertas cuentan hasta ahora
    const ms = Math.max(0, end - t.clockIn.getTime());
    weekMs.set(t.employeeId, (weekMs.get(t.employeeId) ?? 0) + ms);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">RRHH</h1>
        <p className="text-sm text-muted-foreground">
          Fichadas de hoy, horas de la semana y tu equipo.
        </p>
      </div>

      <section>
        <h2 className="mb-2 font-semibold">
          Hoy <span className="font-normal text-muted-foreground">· {fmtDayLabel(today)}</span>
        </h2>
        {todayRows.length === 0 ? (
          <EmptyState
            icon="🧑‍🔧"
            title="No tenés empleados activos"
            detail="Cargá tu equipo más abajo y después fichá entradas y salidas desde acá."
          />
        ) : (
          <RrhhToday slug={tenant.slug} rows={todayRows} />
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">
          Semana{" "}
          <span className="font-normal text-muted-foreground">
            · {fmtDayLabel(addDays(today, -6))} al {fmtDayLabel(today)}
          </span>
        </h2>
        {activeEmployees.length === 0 ? (
          <Card className="px-4 py-3 text-sm text-muted-foreground">
            Sin empleados activos, no hay horas para mostrar.
          </Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Empleado</Th>
                <Th className="text-right">Horas trabajadas</Th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map((emp) => (
                <tr key={emp.id}>
                  <Td className="font-medium">
                    <Link
                      href={`/os/${tenant.slug}/rrhh/${emp.id}`}
                      className="hover:text-primary hover:underline"
                      title="Ver fichadas y planilla del mes"
                    >
                      {emp.name}
                    </Link>
                  </Td>
                  <Td className="text-right tabular-nums">
                    {fmtHours(weekMs.get(emp.id) ?? 0)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Equipo</h2>
        <EmployeeManager slug={tenant.slug} employees={employees as ManagedEmployee[]} />
      </section>
    </div>
  );
}

function fmtHours(ms: number): string {
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0 && m === 0) return "—";
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
