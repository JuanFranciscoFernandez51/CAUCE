import Link from "next/link";
import { db } from "@/lib/db";
import { currentPeriod } from "@/lib/usage";
import { fmtUsd } from "@/lib/pricing";
import { Badge, Card, EmptyState, Stat, Table, Td, Th } from "@/components/ui";
import {
  AUTOMATION_STATUS_BADGE,
  AUTOMATION_STATUS_LABELS,
  fmtDate,
  HEALTH_BADGE,
  HEALTH_LABELS,
  LEAD_SOURCE_BADGE,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_BADGE,
  LEAD_STATUS_LABELS,
} from "./_components/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const period = currentPeriod();
  const [yearStr, monthStr] = period.split("-");
  // Inicio del mes en hora argentina (00:00 ARG = 03:00 UTC)
  const monthStart = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1, 3));

  const [
    activeAgg,
    leadsNuevosMes,
    enPipeline,
    churned,
    usageAgg,
    healthGroups,
    ultimosLeads,
    autosConProblemas,
  ] = await Promise.all([
    db.client.aggregate({
      where: { status: "ACTIVE" },
      _sum: { mrr: true, costEstUsd: true },
      _count: true,
    }),
    db.lead.count({ where: { createdAt: { gte: monthStart } } }),
    db.project.count({ where: { stage: { not: "ACTIVO" } } }),
    db.client.count({ where: { status: "CHURNED" } }),
    db.usage.aggregate({ where: { period }, _sum: { messages: true, costUsd: true } }),
    db.automation.groupBy({ by: ["health"], _count: true }),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.automation.findMany({
      where: {
        OR: [{ health: { in: ["WARN", "DOWN"] } }, { status: "ERROR" }],
      },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const mrr = activeAgg._sum.mrr ?? 0;
  const costos = activeAgg._sum.costEstUsd ?? 0;
  const margen = mrr - costos;
  const mensajes = usageAgg._sum.messages ?? 0;
  const healthCount = (h: string) =>
    healthGroups.find((g) => g.health === h)?._count ?? 0;
  const totalAutos = healthGroups.reduce((acc, g) => acc + g._count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          El negocio de Cauce hoy — período {period}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Stat label="MRR" value={fmtUsd(mrr)} hint="Clientes activos" tone="success" />
        <Stat label="Clientes activos" value={activeAgg._count} />
        <Stat label="Leads nuevos del mes" value={leadsNuevosMes} />
        <Stat label="Proyectos en pipeline" value={enPipeline} hint="Todavía no activos" />
        <Stat
          label="Margen estimado/mes"
          value={fmtUsd(margen)}
          hint={`MRR − costos estimados (${fmtUsd(costos)})`}
          tone={margen >= 0 ? "success" : "destructive"}
        />
        <Stat label="Churn" value={churned} hint="Clientes dados de baja" tone={churned > 0 ? "warning" : "default"} />
        <Stat label="Mensajes del período" value={mensajes.toLocaleString("es-AR")} hint={`Costo IA: ${fmtUsd(Math.round((usageAgg._sum.costUsd ?? 0) * 100) / 100)}`} />
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Automatizaciones por salud
          </p>
          {totalAutos === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Sin automatizaciones todavía.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["OK", "WARN", "DOWN", "UNKNOWN"] as const).map((h) =>
                healthCount(h) > 0 ? (
                  <Badge key={h} variant={HEALTH_BADGE[h]}>
                    {HEALTH_LABELS[h]}: {healthCount(h)}
                  </Badge>
                ) : null
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Últimos leads</h2>
            <Link href="/admin/leads" className="text-sm font-medium text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
          {ultimosLeads.length === 0 ? (
            <EmptyState
              title="Todavía no hay leads"
              detail="Cuando alguien complete el intake o agende una consultoría, aparece acá."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Negocio</Th>
                  <Th>Fuente</Th>
                  <Th>Estado</Th>
                  <Th>Fecha</Th>
                </tr>
              </thead>
              <tbody>
                {ultimosLeads.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/50">
                    <Td>
                      <Link href={`/admin/leads/${l.id}`} className="font-medium text-primary hover:underline">
                        {l.name}
                      </Link>
                    </Td>
                    <Td>{l.business ?? "—"}</Td>
                    <Td>
                      <Badge variant={LEAD_SOURCE_BADGE[l.source] ?? "default"}>
                        {LEAD_SOURCE_LABELS[l.source] ?? l.source}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={LEAD_STATUS_BADGE[l.status] ?? "default"}>
                        {LEAD_STATUS_LABELS[l.status] ?? l.status}
                      </Badge>
                    </Td>
                    <Td className="text-muted-foreground">{fmtDate(l.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Automatizaciones con problemas</h2>
          {autosConProblemas.length === 0 ? (
            <EmptyState
              icon="✅"
              title="Todo en orden"
              detail="Ninguna automatización con salud WARN/DOWN ni en estado de error."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Automatización</Th>
                  <Th>Cliente</Th>
                  <Th>Estado</Th>
                  <Th>Salud</Th>
                </tr>
              </thead>
              <tbody>
                {autosConProblemas.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/50">
                    <Td>
                      <Link
                        href={`/admin/clientes/${a.client.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {a.name}
                      </Link>
                      {a.lastError ? (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-destructive">{a.lastError}</p>
                      ) : null}
                    </Td>
                    <Td>{a.client.name}</Td>
                    <Td>
                      <Badge variant={AUTOMATION_STATUS_BADGE[a.status] ?? "default"}>
                        {AUTOMATION_STATUS_LABELS[a.status] ?? a.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={HEALTH_BADGE[a.health] ?? "default"}>
                        {HEALTH_LABELS[a.health] ?? a.health}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>
      </div>
    </div>
  );
}
