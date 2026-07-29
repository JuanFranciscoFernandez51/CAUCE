import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { VehiculoForm } from "../../_components/conce/vehiculo-form";

export default async function NuevoVehiculoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo vehículo</h1>
        <p className="text-sm text-muted-foreground">
          Cargá los datos, guardá y en el paso siguiente subís las fotos.
        </p>
      </div>
      <VehiculoForm
        slug={tenant.slug}
        inicial={{
          marca: "",
          modelo: "",
          version: "",
          anio: new Date().getFullYear(),
          km: 0,
          precio: null,
          moneda: "ARS",
          condicion: "usado",
          tipo: "sedan",
          transmision: "",
          combustible: "",
          color: "",
          motor: "",
          dominio: "",
          descripcion: "",
          destacado: false,
          oferta: false,
          publicado: true,
          estado: "disponible",
          fotos: [],
        }}
      />
    </div>
  );
}
