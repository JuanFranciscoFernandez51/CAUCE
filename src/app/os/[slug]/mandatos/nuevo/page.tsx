import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { nombreVehiculo } from "@/lib/conce";
import { OperacionForm } from "../../_components/conce/operacion-form";

function hoyArg(): string {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return f.format(new Date());
}

export default async function NuevaOperacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string; vehiculo?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  const tipo = sp.tipo === "MANDATO" ? "MANDATO" : "BOLETO";

  const stock = await db.conceVehiculo.findMany({
    where: { clientId: tenant.id, estado: { in: ["disponible", "reservado"] } },
    orderBy: [{ marca: "asc" }, { modelo: "asc" }],
    select: { id: true, marca: true, modelo: true, version: true, anio: true, dominio: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {tipo === "MANDATO" ? "Nuevo mandato de venta" : "Nuevo boleto / orden de compra"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tipo === "MANDATO"
            ? "El titular deja su vehículo en consignación para la venta."
            : "El comprador reserva/compra un vehículo. Al concretarlo, la venta entra sola a Finanzas."}
        </p>
      </div>
      <OperacionForm
        slug={tenant.slug}
        vehiculos={stock.map((v) => ({
          id: v.id,
          etiqueta: `${nombreVehiculo(v)} ${v.anio}${v.dominio ? ` — ${v.dominio}` : ""}`,
          dominio: v.dominio,
        }))}
        inicial={{
          tipo,
          fecha: hoyArg(),
          nombre: "",
          dni: "",
          domicilio: "",
          telefono: "",
          email: "",
          vehiculoId: sp.vehiculo ?? "",
          vehiculoTexto: "",
          dominio: "",
          chasis: "",
          motorNro: "",
          documentacion: [],
          precio: null,
          moneda: "ARS",
          comisionPct: tipo === "MANDATO" ? 5 : null,
          sena: 0,
          formaPago: "",
          condiciones: "",
          observaciones: "",
        }}
      />
    </div>
  );
}
