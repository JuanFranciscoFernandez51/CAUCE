import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { Stat } from "@/components/ui";
import { ModuleDisabled } from "../_components/module-disabled";
import { argMonthStr } from "../_lib/dates";
import { PROYECTO_STATUSES, type ProyectoStatus } from "../_lib/proyectos";
import { ProyectosBoard, type BoardProyecto } from "../_components/proyectos-board";

export default async function ProyectosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "proyectos")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.proyectos} />;
  }

  const filtro =
    sp.estado && PROYECTO_STATUSES.includes(sp.estado as ProyectoStatus)
      ? (sp.estado as ProyectoStatus)
      : null;

  const proyectos = await db.proyecto.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      clienteName: true,
      status: true,
      area: true,
      budgetUsd: true,
      dueDate: true,
      tareas: { select: { status: true, hours: true } },
    },
  });

  // ── KPIs ──────────────────────────────────────────────────────────────
  const monthPrefix = argMonthStr(); // "YYYY-MM" argentino
  const activos = proyectos.filter(
    (p) => p.status === "en_curso" || p.status === "revision"
  ).length;
  const entregadosMes = proyectos.filter(
    (p) =>
      p.status === "entregado" &&
      p.dueDate &&
      p.dueDate.toLocaleDateString("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires",
      }).slice(0, 7) === monthPrefix
  ).length;
  let tareasPendientes = 0;
  let horasCargadas = 0;
  for (const p of proyectos) {
    for (const t of p.tareas) {
      if (t.status !== "hecho") tareasPendientes++;
      horasCargadas += t.hours ?? 0;
    }
  }

  const board: BoardProyecto[] = proyectos.map((p) => {
    const total = p.tareas.length;
    const done = p.tareas.filter((t) => t.status === "hecho").length;
    return {
      id: p.id,
      name: p.name,
      clienteName: p.clienteName,
      status: p.status,
      area: p.area,
      budgetUsd: p.budgetUsd,
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      tareasDone: done,
      tareasTotal: total,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Proyectos</h1>
        <p className="text-sm text-muted-foreground">
          Tus proyectos de principio a fin, con tareas asignadas al equipo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Proyectos activos" value={activos} hint="En curso o en revisión" />
        <Stat
          label="Entregados este mes"
          value={entregadosMes}
          tone="success"
          hint="Con vencimiento este mes"
        />
        <Stat label="Tareas pendientes" value={tareasPendientes} hint="Todo lo que falta cerrar" />
        <Stat
          label="Horas cargadas"
          value={horasCargadas % 1 === 0 ? horasCargadas : horasCargadas.toFixed(1)}
          hint="Suma de horas de todas las tareas"
        />
      </div>

      <ProyectosBoard slug={tenant.slug} proyectos={board} filtro={filtro} />
    </div>
  );
}
