import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { FichaEvento, type PresupuestoLigado } from "./ficha-evento";

export const dynamic = "force-dynamic";
export const metadata = { title: "Evento" };

/** Ficha completa del evento, estilo boleto: se entra, se edita y se cobra acá. */
export default async function EventoFichaPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const evento = await db.eventoOrg.findFirst({ where: { id, clientId: tenant.id } });
  if (!evento) notFound();

  // Presupuestos ligados: los que nombran a este evento en sus datos.
  const docs = await db.presupuestoDoc.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const ligados: PresupuestoLigado[] = docs
    .filter((d) => {
      const datos = (d.datos as { etiqueta: string; valor: string }[] | null) ?? [];
      return datos.some((x) => x.etiqueta === "Evento" && x.valor.trim().toLowerCase() === evento.nombre.trim().toLowerCase());
    })
    .map((d) => ({ id: d.id, numero: d.numero, estado: d.estado, fecha: d.createdAt.toISOString() }));

  const tipos = ((tenant.settings as { tiposEvento?: string[] } | null)?.tiposEvento) ?? [];

  return (
    <FichaEvento
      slug={slug}
      tipos={tipos}
      presupuestos={ligados}
      evento={{
        id: evento.id,
        nombre: evento.nombre,
        tipo: evento.tipo,
        fecha: evento.fecha ? evento.fecha.toISOString().slice(0, 10) : "",
        lugar: evento.lugar ?? "",
        estado: evento.estado,
        presupuesto: evento.presupuesto,
        cobrado: evento.cobrado,
        contacto: evento.contacto ?? "",
        telefono: evento.telefono ?? "",
        notas: evento.notas ?? "",
        hitos: (evento.hitos as { titulo: string; fecha: string; hecho: boolean }[] | null) ?? [],
        pagos: (evento.pagos as { fecha: string; concepto: string; monto: number }[] | null) ?? [],
        mobiliario: (evento.mobiliario as { id: string; nombre: string; cant: number; precio: number }[] | null) ?? [],
      }}
    />
  );
}
