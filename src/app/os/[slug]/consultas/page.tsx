import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esBazar } from "@/lib/bazar-server";
import { esConcesionaria } from "@/lib/conce-server";
import { nombreVehiculo } from "@/lib/conce";
import { ConsultasList, type ConsultaRow } from "../_components/bazar/consultas-list";
import {
  ConsultasConceList,
  type ConsultaConceRow,
} from "../_components/conce/consultas-conce-list";

export const dynamic = "force-dynamic";

export default async function ConsultasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || (!esBazar(tenant) && !esConcesionaria(tenant))) notFound();

  // Template concesionaria: bandeja propia (consultas por vehículo + chatbot).
  if (esConcesionaria(tenant)) {
    const consultasDb = await db.conceConsulta.findMany({
      where: { clientId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        vehiculo: { select: { marca: true, modelo: true, version: true, anio: true, slug: true } },
      },
    });
    const consultas: ConsultaConceRow[] = consultasDb.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      contacto: c.contacto,
      mensaje: c.mensaje,
      estado: c.estado,
      origen: c.origen,
      fecha: c.createdAt.toISOString(),
      vehiculo: c.vehiculo ? `${nombreVehiculo(c.vehiculo)} ${c.vehiculo.anio}` : null,
      vehiculoSlug: c.vehiculo?.slug ?? null,
    }));
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
          <p className="text-sm text-muted-foreground">
            Todo lo que preguntan desde la web y el chatbot. Respondé por WhatsApp a 1 click y marcá listo.
          </p>
        </div>
        <ConsultasConceList slug={tenant.slug} consultas={consultas} />
      </div>
    );
  }

  const consultasDb = await db.bazarConsulta.findMany({
    where: { clientId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  // Nombre del producto consultado (si sigue existiendo), en una sola query.
  const productoIds = [...new Set(consultasDb.map((c) => c.productoId).filter(Boolean))] as string[];
  const productos = productoIds.length
    ? await db.bazarProducto.findMany({
        where: { id: { in: productoIds }, clientId: tenant.id },
        select: { id: true, nombre: true, slug: true },
      })
    : [];
  const porId = new Map(productos.map((p) => [p.id, p]));

  const consultas: ConsultaRow[] = consultasDb.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    contacto: c.contacto,
    mensaje: c.mensaje,
    estado: c.estado,
    fecha: c.createdAt.toISOString(),
    producto: c.productoId ? (porId.get(c.productoId)?.nombre ?? null) : null,
    productoSlug: c.productoId ? (porId.get(c.productoId)?.slug ?? null) : null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
        <p className="text-sm text-muted-foreground">
          Todo lo que preguntan desde la tienda. Respondé por WhatsApp a 1 click y marcá listo.
        </p>
      </div>
      <ConsultasList slug={tenant.slug} consultas={consultas} />
    </div>
  );
}
