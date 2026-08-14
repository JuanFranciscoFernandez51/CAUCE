import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { TareasBoard, type TareaRow } from "./tareas-board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pendientes" };

/** Pipeline de tareas: Por hacer → En progreso → Hecho, con arrastre. */
export default async function PendientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const tareas = await db.tarea.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
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

  const pendientes = filas.filter((t) => t.estado !== "hecho").length;
  const vencidas = filas.filter((t) => t.estado !== "hecho" && t.vence && new Date(t.vence + "T23:59") < new Date()).length;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-[34px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>Pendientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu pipeline de tareas. Arrastrá las tarjetas entre columnas.
          <span className="ml-3 font-semibold text-foreground">{pendientes} pendientes</span>
          {vencidas ? <span className="ml-2 font-semibold" style={{ color: "#B85850" }}>{vencidas} vencidas</span> : null}
        </p>
      </div>
      <TareasBoard slug={slug} tareas={filas} />
    </div>
  );
}
