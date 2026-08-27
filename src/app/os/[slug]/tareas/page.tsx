import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios } from "@/lib/vidrios";
import { TareasBoard, type TareaRow } from "../pendientes/tareas-board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tareas" };

/** Kanban de tareas internas de los sectores (reusa el board genérico de Tarea). */
export default async function TareasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();

  const tareas = await db.tarea.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
    take: 300,
  });

  const filas: TareaRow[] = tareas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    prioridad: t.prioridad,
    categoria: t.categoria,
    vence: t.vence?.toISOString().slice(0, 10) ?? null,
    estado: t.estado,
    hechaAt: t.hechaAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
        <p className="text-sm text-muted-foreground">
          Pendientes de Pedidos, Administración, Taller y Depósito — arrastrá las tarjetas entre columnas.
        </p>
      </div>
      <TareasBoard slug={tenant.slug} tareas={filas} />
    </div>
  );
}
