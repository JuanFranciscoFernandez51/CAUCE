import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug, hasModule, MODULE_LABELS } from "@/lib/tenant";
import { ModuleDisabled } from "../../_components/module-disabled";
import { PanelEvento, type EventoPanelData } from "./panel-evento";
import type { Intento } from "../tiempos";

export default async function EventoPanelPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  if (!hasModule(tenant, "eventos")) {
    return <ModuleDisabled moduleLabel={MODULE_LABELS.eventos} />;
  }

  const evento = await db.evento.findFirst({
    where: { id, clientId: tenant.id },
    include: { competidores: { orderBy: { numero: "asc" } } },
  });
  if (!evento) notFound();

  const data: EventoPanelData = {
    id: evento.id,
    nombre: evento.nombre,
    fecha: evento.fecha,
    lugar: evento.lugar,
    categorias: evento.categorias,
    cupo: evento.cupo,
    inscripcionesAbiertas: evento.inscripcionesAbiertas,
    activo: evento.activo,
    competidores: evento.competidores.map((c) => ({
      id: c.id,
      numero: c.numero,
      nombre: c.nombre,
      categoria: c.categoria,
      intentos: (c.intentos as Intento[]) ?? [],
    })),
  };

  return (
    <div className="space-y-4">
      <Link
        href={`/os/${tenant.slug}/eventos`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Eventos
      </Link>
      <PanelEvento slug={tenant.slug} evento={data} />
    </div>
  );
}
