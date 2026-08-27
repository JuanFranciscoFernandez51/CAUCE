import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esVidrios, ordenDatos, totalOrden, vehiculoLinea } from "@/lib/vidrios";
import { FacturacionPanel, type FacturaRow } from "./facturacion-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Facturación" };

/**
 * Bandeja de facturación ARCA: se seleccionan las órdenes a facturar y quedan
 * "a facturar" → "facturada". La emisión real de CAE queda pendiente del alta
 * del certificado del cliente en ARCA (no hay integración AFIP acá).
 */
export default async function FacturacionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esVidrios(tenant)) notFound();

  const lista = await db.presupuestoDoc.findMany({
    where: { clientId: tenant.id },
    orderBy: { numero: "desc" },
    take: 300,
  });

  const filas: FacturaRow[] = lista.map((p) => {
    const d = ordenDatos(p);
    return {
      id: p.id,
      numero: p.numero,
      nombre: p.nombre,
      vehiculo: vehiculoLinea(d),
      total: totalOrden(p),
      facturacion: d.facturacion,
      fecha: p.createdAt.toLocaleDateString("es-AR"),
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
        <p className="text-sm text-muted-foreground">
          Marcá qué órdenes van a factura y llevá el control de lo emitido.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 px-4 py-3">
        <span aria-hidden>⚠️</span>
        <p className="text-sm">
          <span className="font-semibold">Emisión ARCA: pendiente de alta de certificado.</span>{" "}
          Cuando el certificado fiscal del negocio esté cargado, desde acá se van a emitir las
          facturas con CAE de las órdenes seleccionadas. Mientras tanto, el circuito de selección
          y control ya funciona.
        </p>
      </div>

      <FacturacionPanel slug={tenant.slug} ordenes={filas} />
    </div>
  );
}
