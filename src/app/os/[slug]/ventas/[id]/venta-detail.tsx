"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState, Field, Input, Spinner } from "@/components/ui";
import { fmtArs } from "../../_components/money";
import { saldoDeVenta, type PagoVenta } from "../saldo";

export type VentaData = {
  id: string;
  numero: number;
  descripcion: string;
  precioArs: number;
  senaArs: number;
  permutaDetalle: string | null;
  permutaValorArs: number;
  pagos: PagoVenta[];
  cuotas: { cantidad: number; valorArs: number; diaVencimiento: number } | null;
  estado: string;
  notas: string | null;
  contacto: { id: string; name: string; phone: string | null } | null;
};

/** Detalle de la venta: los números arriba, cobrar en el medio, entregar al final. */
export function VentaDetail({ slug, venta }: { slug: string; venta: VentaData }) {
  const router = useRouter();
  const [pagos, setPagos] = useState<PagoVenta[]>(venta.pagos);
  const [monto, setMonto] = useState("");
  const [medio, setMedio] = useState("efectivo");
  const [cuotasCant, setCuotasCant] = useState(venta.cuotas ? String(venta.cuotas.cantidad) : "");
  const [cuotasValor, setCuotasValor] = useState(venta.cuotas ? String(venta.cuotas.valorArs) : "");
  const [cuotasDia, setCuotasDia] = useState(venta.cuotas ? String(venta.cuotas.diaVencimiento) : "10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const saldo = saldoDeVenta(venta.precioArs, venta.senaArs, venta.permutaValorArs, pagos);
  const abierta = venta.estado === "SENADA";

  async function patch(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/os/${slug}/ventas/${venta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "No se pudo guardar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  function registrarPago(e: React.FormEvent) {
    e.preventDefault();
    const m = Number(monto);
    if (!m || m <= 0) return;
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
    const nuevos = [...pagos, { fecha: hoy, montoArs: m, medio }];
    setPagos(nuevos);
    setMonto("");
    void patch({ pagos: nuevos });
  }

  function guardarCuotas() {
    const cantidad = Number.parseInt(cuotasCant || "0", 10);
    if (!cantidad) {
      void patch({ cuotas: null });
      return;
    }
    void patch({
      cuotas: {
        cantidad,
        valorArs: Number(cuotasValor) || 0,
        diaVencimiento: Number.parseInt(cuotasDia || "10", 10),
      },
    });
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}

      {/* Los números de la operación */}
      <Card className="p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Precio</dt>
            <dd className="font-bold tabular-nums">{fmtArs(venta.precioArs)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Seña</dt>
            <dd className="font-semibold tabular-nums">{fmtArs(venta.senaArs)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Permuta{venta.permutaDetalle ? ` (${venta.permutaDetalle})` : ""}
            </dt>
            <dd className="font-semibold tabular-nums">{fmtArs(venta.permutaValorArs)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Saldo</dt>
            <dd className={`text-lg font-bold tabular-nums ${saldo > 0 ? "text-warning" : "text-success"}`}>
              {saldo > 0 ? fmtArs(saldo) : "Saldada ✓"}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Pagos */}
      <Card className="p-4 sm:p-5">
        <h2 className="mb-3 font-semibold">Pagos</h2>
        {pagos.length === 0 ? (
          <p className="mb-3 rounded-md border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">
            Sin pagos registrados (además de la seña).
          </p>
        ) : (
          <ul className="mb-3 divide-y">
            {pagos.map((p, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">
                  {p.fecha} · {p.medio}
                </span>
                <span className="font-medium tabular-nums">{fmtArs(p.montoArs)}</span>
              </li>
            ))}
          </ul>
        )}
        {abierta ? (
          <form onSubmit={registrarPago} className="flex flex-wrap items-end gap-3 border-t pt-3">
            <Field label="Monto (ARS)">
              <Input type="number" min={0} value={monto} onChange={(e) => setMonto(e.target.value)} className="w-36" />
            </Field>
            <Field label="Medio">
              <select
                value={medio}
                onChange={(e) => setMedio(e.target.value)}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="mp">Mercado Pago</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </Field>
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? <Spinner /> : null} Registrar pago
            </Button>
          </form>
        ) : null}
      </Card>

      {/* Cuotas propias */}
      {abierta || venta.cuotas ? (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-1 font-semibold">Financiación propia</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Si el saldo va en cuotas, dejalo anotado: el sistema te recuerda los vencimientos.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Cuotas">
              <Input type="number" min={0} max={120} value={cuotasCant} onChange={(e) => setCuotasCant(e.target.value)} className="w-24" />
            </Field>
            <Field label="Valor de cuota (ARS)">
              <Input type="number" min={0} value={cuotasValor} onChange={(e) => setCuotasValor(e.target.value)} className="w-36" />
            </Field>
            <Field label="Vence el día" help="Del 1 al 28.">
              <Input type="number" min={1} max={28} value={cuotasDia} onChange={(e) => setCuotasDia(e.target.value)} className="w-24" />
            </Field>
            <Button size="sm" variant="secondary" onClick={guardarCuotas} disabled={busy}>
              Guardar cuotas
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Entrega / cancelación */}
      {abierta ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            {saldo > 0
              ? `Ojo: todavía debe ${fmtArs(saldo)}. Podés entregar igual si va en cuotas.`
              : "Saldada — lista para entregar."}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => void patch({ estado: "ENTREGADA" })} disabled={busy}>
              {busy ? <Spinner /> : null} Entregar
            </Button>
            <Button variant="ghost" onClick={() => void patch({ estado: "CANCELADA" })} disabled={busy}>
              Cancelar venta
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
