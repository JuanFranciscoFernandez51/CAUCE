import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { EventosPanel, type EventoRow } from "./eventos-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Eventos" };

/** Cada evento, sus ítems y sus hitos — el corazón del negocio de Jess. */
export default async function EventosOrgPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nuevo?: string; abrir?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const tipos = ((tenant.settings as { tiposEvento?: string[] } | null)?.tiposEvento) ?? ["Boda", "Cumpleaños", "Corporativo", "Otros"];
  const eventos = await db.eventoOrg.findMany({
    where: { clientId: tenant.id },
    orderBy: [{ fecha: "asc" }],
  });

  const filas: EventoRow[] = eventos.map((e) => ({
    id: e.id,
    nombre: e.nombre,
    tipo: e.tipo,
    fecha: e.fecha?.toISOString().slice(0, 10) ?? null,
    lugar: e.lugar,
    estado: e.estado,
    presupuesto: e.presupuesto,
    cobrado: e.cobrado,
    contacto: e.contacto,
    telefono: e.telefono,
    hitos: (e.hitos as { titulo: string; fecha: string; hecho: boolean }[]) ?? [],
    notas: e.notas,
  }));

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-[34px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>Eventos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cada evento, sus datos y sus hitos. Tocá uno para abrirlo.</p>
      </div>

      <EventosPanel slug={slug} eventos={filas} tipos={tipos} abrirInicial={sp.abrir ?? null} nuevoInicial={sp.nuevo === "1"} />
    </div>
  );
}
