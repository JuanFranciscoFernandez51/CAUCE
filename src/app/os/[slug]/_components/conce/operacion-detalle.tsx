import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Client } from "@prisma/client";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import {
  fmtPrecioVehiculo,
  nombreVehiculo,
  numeroOperacion,
  OPERACION_ESTADO_LABEL,
  permutasDe,
  rutaOperacion,
} from "@/lib/conce";
import { OperacionForm } from "./operacion-form";
import { OperacionEstadoBtns } from "./operacion-estado-btns";

function aFechaInput(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Ficha completa de un mandato o boleto (editable entero) + rastro de las automatizaciones. */
export async function OperacionDetalle({
  tenant,
  id,
  tipo,
}: {
  tenant: Client;
  id: string;
  tipo: "MANDATO" | "BOLETO";
}) {
  const op = await db.conceOperacion.findFirst({
    where: { id, clientId: tenant.id },
    include: {
      vehiculo: { select: { id: true, marca: true, modelo: true, version: true, anio: true, dominio: true, publicado: true, estado: true } },
      contacto: { select: { id: true, name: true } },
    },
  });
  if (!op) notFound();
  // Módulos separados: si entraron por la ruta equivocada, los mandamos a la buena.
  if (op.tipo !== tipo) redirect(`/os/${tenant.slug}/${rutaOperacion(op.tipo)}/${op.id}`);

  const base = `/os/${tenant.slug}/${rutaOperacion(op.tipo)}`;
  const esMandato = op.tipo === "MANDATO";
  const docs = Array.isArray(op.documentacion)
    ? (op.documentacion as { item: string; ok: boolean }[])
    : [];
  const permutas = permutasDe(op.permutas);

  const permutados = permutas.some((p) => p.vehiculoId)
    ? await db.conceVehiculo.findMany({
        where: {
          clientId: tenant.id,
          id: { in: permutas.map((p) => p.vehiculoId).filter((v): v is string => Boolean(v)) },
        },
        select: { id: true, marca: true, modelo: true, anio: true, publicado: true },
      })
    : [];

  const stock = await db.conceVehiculo.findMany({
    where: { clientId: tenant.id, estado: { in: ["disponible", "reservado"] } },
    orderBy: [{ marca: "asc" }, { modelo: "asc" }],
    select: { id: true, marca: true, modelo: true, version: true, anio: true, dominio: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {esMandato ? "Mandato de venta" : "Boleto / Orden de compra"}{" "}
              {numeroOperacion(op.tipo, op.numero)}
            </h1>
            <Badge
              variant={
                op.estado === "VIGENTE"
                  ? "warning"
                  : op.estado === "FIRMADO"
                    ? "primary"
                    : op.estado === "CONCRETADA"
                      ? "success"
                      : "destructive"
              }
            >
              {OPERACION_ESTADO_LABEL[op.estado] ?? op.estado}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {op.contacto ? (
              <Link href={`/os/${tenant.slug}/clientes/${op.contacto.id}`} className="hover:text-primary">
                {op.nombre}
              </Link>
            ) : (
              op.nombre
            )}
            {op.vehiculo
              ? ` · ${nombreVehiculo(op.vehiculo)} ${op.vehiculo.anio}`
              : op.vehiculoTexto
                ? ` · ${op.vehiculoTexto}`
                : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OperacionEstadoBtns slug={tenant.slug} id={op.id} tipo={op.tipo} estado={op.estado} />
          <Link
            href={`${base}/${op.id}/imprimir`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            🖨️ Imprimir / PDF
          </Link>
        </div>
      </div>

      {/* Rastro visible de lo que hicieron las automatizaciones */}
      {op.vehiculo || permutados.length > 0 ? (
        <Card className="space-y-1.5 border-primary/30 bg-primary-soft/40 p-4 text-sm">
          {op.vehiculo ? (
            <p>
              🚗 Vehículo vinculado:{" "}
              <Link href={`/os/${tenant.slug}/stock/${op.vehiculo.id}`} className="font-medium hover:text-primary">
                {nombreVehiculo(op.vehiculo)} {op.vehiculo.anio}
              </Link>{" "}
              <span className="text-muted-foreground">
                ({op.vehiculo.estado}
                {op.vehiculo.publicado ? " · publicado en la web" : " · sin publicar"})
              </span>
            </p>
          ) : null}
          {permutados.map((v) => (
            <p key={v.id}>
              ↔ Permuta en el stock:{" "}
              <Link href={`/os/${tenant.slug}/stock/${v.id}`} className="font-medium hover:text-primary">
                {v.marca} {v.modelo} {v.anio}
              </Link>{" "}
              <span className="text-muted-foreground">
                ({v.publicado ? "publicado" : "sin publicar"})
              </span>
            </p>
          ))}
          {op.firmadoEl ? (
            <p className="text-muted-foreground">
              ✍ Firmado el{" "}
              {op.firmadoEl.toLocaleDateString("es-AR", {
                timeZone: "America/Argentina/Buenos_Aires",
              })}
            </p>
          ) : null}
        </Card>
      ) : null}

      {esMandato && op.estado === "VIGENTE" ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          Cargá marca, modelo y año del vehículo y después tocá <strong>✍ Firmar</strong>: la unidad
          entra sola al stock, sin publicar.
        </p>
      ) : null}

      <OperacionForm
        slug={tenant.slug}
        vehiculos={stock.map((v) => ({
          id: v.id,
          etiqueta: `${nombreVehiculo(v)} ${v.anio}${v.dominio ? ` — ${v.dominio}` : ""}`,
          dominio: v.dominio,
        }))}
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
          vehMarca: op.vehMarca ?? op.vehiculo?.marca ?? "",
          vehModelo: op.vehModelo ?? op.vehiculo?.modelo ?? "",
          vehAnio: op.vehAnio ?? op.vehiculo?.anio ?? null,
          vehKm: op.vehKm ?? null,
          permutas,
          dominio: op.dominio ?? op.vehiculo?.dominio ?? "",
          chasis: op.chasis ?? "",
          motorNro: op.motorNro ?? "",
          documentacion: docs,
          precio: op.precio,
          moneda: op.moneda,
          comisionPct: op.comisionPct,
          sena: op.sena,
          formaPago: op.formaPago ?? "",
          finCuotas: op.finCuotas,
          finValorCuota: op.finValorCuota,
          finDiaVenc: op.finDiaVenc,
          condiciones: op.condiciones ?? "",
          observaciones: op.observaciones ?? "",
        }}
      />

      <p className="text-xs text-muted-foreground">
        Total de la operación: {fmtPrecioVehiculo(op.precio, op.moneda)}
        {permutas.length > 0
          ? ` · ${permutas.length} permuta(s) por $ ${permutas
              .reduce((a, p) => a + (Number(p.valorTomado) || 0), 0)
              .toLocaleString("es-AR")}`
          : ""}
      </p>
    </div>
  );
}
