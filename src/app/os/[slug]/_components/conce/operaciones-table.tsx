"use client";

import Link from "next/link";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import {
  fmtPrecioVehiculo,
  numeroOperacion,
  OPERACION_ESTADO_LABEL,
  rutaOperacion,
} from "@/lib/conce";
import { OperacionEstadoBtns } from "./operacion-estado-btns";

export type OperacionRow = {
  id: string;
  tipo: string;
  numero: number;
  fechaIso: string; // YYYY-MM-DD (hora Argentina)
  fechaTexto: string;
  nombre: string;
  telefono: string | null;
  vehiculoTitulo: string;
  dominio: string | null;
  precio: number | null;
  moneda: string;
  comisionPct: number | null;
  estado: string;
  permutas: number;
  vehiculoId: string | null;
};

/**
 * Lista de mandatos o boletos EDITABLE DE LAS DOS FORMAS (regla de oro):
 * inline acá mismo (fecha, cliente, teléfono, precio) y con el botón ✏️ para
 * entrar al registro completo. Los botones de estado disparan las
 * automatizaciones (firmar → stock, entregar → vendido, permutas → stock).
 */
export function OperacionesTable({
  slug,
  operaciones,
  tipo,
}: {
  slug: string;
  operaciones: OperacionRow[];
  tipo: "MANDATO" | "BOLETO";
}) {
  const base = `/os/${slug}/${rutaOperacion(tipo)}`;

  if (operaciones.length === 0) {
    return (
      <EmptyState
        icon={tipo === "MANDATO" ? "📝" : "🧾"}
        title={tipo === "MANDATO" ? "Sin mandatos acá" : "Sin boletos acá"}
        detail={
          tipo === "MANDATO"
            ? "Creá el primer mandato de venta con el botón de arriba. Al firmarlo, el vehículo entra solo al stock."
            : "Creá el primer boleto con el botón de arriba. Al entregarlo, el vehículo pasa a vendido."
        }
      />
    );
  }

  const badgeEstado = (e: string) => (
    <Badge
      variant={
        e === "VIGENTE"
          ? "warning"
          : e === "FIRMADO"
            ? "primary"
            : e === "CONCRETADA"
              ? "success"
              : "destructive"
      }
    >
      {OPERACION_ESTADO_LABEL[e] ?? e}
    </Badge>
  );

  return (
    <Table>
      <thead>
        <tr>
          <Th>Nº</Th>
          <Th>Fecha</Th>
          <Th>{tipo === "MANDATO" ? "Titular" : "Comprador"}</Th>
          <Th>Teléfono</Th>
          <Th>Vehículo</Th>
          <Th className="text-right">Precio</Th>
          <Th>Estado</Th>
          <Th className="w-44"></Th>
        </tr>
      </thead>
      <tbody>
        {operaciones.map((o) => {
          const endpoint = `/api/os/${slug}/conce/operaciones/${o.id}`;
          return (
            <tr key={o.id} className="hover:bg-muted/40">
              <Td className="font-mono text-sm">
                <Link href={`${base}/${o.id}`} className="hover:text-primary">
                  {numeroOperacion(o.tipo, o.numero)}
                </Link>
              </Td>
              <Td className="text-sm">
                <InlineEdit
                  endpoint={endpoint}
                  field="fecha"
                  value={o.fechaIso}
                  type="date"
                  display={() => o.fechaTexto}
                />
              </Td>
              <Td className="font-medium">
                <InlineEdit endpoint={endpoint} field="nombre" value={o.nombre} />
              </Td>
              <Td className="text-sm text-muted-foreground">
                <InlineEdit
                  endpoint={endpoint}
                  field="telefono"
                  value={o.telefono}
                  placeholder="+ teléfono"
                />
              </Td>
              <Td className="text-sm">
                {o.vehiculoId ? (
                  <Link href={`/os/${slug}/stock/${o.vehiculoId}`} className="hover:text-primary">
                    {o.vehiculoTitulo}
                  </Link>
                ) : (
                  o.vehiculoTitulo
                )}
                {o.dominio ? (
                  <span className="ml-1 text-xs text-muted-foreground">({o.dominio})</span>
                ) : null}
                {o.permutas > 0 ? (
                  <span className="ml-1.5 text-xs text-primary" title="Permutas tomadas">
                    ↔ {o.permutas}
                  </span>
                ) : null}
              </Td>
              <Td className="text-right text-sm font-semibold">
                <InlineEdit
                  endpoint={endpoint}
                  field="precio"
                  value={o.precio}
                  type="number"
                  alignRight
                  display={(val) => (
                    <>
                      {fmtPrecioVehiculo(val == null || val === "" ? null : Number(val), o.moneda)}
                      {o.tipo === "MANDATO" && o.comisionPct ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          ({o.comisionPct}% com.)
                        </span>
                      ) : null}
                    </>
                  )}
                />
              </Td>
              <Td>{badgeEstado(o.estado)}</Td>
              <Td>
                <div className="flex items-center justify-end gap-2">
                  <OperacionEstadoBtns slug={slug} id={o.id} tipo={o.tipo} estado={o.estado} />
                  <Link
                    href={`${base}/${o.id}`}
                    title="Abrir y editar completo"
                    className="text-muted-foreground/60 hover:text-primary"
                  >
                    ✏️
                  </Link>
                  <Link
                    href={`${base}/${o.id}/imprimir`}
                    title="PDF imprimible"
                    className="text-muted-foreground/60 hover:text-primary"
                  >
                    🖨️
                  </Link>
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
