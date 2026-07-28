import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { fotosDeVehiculo, nombreVehiculo } from "@/lib/conce";
import { VehiculoForm } from "../../_components/conce/vehiculo-form";

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  const v = await db.conceVehiculo.findFirst({ where: { id, clientId: tenant.id } });
  if (!v) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {nombreVehiculo(v)} {v.anio}
          </h1>
          <p className="text-sm text-muted-foreground">
            {v.visitas} visitas en la web · ingresado el{" "}
            {v.ingresadoEl.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/os/${tenant.slug}/publicar?vehiculo=${v.id}`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            📣 Publicar
          </Link>
          <Link
            href={`/sitio/${tenant.slug}/vehiculo/${v.slug}`}
            target="_blank"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            🌐 Ver en la web
          </Link>
        </div>
      </div>
      <VehiculoForm
        slug={tenant.slug}
        inicial={{
          id: v.id,
          marca: v.marca,
          modelo: v.modelo,
          version: v.version ?? "",
          anio: v.anio,
          km: v.km,
          precio: v.precio,
          moneda: v.moneda,
          condicion: v.condicion,
          tipo: v.tipo,
          transmision: v.transmision ?? "",
          combustible: v.combustible ?? "",
          color: v.color ?? "",
          motor: v.motor ?? "",
          dominio: v.dominio ?? "",
          descripcion: v.descripcion ?? "",
          destacado: v.destacado,
          oferta: v.oferta,
          estado: v.estado,
          fotos: fotosDeVehiculo(v.fotos),
        }}
      />
    </div>
  );
}
