import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { argDateStr } from "../../_lib/dates";
import {
  ProyectoDetail,
  type DetailProyecto,
  type KanbanTarea,
} from "../../_components/proyecto-detail";

export default async function ProyectoDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "proyectos")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.proyectos} />;
  }

  const proyecto = await db.proyecto.findFirst({
    where: { id, clientId: tenant.id },
    select: {
      id: true,
      name: true,
      clienteName: true,
      status: true,
      area: true,
      budgetUsd: true,
      startDate: true,
      dueDate: true,
      description: true,
    },
  });
  if (!proyecto) {
    return (
      <div className="space-y-4">
        <Link href={`/os/${slug}/proyectos`} className="text-sm text-primary hover:underline">
          ← Volver a Proyectos
        </Link>
        <ModuleDisabled
          moduleLabel="Proyecto"
          title="Proyecto no encontrado"
          detail="Puede que lo hayan borrado o que no sea de esta cuenta."
        />
      </div>
    );
  }

  const [tareas, employees] = await Promise.all([
    db.proyectoTarea.findMany({
      where: { clientId: tenant.id, proyectoId: id },
      orderBy: [{ orderIdx: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        status: true,
        assigneeId: true,
        dueAt: true,
        hours: true,
      },
    }),
    db.employee.findMany({
      where: { clientId: tenant.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const detail: DetailProyecto = {
    id: proyecto.id,
    name: proyecto.name,
    clienteName: proyecto.clienteName,
    status: proyecto.status,
    area: proyecto.area,
    budgetUsd: proyecto.budgetUsd,
    startDate: proyecto.startDate ? argDateStr(proyecto.startDate) : null,
    dueDate: proyecto.dueDate ? argDateStr(proyecto.dueDate) : null,
    description: proyecto.description,
  };

  const kanban: KanbanTarea[] = tareas.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    assigneeId: t.assigneeId,
    dueAt: t.dueAt ? argDateStr(t.dueAt) : null,
    hours: t.hours,
  }));

  return (
    <div className="space-y-6">
      <Link href={`/os/${slug}/proyectos`} className="text-sm text-primary hover:underline">
        ← Volver a Proyectos
      </Link>
      <ProyectoDetail
        slug={tenant.slug}
        proyecto={detail}
        tareas={kanban}
        employees={employees}
      />
    </div>
  );
}
