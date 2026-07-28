import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { fotosDeVehiculo, nombreVehiculo } from "@/lib/conce";
import { PublicarPanel, type PublicacionRow, type VehiculoPub } from "../_components/conce/publicar-panel";

export const dynamic = "force-dynamic";

/**
 * Publicar en Instagram y Mercado Libre con un botón: elegís el vehículo,
 * el texto ya viene armado con datos y fotos reales. IG programable (cron);
 * ML queda listo para pegar (conexión pendiente de credenciales del cliente).
 */
export default async function PublicarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ vehiculo?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  const [stock, publicacionesDb] = await Promise.all([
    db.conceVehiculo.findMany({
      where: { clientId: tenant.id, estado: { not: "vendido" } },
      orderBy: { ingresadoEl: "desc" },
      select: {
        id: true,
        marca: true,
        modelo: true,
        version: true,
        anio: true,
        km: true,
        precio: true,
        moneda: true,
        condicion: true,
        fotos: true,
        descripcion: true,
      },
    }),
    db.concePublicacion.findMany({
      where: { clientId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        vehiculo: { select: { marca: true, modelo: true, version: true, anio: true } },
      },
    }),
  ]);

  const vehiculos: VehiculoPub[] = stock.map((v) => ({
    id: v.id,
    etiqueta: `${nombreVehiculo(v)} ${v.anio}`,
    marca: v.marca,
    modelo: v.modelo,
    version: v.version,
    anio: v.anio,
    km: v.km,
    precio: v.precio,
    moneda: v.moneda,
    condicion: v.condicion,
    descripcion: v.descripcion,
    fotos: fotosDeVehiculo(v.fotos),
  }));

  const publicaciones: PublicacionRow[] = publicacionesDb.map((p) => ({
    id: p.id,
    canal: p.canal,
    caption: p.caption,
    estado: p.estado,
    programadaPara: p.programadaPara?.toISOString() ?? null,
    publicadaEn: p.publicadaEn?.toISOString() ?? null,
    fotos: fotosDeVehiculo(p.fotos),
    vehiculo: p.vehiculo ? `${nombreVehiculo(p.vehiculo)} ${p.vehiculo.anio}` : "—",
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publicar</h1>
        <p className="text-sm text-muted-foreground">
          Instagram y Mercado Libre con un botón: elegís el vehículo y el aviso sale armado con
          datos y fotos reales.
        </p>
      </div>
      <PublicarPanel
        slug={tenant.slug}
        vehiculos={vehiculos}
        publicaciones={publicaciones}
        preseleccion={sp.vehiculo ?? null}
      />
    </div>
  );
}
