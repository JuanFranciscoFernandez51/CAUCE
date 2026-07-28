import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { esConcesionaria } from "@/lib/conce-server";
import { nombreVehiculo, OPERACION_ESTADO_LABEL } from "@/lib/conce";
import { Badge } from "@/components/ui";
import { OperacionForm } from "../../_components/conce/operacion-form";
import { OperacionEstadoBtns } from "../../_components/conce/operacion-estado-btns";

function aFechaInput(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export default async function OperacionDetallePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !esConcesionaria(tenant)) notFound();

  const op = await db.conceOperacion.findFirst({
    where: { id, clientId: tenant.id },
    include: {
      vehiculo: { select: { marca: true, modelo: true, version: true, anio: true, dominio: true } },
    },
  });
  if (!op) notFound();

  const docs = Array.isArray(op.documentacion)
    ? (op.documentacion as { item: string; ok: boolean }[])
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {op.tipo === "MANDATO" ? "Mandato de venta" : "Boleto / Orden de compra"} #{op.numero}
            </h1>
            <Badge
              variant={
                op.estado === "VIGENTE" ? "warning" : op.estado === "CONCRETADA" ? "success" : "destructive"
              }
            >
              {OPERACION_ESTADO_LABEL[op.estado] ?? op.estado}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {op.nombre}
            {op.vehiculo
              ? ` · ${nombreVehiculo(op.vehiculo)} ${op.vehiculo.anio}`
              : op.vehiculoTexto
                ? ` · ${op.vehiculoTexto}`
                : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {op.estado === "VIGENTE" ? (
            <OperacionEstadoBtns slug={tenant.slug} id={op.id} tipo={op.tipo} />
          ) : null}
          <Link
            href={`/os/${tenant.slug}/mandatos/${op.id}/imprimir`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            🖨️ Imprimir / PDF
          </Link>
        </div>
      </div>

      <OperacionForm
        slug={tenant.slug}
        vehiculos={[]}
        inicial={{
          id: op.id,
          tipo: op.tipo as "MANDATO" | "BOLETO",
          fecha: aFechaInput(op.fecha),
          nombre: op.nombre,
          dni: op.dni ?? "",
          domicilio: op.domicilio ?? "",
          telefono: op.telefono ?? "",
          email: op.email ?? "",
          vehiculoId: op.vehiculoId ?? "",
          vehiculoTexto:
            op.vehiculoTexto ??
            (op.vehiculo ? `${nombreVehiculo(op.vehiculo)} ${op.vehiculo.anio}` : ""),
          dominio: op.dominio ?? op.vehiculo?.dominio ?? "",
          chasis: op.chasis ?? "",
          motorNro: op.motorNro ?? "",
          documentacion: docs,
          precio: op.precio,
          moneda: op.moneda,
          comisionPct: op.comisionPct,
          sena: op.sena,
          formaPago: op.formaPago ?? "",
          condiciones: op.condiciones ?? "",
          observaciones: op.observaciones ?? "",
        }}
      />
    </div>
  );
}
