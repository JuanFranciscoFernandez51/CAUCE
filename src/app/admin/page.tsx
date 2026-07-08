import Link from "next/link";
import { db } from "@/lib/db";
import { currentPeriod } from "@/lib/usage";
import { fmtUsd } from "@/lib/pricing";
import { Badge, Card, EmptyState, Stat, Table, Td, Th } from "@/components/ui";
import {
  fmtDate,
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
    procesosGroups,
    ultimosLeads,
    procesosPausados,
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
    db.proceso.groupBy({ by: ["estado"], _count: true }),
    db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.proceso.findMany({
      where: { estado: "PAUSADO" },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const mrr = activeAgg._sum.mrr ?? 0;
  const costos = activeAgg._sum.costEstUsd ?? 0;
  const margen = mrr - costos;
  const mensajes = usageAgg._sum.messages ?? 0;
  const procesosActivos = procesosGroups.find((g) => g.estado === "ACTIVO")?._count ?? 0;
  const totalProcesos = procesosGroups.reduce((acc, g) => acc + g._count, 0);

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
        <Stat
          label="Procesos corriendo"
          value={totalProcesos === 0 ? "—" : `${procesosActivos} / ${totalProcesos}`}
          hint={totalProcesos === 0 ? "Sin procesos todavía" : "Activos sobre el total"}
          tone={totalProcesos > 0 && procesosActivos === totalProcesos ? "success" : "default"}
        />
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
          <h2 className="font-semibold">Procesos pausados</h2>
          {procesosPausados.length === 0 ? (
            <EmptyState
              icon="✅"
              title="Todo en orden"
              detail="Todos los procesos de todos los clientes están corriendo."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Proceso</Th>
                  <Th>Cliente</Th>
                  <Th>Corre</Th>
                </tr>
              </thead>
              <tbody>
                {procesosPausados.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <Td>
                      <Link
                        href={`/admin/clientes/${p.client.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {p.nombre}
                      </Link>
                    </Td>
                    <Td>{p.client.name}</Td>
                    <Td className="text-muted-foreground">{p.cuando}</Td>
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
