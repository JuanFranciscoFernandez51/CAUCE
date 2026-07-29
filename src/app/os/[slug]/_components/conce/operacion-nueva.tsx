import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { nombreVehiculo } from "@/lib/conce";
import { OperacionForm } from "./operacion-form";

function hoyArg(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Alta de un mandato o un boleto (módulos separados, mismo formulario). */
export async function OperacionNueva({
  tenant,
  tipo,
  vehiculoId,
}: {
  tenant: Client;
  tipo: "MANDATO" | "BOLETO";
  vehiculoId?: string;
}) {
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
            ? "El titular deja su vehículo en consignación. Al firmarlo, la unidad entra sola al stock sin publicar."
            : "El comprador reserva/compra un vehículo. Al entregarlo, pasa a vendido, la venta entra a Finanzas y las permutas van al stock."}
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
          vehiculoId: vehiculoId ?? "",
          vehiculoTexto: "",
          vehMarca: "",
          vehModelo: "",
          vehAnio: null,
          vehKm: null,
          permutas: [],
          dominio: "",
          chasis: "",
          motorNro: "",
          documentacion: [],
          precio: null,
          moneda: "ARS",
          comisionPct: tipo === "MANDATO" ? 5 : null,
          sena: 0,
          formaPago: "",
          finCuotas: null,
          finValorCuota: null,
          finDiaVenc: null,
          condiciones: "",
          observaciones: "",
        }}
      />
    </div>
  );
}
