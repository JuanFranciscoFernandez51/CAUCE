"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card, Table, Td, Th } from "@/components/ui";
import {
  CUOTA_ESTADO_LABEL,
  METODOS_PAGO,
  diasHasta,
  fmtFecha,
  fmtPlata,
  mensajeAvisoCuota,
  waLink,
} from "@/lib/conce-fin";

export type CuotaRow = {
  id: string;
  numero: number;
  monto: number;
  montoPagado: number;
  /** YYYY-MM-DD hora Argentina */
  vencIso: string;
  pagoIso: string | null;
  estado: string;
  metodoPago: string | null;
  comprobante: string | null;
  avisado: boolean;
};

/**
 * Plan de cuotas: se cobra de un clic ("Cobrar"), se carga un pago parcial
 * ("Parte") y se avisa el vencimiento por WhatsApp con el mensaje escrito.
 * El saldo se recalcula solo y la financiación se cierra sola cuando no
 * queda nada pendiente.
 */
export function CuotasPlan({
  slug,
  cuotas,
  moneda,
  cliente,
  telefono,
  descripcion,
  negocio,
}: {
  slug: string;
  cuotas: CuotaRow[];
  moneda: string;
  cliente: string;
  telefono: string | null;
  descripcion: string | null;
  negocio?: string;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [parcial, setParcial] = useState<{ id: string; monto: string; metodo: string } | null>(null);
  const [error, setError] = useState("");

  async function accion(cuotaId: string, body: Record<string, unknown>) {
    setOcupado(cuotaId);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/conce/cuotas/${cuotaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No se pudo guardar");
      }
      setParcial(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setOcupado(null);
    }
  }

  const totalCuotas = cuotas.length;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Plan de cuotas ({totalCuotas})
        </h2>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

      <Table>
        <thead>
          <tr>
            <Th className="w-12">#</Th>
            <Th>Vence</Th>
            <Th className="text-right">Monto</Th>
            <Th className="text-right">Cobrado</Th>
            <Th className="text-right">Saldo</Th>
            <Th>Estado</Th>
            <Th>Pago</Th>
            <Th className="w-64"></Th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c) => {
            const venc = new Date(`${c.vencIso}T12:00:00-03:00`);
            const saldo = Math.max(0, c.monto - c.montoPagado);
            const pagada = saldo <= 0.5;
            const dias = diasHasta(venc);
            const vencida = !pagada && dias < 0;
            const mensaje = mensajeAvisoCuota({
              nombre: cliente,
              numeroCuota: c.numero,
              cantidadCuotas: totalCuotas,
              vehiculo: descripcion,
              fechaVencimiento: venc,
              saldo,
              moneda,
              negocio,
            });
            return (
              <tr key={c.id} className={pagada ? "opacity-70" : vencida ? "bg-destructive/5" : ""}>
                <Td className="font-mono text-sm">{c.numero}</Td>
                <Td className="text-sm">
                  {fmtFecha(venc)}
                  {!pagada ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {dias < 0
                        ? `(hace ${Math.abs(dias)}d)`
                        : dias === 0
                          ? "(hoy)"
                          : `(en ${dias}d)`}
                    </span>
                  ) : null}
                </Td>
                <Td className="text-right text-sm">{fmtPlata(c.monto, moneda)}</Td>
                <Td className="text-right text-sm">
                  {c.montoPagado > 0 ? fmtPlata(c.montoPagado, moneda) : "—"}
                </Td>
                <Td className="text-right text-sm font-semibold">
                  {saldo > 0 ? fmtPlata(saldo, moneda) : "—"}
                </Td>
                <Td>
                  <Badge
                    variant={pagada ? "success" : vencida ? "destructive" : "warning"}
                  >
                    {pagada
                      ? CUOTA_ESTADO_LABEL.PAGADA
                      : vencida
                        ? CUOTA_ESTADO_LABEL.VENCIDA
                        : c.montoPagado > 0
                          ? "Parcial"
                          : CUOTA_ESTADO_LABEL.PENDIENTE}
                  </Badge>
                </Td>
                <Td className="text-xs text-muted-foreground">
                  {c.pagoIso ? fmtFecha(new Date(`${c.pagoIso}T12:00:00-03:00`)) : "—"}
                  {c.metodoPago ? ` · ${c.metodoPago}` : ""}
                </Td>
                <Td>
                  {parcial?.id === c.id ? (
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={c.monto}
                        value={parcial.monto}
                        onChange={(e) => setParcial({ ...parcial, monto: e.target.value })}
                        placeholder="Cuánto entró"
                        className="h-8 w-28 rounded border border-primary bg-card px-1.5 text-sm"
                      />
                      <select
                        value={parcial.metodo}
                        onChange={(e) => setParcial({ ...parcial, metodo: e.target.value })}
                        className="h-8 rounded border bg-card px-1.5 text-sm"
                      >
                        {METODOS_PAGO.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={ocupado === c.id}
                        onClick={() =>
                          accion(c.id, {
                            accion: "parcial",
                            montoPagado: Number(parcial.monto) || 0,
                            metodoPago: parcial.metodo,
                          })
                        }
                        className="h-8 rounded-md bg-primary px-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setParcial(null)}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {!pagada ? (
                        <>
                          <button
                            type="button"
                            disabled={ocupado === c.id}
                            onClick={() => accion(c.id, { accion: "pagar", metodoPago: "efectivo" })}
                            title="Cobrar el saldo completo de esta cuota"
                            className="h-8 rounded-md bg-primary px-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                          >
                            ✓ Cobrar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setParcial({ id: c.id, monto: String(c.montoPagado || ""), metodo: "efectivo" })
                            }
                            title="Cargar un pago parcial"
                            className="h-8 rounded-md border px-2 text-sm font-medium hover:bg-muted"
                          >
                            Parte
                          </button>
                          {telefono ? (
                            <a
                              href={waLink(telefono, mensaje)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => void accion(c.id, { accion: "avisado" })}
                              title={c.avisado ? "Ya se avisó — mandar de nuevo" : "Avisar el vencimiento"}
                              className="h-8 rounded-md border px-2 text-sm font-medium hover:bg-muted"
                            >
                              💬{c.avisado ? " ✓" : ""}
                            </a>
                          ) : null}
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={ocupado === c.id}
                          onClick={() => accion(c.id, { accion: "deshacer" })}
                          title="Deshacer el cobro"
                          className="h-8 rounded-md border px-2 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
                        >
                          ↺ Deshacer
                        </button>
                      )}
                    </div>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}
