import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { CotizacionesPanel, type CotRow, type SectorMob } from "./cotizaciones-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cotizaciones" };

/** Cotizaciones al estilo del panel de Jess: generá PDF y marcá el estado. */
export default async function CotizacionesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const st = (tenant.settings ?? {}) as {
    tiposEvento?: string[];
    mobiliario?: SectorMob[];
    plantillaCotizacion?: { precio: number; moneda: string; nota?: string };
  };

  const [docs, contactos] = await Promise.all([
    db.presupuestoDoc.findMany({ where: { clientId: tenant.id }, orderBy: { numero: "desc" }, take: 100 }),
    db.contact.findMany({
      where: { clientId: tenant.id },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
  ]);

  const filas: CotRow[] = docs.map((d) => {
    const datos = (d.datos as { etiqueta: string; valor: string }[]) ?? [];
    const dato = (k: string) => datos.find((x) => x.etiqueta === k)?.valor ?? "";
    const items = (d.items as { detalle: string; cant: number; unitario: number }[]) ?? [];
    return {
      id: d.id,
      numero: d.numero,
      cliente: d.nombre,
      evento: dato("Evento"),
      tipo: dato("Tipo"),
      fecha: d.createdAt.toLocaleDateString("es-AR"),
      estado: d.estado,
      precioUsd: Number(dato("PrecioUSD") || 0),
      mobiliario: items.reduce((a, i) => a + i.cant * i.unitario, 0),
    };
  });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-[34px] leading-none" style={{ fontFamily: "var(--font-italiana)" }}>
          Cotizaciones y facturas
        </h1>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Generá PDF, marcá aceptada/rechazada
        </p>
      </div>
      <CotizacionesPanel
        slug={slug}
        cotizaciones={filas}
        contactos={contactos}
        tipos={st.tiposEvento ?? []}
        mobiliario={st.mobiliario ?? []}
        plantilla={{ precio: st.plantillaCotizacion?.precio ?? 7500, moneda: st.plantillaCotizacion?.moneda ?? "USD", nota: st.plantillaCotizacion?.nota ?? "" }}
      />
    </div>
  );
}
