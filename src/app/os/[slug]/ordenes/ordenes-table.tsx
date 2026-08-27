"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OrdenFacturacion } from "@/lib/vidrios";

export type OrdenRow = {
  id: string;
  numero: number;
  nombre: string;
  telefono: string | null;
  vehiculo: string;
  total: number;
  senia: number;
  estado: string; // PENDIENTE | CONFIRMADA | COLOCADO
  facturacion: OrdenFacturacion;
  fecha: string;
  fechaColocacion: string | null;
};

const FACT_TONO: Record<OrdenFacturacion, string> = {
  sin_facturar: "bg-muted text-muted-foreground",
  a_facturar: "bg-warning/15 text-warning",
  facturada: "bg-success/15 text-success",
};
const FACT_LABEL: Record<OrdenFacturacion, string> = {
  sin_facturar: "Sin facturar",
  a_facturar: "A facturar",
  facturada: "Facturada",
};

/** Tabla de órdenes con el estado del trabajo editable de un toque. */
export function OrdenesTable({ slug, ordenes }: { slug: string; ordenes: OrdenRow[] }) {
  const router = useRouter();
  const [ocupada, setOcupada] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [fecha, setFecha] = useState("");
  const plata = (n: number) => `$ ${n.toLocaleString("es-AR")}`;
  const manana = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  async function patch(id: string, body: Record<string, unknown>) {
    setOcupada(id);
    await fetch(`/api/os/${slug}/ordenes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setOcupada(null);
    router.refresh();
  }

  // Ciclo del estado: pendiente → (confirmar con fecha) → en taller → colocado → pendiente.
  async function clickEstado(o: OrdenRow) {
    if (o.estado === "PENDIENTE") {
      setFecha(manana());
      setConfirmando(o.id);
      return;
    }
    await patch(o.id, { estado: o.estado === "CONFIRMADA" ? "COLOCADO" : "PENDIENTE" });
  }

  async function confirmarATaller(o: OrdenRow) {
    setConfirmando(null);
    await patch(o.id, { estado: "CONFIRMADA", fechaColocacion: fecha || manana() });
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5">N°</th>
            <th className="px-3 py-2.5">Cliente</th>
            <th className="px-3 py-2.5">Vehículo</th>
            <th className="px-3 py-2.5 text-right">Total</th>
            <th className="px-3 py-2.5 text-right">Seña</th>
            <th className="px-3 py-2.5">Trabajo</th>
            <th className="px-3 py-2.5">Facturación</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {ordenes.map((o) => (
            <tr key={o.id} className="transition-colors hover:bg-muted/30">
              <td className="px-3 py-2.5 font-semibold">#{String(o.numero).padStart(4, "0")}</td>
              <td className="px-3 py-2.5">
                <p className="font-medium">{o.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {o.telefono ?? ""}
                  {o.telefono ? " · " : ""}
                  {o.fecha}
                </p>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">{o.vehiculo || "—"}</td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{plata(o.total)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                {o.senia > 0 ? plata(o.senia) : "—"}
              </td>
              <td className="px-3 py-2.5">
                {confirmando === o.id ? (
                  <span className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="h-7 rounded-md border bg-card px-1.5 text-xs"
                    />
                    <button
                      onClick={() => confirmarATaller(o)}
                      className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      → Taller
                    </button>
                    <button onClick={() => setConfirmando(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                  </span>
                ) : (
                  <button
                    onClick={() => clickEstado(o)}
                    disabled={ocupada === o.id}
                    title={o.estado === "PENDIENTE" ? "Confirmar y mandar al taller" : "Click para cambiar el estado"}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition hover:opacity-80 disabled:opacity-50 ${
                      o.estado === "COLOCADO"
                        ? "bg-success/15 text-success"
                        : o.estado === "CONFIRMADA"
                          ? "bg-primary/15 text-primary"
                          : "bg-warning/15 text-warning"
                    }`}
                  >
                    {o.estado === "COLOCADO"
                      ? "✓ Colocado"
                      : o.estado === "CONFIRMADA"
                        ? `🔧 En taller${o.fechaColocacion ? ` · ${o.fechaColocacion.split("-").reverse().slice(0, 2).join("/")}` : ""}`
                        : "⏳ Confirmar → Taller"}
                  </button>
                )}
              </td>
              <td className="px-3 py-2.5">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${FACT_TONO[o.facturacion]}`}>
                  {FACT_LABEL[o.facturacion]}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right">
                <Link
                  href={`/os/${slug}/ordenes/${o.id}/imprimir`}
                  target="_blank"
                  className="rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-muted"
                >
                  🖨 Boleto
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
