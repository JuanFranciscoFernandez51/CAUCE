"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, EmptyState, Table, Td, Th } from "@/components/ui";
import { InlineEdit } from "../inline-edit";
import {
  FINANCIACION_ESTADO_LABEL,
  fmtFecha,
  fmtPlata,
  numeroFinanciacion,
} from "@/lib/conce-fin";

export type FinanciacionRow = {
  id: string;
  numero: number;
  cliente: string;
  contactId: string | null;
  descripcion: string | null;
  origen: string;
  montoTotal: number;
  entrega: number;
  cantidadCuotas: number;
  valorCuota: number;
  moneda: string;
  estado: string;
  cobrado: number;
  saldo: number;
  pagadas: number;
  vencidas: number;
  /** YYYY-MM-DD de la próxima cuota impaga */
  proximaIso: string | null;
  proximaNumero: number | null;
};

/**
 * Lista de financiaciones: estado, saldo y próxima cuota de un vistazo, con
 * edición inline de lo que se toca seguido (descripción, cuotas, estado).
 * Al cambiar monto o cantidad de cuotas, el plan se rearma solo respetando
 * lo ya cobrado.
 */
export function FinanciacionesTable({
  slug,
  financiaciones,
}: {
  slug: string;
  financiaciones: FinanciacionRow[];
}) {
  const router = useRouter();
  const [borrando, setBorrando] = useState<string | null>(null);

  if (financiaciones.length === 0) {
    return (
      <EmptyState
        icon="💳"
        title="Todavía no hay financiaciones"
        detail="Cargá una a mano con el botón de arriba, o entregá un boleto con forma de pago financiado: el plan de cuotas se arma solo."
      />
    );
  }

  async function borrar(id: string, numero: number) {
    if (!confirm(`¿Borrar la financiación ${numeroFinanciacion(numero)} y todas sus cuotas?`)) return;
    setBorrando(id);
    try {
      const res = await fetch(`/api/os/${slug}/conce/financiaciones/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBorrando(null);
    }
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Nº</Th>
          <Th>Cliente</Th>
          <Th>Vehículo / concepto</Th>
          <Th className="text-right">Total</Th>
          <Th>Plan</Th>
          <Th className="text-right">Saldo</Th>
          <Th>Próxima cuota</Th>
          <Th>Estado</Th>
          <Th className="w-20"></Th>
        </tr>
      </thead>
      <tbody>
        {financiaciones.map((f) => {
          const endpoint = `/api/os/${slug}/conce/financiaciones/${f.id}`;
          return (
            <tr key={f.id} className="hover:bg-muted/40">
              <Td className="font-mono text-sm">
                <Link href={`/os/${slug}/financiaciones/${f.id}`} className="hover:text-primary">
                  {numeroFinanciacion(f.numero)}
                </Link>
                {f.origen === "BOLETO_AUTOMATICA" ? (
                  <span className="ml-1 text-xs text-primary" title="Se armó sola desde un boleto">
                    ⚡
                  </span>
                ) : null}
              </Td>
              <Td className="font-medium">
                {f.contactId ? (
                  <Link href={`/os/${slug}/clientes/${f.contactId}`} className="hover:text-primary">
                    {f.cliente}
                  </Link>
                ) : (
                  f.cliente
                )}
              </Td>
              <Td className="text-sm">
                <InlineEdit
                  endpoint={endpoint}
                  field="descripcion"
                  value={f.descripcion}
                  placeholder="+ concepto"
                />
              </Td>
              <Td className="text-right text-sm font-semibold">
                <InlineEdit
                  endpoint={endpoint}
                  field="montoTotal"
                  value={f.montoTotal}
                  type="number"
                  alignRight
                  display={(v) => fmtPlata(Number(v) || 0, f.moneda)}
                />
              </Td>
              <Td className="text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <InlineEdit
                    endpoint={endpoint}
                    field="cantidadCuotas"
                    value={f.cantidadCuotas}
                    type="number"
                  />
                  <span>× {fmtPlata(f.valorCuota, f.moneda)}</span>
                </span>
                <span className="text-xs">
                  {f.pagadas}/{f.cantidadCuotas} pagas
                  {f.vencidas > 0 ? (
                    <span className="ml-1 text-destructive">· {f.vencidas} vencida(s)</span>
                  ) : null}
                </span>
              </Td>
              <Td className="text-right text-sm font-semibold">
                {fmtPlata(f.saldo, f.moneda)}
              </Td>
              <Td className="text-sm">
                {f.proximaIso ? (
                  <>
                    <span className="text-muted-foreground">#{f.proximaNumero} · </span>
                    {fmtFecha(new Date(`${f.proximaIso}T12:00:00-03:00`))}
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Td>
              <Td>
                <InlineEdit
                  endpoint={endpoint}
                  field="estado"
                  value={f.estado}
                  options={[
                    { value: "ACTIVA", label: "Activa" },
                    { value: "COMPLETADA", label: "Terminada" },
                    { value: "CANCELADA", label: "Cancelada" },
                  ]}
                  display={(v) => (
                    <Badge
                      variant={
                        v === "ACTIVA" ? "primary" : v === "COMPLETADA" ? "success" : "destructive"
                      }
                    >
                      {FINANCIACION_ESTADO_LABEL[String(v)] ?? String(v)}
                    </Badge>
                  )}
                />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/os/${slug}/financiaciones/${f.id}`}
                    title="Abrir el plan de cuotas"
                    className="text-muted-foreground/60 hover:text-primary"
                  >
                    ✏️
                  </Link>
                  <button
                    type="button"
                    onClick={() => borrar(f.id, f.numero)}
                    disabled={borrando === f.id}
                    title="Borrar financiación"
                    className="text-muted-foreground/60 hover:text-destructive disabled:opacity-40"
                  >
                    🗑️
                  </button>
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
